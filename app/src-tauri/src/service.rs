use std::sync::Arc;

use futures::future::join_all;
use serde::Serialize;
use tokio::sync::RwLock;

use crate::devices::camera::{self, CameraAction, CATEGORY_CAMERA};
use crate::devices::light::{commands_for, LightAction, CATEGORY_LIGHT};
use crate::devices::{build_view, DeviceView};
use crate::secrets::{Credentials, SecretStore, StoreError};
use crate::tuya::client::TuyaClient;
use crate::tuya::Error as TuyaError;

/// Error shape sent to the UI: `kind` drives behaviour, `message` is shown to the person.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct CommandError {
    pub kind: String,
    pub message: String,
}

impl CommandError {
    fn new(kind: &str, message: impl Into<String>) -> Self {
        Self {
            kind: kind.into(),
            message: message.into(),
        }
    }
}

impl From<TuyaError> for CommandError {
    fn from(e: TuyaError) -> Self {
        let kind = match e {
            TuyaError::Network(_) => "network",
            TuyaError::Auth(_) => "auth",
            TuyaError::Api { .. } => "api",
            TuyaError::Decode(_) => "decode",
        };
        Self::new(kind, e.to_string())
    }
}

impl From<StoreError> for CommandError {
    fn from(e: StoreError) -> Self {
        Self::new("storage", e.to_string())
    }
}

pub struct DeviceService {
    store: Arc<dyn SecretStore>,
    base_url: Option<String>,
    client: RwLock<Option<Arc<TuyaClient>>>,
}

impl DeviceService {
    pub fn new(store: Arc<dyn SecretStore>) -> Self {
        Self {
            store,
            base_url: None,
            client: RwLock::new(None),
        }
    }

    #[cfg(test)]
    pub fn with_base_url(store: Arc<dyn SecretStore>, base_url: String) -> Self {
        Self {
            base_url: Some(base_url),
            ..Self::new(store)
        }
    }

    pub fn has_credentials(&self) -> Result<bool, CommandError> {
        Ok(self.store.load()?.is_some())
    }

    pub async fn save_credentials(&self, credentials: Credentials) -> Result<(), CommandError> {
        if credentials.access_id.trim().is_empty() || credentials.access_secret.trim().is_empty() {
            return Err(CommandError::new(
                "invalid_input",
                "Access ID e Access Secret são obrigatórios.",
            ));
        }
        let trimmed = Credentials {
            access_id: credentials.access_id.trim().to_string(),
            access_secret: credentials.access_secret.trim().to_string(),
            region: credentials.region,
        };
        self.store.save(&trimmed)?;
        *self.client.write().await = None;
        Ok(())
    }

    async fn client(&self) -> Result<Arc<TuyaClient>, CommandError> {
        if let Some(client) = self.client.read().await.as_ref() {
            return Ok(client.clone());
        }
        let credentials = self.store.load()?.ok_or_else(|| {
            CommandError::new("no_credentials", "Configure suas credenciais Tuya.")
        })?;
        let client = Arc::new(match &self.base_url {
            Some(url) => TuyaClient::new(url.clone(), credentials.access_id, credentials.access_secret),
            None => TuyaClient::for_region(
                credentials.region,
                credentials.access_id,
                credentials.access_secret,
            ),
        });
        *self.client.write().await = Some(client.clone());
        Ok(client)
    }

    pub async fn list_devices(&self) -> Result<Vec<DeviceView>, CommandError> {
        let client = self.client().await?;
        let devices = client.list_devices().await?;
        let views = join_all(devices.iter().map(|device| {
            let client = client.clone();
            async move {
                let readable = device.category == CATEGORY_LIGHT || device.category == CATEGORY_CAMERA;
                let status = if readable && device.online {
                    client.device_status(&device.id).await.ok()
                } else {
                    None
                };
                build_view(device, status.as_deref())
            }
        }))
        .await;
        Ok(views)
    }

    /// A fresh, short-lived HLS URL for a camera.
    pub async fn camera_stream(&self, id: &str) -> Result<String, CommandError> {
        let client = self.client().await?;
        Ok(client.stream_url(id, "HLS").await?)
    }

    pub async fn send_camera_command(
        &self,
        id: &str,
        action: CameraAction,
    ) -> Result<(), CommandError> {
        let client = self.client().await?;
        client.send_commands(id, &camera::commands_for(&action)).await?;
        Ok(())
    }

