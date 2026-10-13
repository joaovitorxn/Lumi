use std::time::{Duration, SystemTime, UNIX_EPOCH};

use reqwest::Method;
use serde::Deserialize;
use serde_json::Value;
use tokio::sync::Mutex;

use super::sign::{canonical_url, sign, SignInput};
use super::{Command, Error, Region, StatusItem, TuyaDevice};

/// Tuya error code for "token invalid" (expired or revoked).
const CODE_TOKEN_INVALID: i64 = 1010;
/// Tuya error codes for a bad signature or an unknown client id.
const CODES_BAD_CREDENTIALS: [i64; 2] = [1004, 1005];
/// Refresh the token this long before it really expires.
const TOKEN_MARGIN_MS: u64 = 60_000;
const MAX_DEVICE_PAGES: usize = 20;
/// Without a timeout one stalled read would hold the token lock and freeze every call.
const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);
const CONNECT_TIMEOUT: Duration = Duration::from_secs(5);

#[derive(Debug, Deserialize)]
struct Envelope {
    success: bool,
    #[serde(default)]
    result: Value,
    code: Option<i64>,
    msg: Option<String>,
}

#[derive(Debug, Clone)]
struct CachedToken {
    value: String,
    valid_until_ms: u64,
}

pub struct TuyaClient {
    http: reqwest::Client,
    base_url: String,
    access_id: String,
    secret: String,
    token: Mutex<Option<CachedToken>>,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock is after 1970")
        .as_millis() as u64
}

impl TuyaClient {
    pub fn new(base_url: impl Into<String>, access_id: String, secret: String) -> Self {
        Self::with_timeout(base_url, access_id, secret, REQUEST_TIMEOUT)
    }

    pub fn with_timeout(
        base_url: impl Into<String>,
        access_id: String,
        secret: String,
        timeout: Duration,
    ) -> Self {
        Self {
            http: reqwest::Client::builder()
                .timeout(timeout)
                .connect_timeout(CONNECT_TIMEOUT)
                .build()
                .expect("HTTP client configuration is valid"),
            base_url: base_url.into(),
            access_id,
            secret,
            token: Mutex::new(None),
        }
    }

    pub fn for_region(region: Region, access_id: String, secret: String) -> Self {
        Self::new(region.base_url(), access_id, secret)
    }

    pub async fn list_devices(&self) -> Result<Vec<TuyaDevice>, Error> {
        let mut devices = Vec::new();
        let mut last_row_key = String::new();
        for _ in 0..MAX_DEVICE_PAGES {
            let query: Vec<(&str, &str)> = if last_row_key.is_empty() {
                vec![]
            } else {
                vec![("last_row_key", last_row_key.as_str())]
            };
            let result = self
                .request(
                    Method::GET,
                    "/v1.0/iot-01/associated-users/devices",
                    &query,
                    None,
                )
                .await?;
            let page: Vec<TuyaDevice> = serde_json::from_value(
                result.get("devices").cloned().unwrap_or(Value::Array(vec![])),
            )
            .map_err(|e| Error::Decode(e.to_string()))?;
            devices.extend(page);
            let has_more = result
                .get("has_more")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            match result.get("last_row_key").and_then(Value::as_str) {
                Some(key) if has_more && !key.is_empty() => last_row_key = key.to_string(),
                _ => break,
            }
        }
        Ok(devices)
    }

    pub async fn device_status(&self, id: &str) -> Result<Vec<StatusItem>, Error> {
        let path = format!("/v1.0/devices/{id}/status");
        let result = self.request(Method::GET, &path, &[], None).await?;
        serde_json::from_value(result).map_err(|e| Error::Decode(e.to_string()))
    }

    pub async fn send_commands(&self, id: &str, commands: &[Command]) -> Result<(), Error> {
        let path = format!("/v1.0/devices/{id}/commands");
        let body = serde_json::json!({ "commands": commands }).to_string();
        self.request(Method::POST, &path, &[], Some(body)).await?;
        Ok(())
    }

    async fn access_token(&self) -> Result<String, Error> {
        let mut guard = self.token.lock().await;
        if let Some(t) = guard.as_ref() {
            if now_ms() < t.valid_until_ms {
                return Ok(t.value.clone());
            }
        }
        let result = self
            .signed_call(
                Method::GET,
                "/v1.0/token",
                &[("grant_type", "1")],
                None,
                None,
            )
            .await
            .map_err(|e| match e {
                Error::Api { code, msg } => Error::Auth(format!("{msg} ({code})")),
                other => other,
            })?;
        let value = result
            .get("access_token")
            .and_then(Value::as_str)
            .ok_or_else(|| Error::Decode("token response without access_token".into()))?
            .to_string();
        let expire_s = result
            .get("expire_time")
            .and_then(Value::as_u64)
            .unwrap_or(0);
        let valid_until_ms = (now_ms() + expire_s * 1000).saturating_sub(TOKEN_MARGIN_MS);
        *guard = Some(CachedToken {
            value: value.clone(),
            valid_until_ms,
        });
        Ok(value)
    }

    async fn invalidate_token(&self) {
        *self.token.lock().await = None;
    }

    /// Authenticated call. Refreshes the token and retries once when Tuya says it is invalid.
    async fn request(
        &self,
        method: Method,
        path: &str,
        query: &[(&str, &str)],
        body: Option<String>,
    ) -> Result<Value, Error> {
        let mut retried = false;
        loop {
            let token = self.access_token().await?;
            let outcome = self
                .signed_call(method.clone(), path, query, body.clone(), Some(&token))
                .await;
            match outcome {
                Err(Error::Api { code, .. }) if code == CODE_TOKEN_INVALID && !retried => {
                    retried = true;
                    self.invalidate_token().await;
                }
                Err(Error::Api { code, msg }) if CODES_BAD_CREDENTIALS.contains(&code) => {
                    return Err(Error::Auth(format!("{msg} ({code})")));
                }
                other => return other,
            }
        }
    }