    pub async fn send_light_command(
        &self,
        id: &str,
        action: LightAction,
    ) -> Result<(), CommandError> {
        let client = self.client().await?;
        client.send_commands(id, &commands_for(&action)).await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::secrets::MemoryStore;
    use crate::tuya::Region;
    use serde_json::{json, Value};
    use wiremock::matchers::{body_json, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    fn creds() -> Credentials {
        Credentials {
            access_id: "id".into(),
            access_secret: "secret".into(),
            region: Region::Us,
        }
    }

    fn ok(result: Value) -> ResponseTemplate {
        ResponseTemplate::new(200).set_body_json(json!({"success": true, "result": result}))
    }

    async fn server_with_token() -> MockServer {
        let server = MockServer::start().await;
        Mock::given(path("/v1.0/token"))
            .respond_with(ok(json!({"access_token": "t", "expire_time": 7200})))
            .mount(&server)
            .await;
        server
    }

    fn service(server: &MockServer) -> DeviceService {
        DeviceService::with_base_url(Arc::new(MemoryStore::with(creds())), server.uri())
    }

    #[tokio::test]
    async fn without_credentials_every_call_reports_no_credentials() {
        let svc = DeviceService::new(Arc::new(MemoryStore::empty()));
        assert!(!svc.has_credentials().unwrap());
        let err = svc.list_devices().await.unwrap_err();
        assert_eq!(err.kind, "no_credentials");
    }

    #[tokio::test]
    async fn blank_credentials_are_rejected_and_not_saved() {
        let store = Arc::new(MemoryStore::empty());
        let svc = DeviceService::new(store.clone());
        let mut blank = creds();
        blank.access_secret = "   ".into();
        let err = svc.save_credentials(blank).await.unwrap_err();
        assert_eq!(err.kind, "invalid_input");
        assert!(!svc.has_credentials().unwrap());
    }

    #[tokio::test]
    async fn saved_credentials_are_trimmed() {
        let store = Arc::new(MemoryStore::empty());
        let svc = DeviceService::new(store.clone());
        let mut padded = creds();
        padded.access_id = "  id\n".into();
        svc.save_credentials(padded).await.unwrap();
        assert_eq!(store.load().unwrap().unwrap().access_id, "id");
    }

    #[tokio::test]
    async fn list_devices_reads_status_only_for_online_lamps_and_cameras() {
        let server = server_with_token().await;
        Mock::given(path("/v1.0/iot-01/associated-users/devices"))
            .respond_with(ok(json!({"devices": [
                {"id": "lamp", "name": "Luz", "category": "dj", "online": true},
                {"id": "off", "name": "Quarto", "category": "dj", "online": false},
                {"id": "plug", "name": "Tomada", "category": "cz", "online": true},
                {"id": "cam", "name": "Camera", "category": "sp", "online": true}
            ], "has_more": false})))
            .mount(&server)
            .await;
        Mock::given(path("/v1.0/devices/lamp/status"))
            .respond_with(ok(json!([{"code": "switch_led", "value": true}])))
            .expect(1)
            .mount(&server)
            .await;
        Mock::given(path("/v1.0/devices/off/status"))
            .respond_with(ok(json!([])))
            .expect(0)
            .mount(&server)
            .await;
        Mock::given(path("/v1.0/devices/plug/status"))
            .respond_with(ok(json!([])))
            .expect(0)
            .mount(&server)
            .await;
        Mock::given(path("/v1.0/devices/cam/status"))
            .respond_with(ok(json!([{"code": "basic_private", "value": true}])))
            .expect(1)
            .mount(&server)
            .await;

        let views = service(&server).list_devices().await.unwrap();
        assert_eq!(views.len(), 4);
        assert!(views[0].light.as_ref().unwrap().on);
        assert!(views[1].light.is_none() && !views[1].online);
        assert!(views[2].light.is_none() && views[2].online);
        assert!(views[3].camera.as_ref().unwrap().private);
    }

    #[tokio::test]
    async fn one_failing_status_does_not_break_the_whole_list() {
        let server = server_with_token().await;
        Mock::given(path("/v1.0/iot-01/associated-users/devices"))
            .respond_with(ok(json!({"devices": [
                {"id": "a", "name": "A", "category": "dj", "online": true},
                {"id": "b", "name": "B", "category": "dj", "online": true}
            ], "has_more": false})))
            .mount(&server)
            .await;
        Mock::given(path("/v1.0/devices/a/status"))
            .respond_with(ok(json!([{"code": "switch_led", "value": true}])))
            .mount(&server)
            .await;
        Mock::given(path("/v1.0/devices/b/status"))
            .respond_with(ResponseTemplate::new(200).set_body_json(
                json!({"success": false, "code": 2001, "msg": "device is offline"}),
            ))
            .mount(&server)
            .await;

        let views = service(&server).list_devices().await.unwrap();
        assert!(views[0].light.is_some());
        assert!(views[1].light.is_none());
    }

    #[tokio::test]
    async fn a_command_is_one_call_that_never_reads_the_status_first() {
        let server = server_with_token().await;
        Mock::given(path("/v1.0/devices/lamp/status"))
            .respond_with(ok(json!([])))
            .expect(0)
            .mount(&server)
            .await;
        Mock::given(method("POST"))
            .and(path("/v1.0/devices/lamp/commands"))
            .and(body_json(json!({"commands": [
                {"code": "bright_value_v2", "value": 400}
            ]})))
            .respond_with(ok(json!(true)))
            .expect(1)
            .mount(&server)
            .await;

        service(&server)
            .send_light_command("lamp", LightAction::SetBrightness { value: 400 })
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn tuya_errors_map_to_ui_error_kinds() {
        let err: CommandError = TuyaError::Auth("x".into()).into();
        assert_eq!(err.kind, "auth");
        let err: CommandError = TuyaError::Network("x".into()).into();
        assert_eq!(err.kind, "network");
    }
}