    async fn signed_call(
        &self,
        method: Method,
        path: &str,
        query: &[(&str, &str)],
        body: Option<String>,
        token: Option<&str>,
    ) -> Result<Value, Error> {
        let url = canonical_url(path, query);
        let t = now_ms();
        let body_str = body.clone().unwrap_or_default();
        let signature = sign(&SignInput {
            client_id: &self.access_id,
            secret: &self.secret,
            access_token: token,
            t_millis: t,
            nonce: "",
            method: method.as_str(),
            url: &url,
            body: &body_str,
        });
        let mut req = self
            .http
            .request(method, format!("{}{}", self.base_url, url))
            .header("client_id", &self.access_id)
            .header("sign", signature)
            .header("t", t.to_string())
            .header("sign_method", "HMAC-SHA256");
        if let Some(token) = token {
            req = req.header("access_token", token);
        }
        if let Some(body) = body {
            req = req.header("Content-Type", "application/json").body(body);
        }
        let response = req
            .send()
            .await
            .map_err(|e| Error::Network(e.to_string()))?;
        let envelope: Envelope = response
            .json()
            .await
            .map_err(|e| Error::Decode(e.to_string()))?;
        if envelope.success {
            Ok(envelope.result)
        } else {
            Err(Error::Api {
                code: envelope.code.unwrap_or(-1),
                msg: envelope.msg.unwrap_or_default(),
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use wiremock::matchers::{body_json, header_exists, method, path, query_param};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    fn token_ok(expire_s: u64) -> ResponseTemplate {
        ResponseTemplate::new(200).set_body_json(json!({
            "success": true, "t": 1,
            "result": {"access_token": "tok-1", "expire_time": expire_s, "refresh_token": "r", "uid": "u"}
        }))
    }

    fn api_ok(result: Value) -> ResponseTemplate {
        ResponseTemplate::new(200).set_body_json(json!({"success": true, "result": result}))
    }

    fn api_err(code: i64, msg: &str) -> ResponseTemplate {
        ResponseTemplate::new(200).set_body_json(json!({"success": false, "code": code, "msg": msg}))
    }

    fn client(server: &MockServer) -> TuyaClient {
        TuyaClient::new(server.uri(), "id".into(), "secret".into())
    }

    #[tokio::test]
    async fn lists_devices_and_sends_signature_headers() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path("/v1.0/token"))
            .and(query_param("grant_type", "1"))
            .and(header_exists("sign"))
            .and(header_exists("client_id"))
            .and(header_exists("t"))
            .respond_with(token_ok(7200))
            .expect(1)
            .mount(&server)
            .await;
        Mock::given(method("GET"))
            .and(path("/v1.0/iot-01/associated-users/devices"))
            .and(header_exists("access_token"))
            .and(header_exists("sign"))
            .respond_with(api_ok(json!({
                "devices": [{"id": "d1", "name": "Luz", "category": "dj", "online": true}],
                "has_more": false
            })))
            .expect(1)
            .mount(&server)
            .await;

        let devices = client(&server).list_devices().await.unwrap();
        assert_eq!(devices.len(), 1);
        assert_eq!(devices[0].name, "Luz");
        assert!(devices[0].online);
    }

    #[tokio::test]
    async fn follows_pagination_until_has_more_is_false() {
        let server = MockServer::start().await;
        Mock::given(path("/v1.0/token"))
            .respond_with(token_ok(7200))
            .mount(&server)
            .await;
        Mock::given(path("/v1.0/iot-01/associated-users/devices"))
            .and(query_param("last_row_key", "k1"))
            .respond_with(api_ok(json!({
                "devices": [{"id": "d2", "name": "B", "category": "cz"}],
                "has_more": false
            })))
            .expect(1)
            .mount(&server)
            .await;
        Mock::given(path("/v1.0/iot-01/associated-users/devices"))
            .respond_with(api_ok(json!({
                "devices": [{"id": "d1", "name": "A", "category": "dj"}],
                "has_more": true, "last_row_key": "k1"
            })))
            .mount(&server)
            .await;

        let devices = client(&server).list_devices().await.unwrap();
        let ids: Vec<_> = devices.iter().map(|d| d.id.as_str()).collect();
        assert_eq!(ids, ["d1", "d2"]);
    }

    #[tokio::test]
    async fn token_is_cached_between_calls() {
        let server = MockServer::start().await;
        Mock::given(path("/v1.0/token"))
            .respond_with(token_ok(7200))
            .expect(1)
            .mount(&server)
            .await;
        Mock::given(path("/v1.0/devices/d1/status"))
            .respond_with(api_ok(json!([{"code": "switch_led", "value": true}])))
            .mount(&server)
            .await;
        let c = client(&server);
        c.device_status("d1").await.unwrap();
        let status = c.device_status("d1").await.unwrap();
        assert_eq!(status[0].code, "switch_led");
    }

    #[tokio::test]
    async fn token_inside_the_safety_margin_is_refreshed() {
        let server = MockServer::start().await;
        Mock::given(path("/v1.0/token"))
            .respond_with(token_ok(30))
            .expect(2)
            .mount(&server)
            .await;
        Mock::given(path("/v1.0/devices/d1/status"))
            .respond_with(api_ok(json!([])))
            .mount(&server)
            .await;
        let c = client(&server);
        c.device_status("d1").await.unwrap();
        c.device_status("d1").await.unwrap();
    }

    #[tokio::test]
    async fn expired_token_is_refreshed_and_the_call_retried_once() {
        let server = MockServer::start().await;
        Mock::given(path("/v1.0/token"))
            .respond_with(token_ok(7200))
            .expect(2)
            .mount(&server)
            .await;
        Mock::given(path("/v1.0/devices/d1/status"))
            .respond_with(api_err(1010, "token invalid"))
            .up_to_n_times(1)
            .mount(&server)
            .await;
        Mock::given(path("/v1.0/devices/d1/status"))
            .respond_with(api_ok(json!([])))
            .mount(&server)
            .await;
        assert!(client(&server).device_status("d1").await.unwrap().is_empty());
    }

    #[tokio::test]
    async fn persistent_token_error_is_returned_not_looped() {
        let server = MockServer::start().await;
        Mock::given(path("/v1.0/token"))
            .respond_with(token_ok(7200))
            .mount(&server)
            .await;
        Mock::given(path("/v1.0/devices/d1/status"))
            .respond_with(api_err(1010, "token invalid"))
            .expect(2)
            .mount(&server)
            .await;
        let err = client(&server).device_status("d1").await.unwrap_err();
        assert!(matches!(err, Error::Api { code: 1010, .. }));
    }

    #[tokio::test]
    async fn bad_signature_on_token_request_is_an_auth_error() {
        let server = MockServer::start().await;
        Mock::given(path("/v1.0/token"))
            .respond_with(api_err(1004, "sign invalid"))
            .mount(&server)
            .await;
        let err = client(&server).list_devices().await.unwrap_err();
        assert!(matches!(err, Error::Auth(_)), "got {err:?}");
    }

    #[tokio::test]
    async fn send_commands_posts_the_commands_body() {
        let server = MockServer::start().await;
        Mock::given(path("/v1.0/token"))
            .respond_with(token_ok(7200))
            .mount(&server)
            .await;
        Mock::given(method("POST"))
            .and(path("/v1.0/devices/d1/commands"))
            .and(body_json(
                json!({"commands": [{"code": "switch_led", "value": false}]}),
            ))
            .respond_with(api_ok(json!(true)))
            .expect(1)
            .mount(&server)
            .await;
        client(&server)
            .send_commands(
                "d1",
                &[Command {
                    code: "switch_led".into(),
                    value: json!(false),
                }],
            )
            .await
            .unwrap();
    }

    /// Hits the real Tuya cloud to prove the signing scheme end to end.
    /// Needs TUYA_ACCESS_ID, TUYA_ACCESS_KEY and TUYA_REGION (us|eu|cn|in) in the environment.
    /// Run with: cargo test live_smoke -- --ignored --nocapture
    #[tokio::test]
    #[ignore]
    async fn live_smoke_lists_devices_and_reads_a_lamp_status() {
        let region: Region = serde_json::from_value(json!(std::env::var("TUYA_REGION").unwrap()))
            .expect("TUYA_REGION must be us, eu, cn or in");
        let c = TuyaClient::for_region(
            region,
            std::env::var("TUYA_ACCESS_ID").unwrap(),
            std::env::var("TUYA_ACCESS_KEY").unwrap(),
        );
        let devices = c.list_devices().await.unwrap();
        println!("{} device(s)", devices.len());
        for d in &devices {
            println!("  {} [{}] online={}", d.name, d.category, d.online);
        }
        let lamp = devices
            .iter()
            .find(|d| d.category == "dj" && d.online)
            .expect("no online lamp found");
        let status = c.device_status(&lamp.id).await.unwrap();
        assert!(status.iter().any(|s| s.code == "switch_led"));
    }

    #[tokio::test]
    async fn unreachable_server_is_a_network_error() {
        let c = TuyaClient::new("http://127.0.0.1:1", "id".into(), "secret".into());
        assert!(matches!(
            c.list_devices().await.unwrap_err(),
            Error::Network(_)
        ));
    }

    #[tokio::test]
    async fn a_stalled_response_times_out_as_a_network_error() {
        let server = MockServer::start().await;
        Mock::given(path("/v1.0/token"))
            .respond_with(token_ok(7200).set_delay(std::time::Duration::from_millis(600)))
            .mount(&server)
            .await;
        let c = TuyaClient::with_timeout(
            server.uri(),
            "id".into(),
            "secret".into(),
            std::time::Duration::from_millis(150),
        );
        assert!(matches!(
            c.list_devices().await.unwrap_err(),
            Error::Network(_)
        ));
    }
}
