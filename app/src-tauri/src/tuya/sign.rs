use hmac::{Hmac, Mac};
use sha2::{Digest, Sha256};

type HmacSha256 = Hmac<Sha256>;

pub fn content_sha256(body: &str) -> String {
    hex::encode(Sha256::digest(body.as_bytes()))
}

/// Path plus query parameters sorted by key, exactly as they are sent on the wire.
pub fn canonical_url(path: &str, query: &[(&str, &str)]) -> String {
    if query.is_empty() {
        return path.to_string();
    }
    let mut sorted = query.to_vec();
    sorted.sort();
    let joined = sorted
        .iter()
        .map(|(k, v)| format!("{k}={v}"))
        .collect::<Vec<_>>()
        .join("&");
    format!("{path}?{joined}")
}

pub struct SignInput<'a> {
    pub client_id: &'a str,
    pub secret: &'a str,
    pub access_token: Option<&'a str>,
    pub t_millis: u64,
    pub nonce: &'a str,
    pub method: &'a str,
    /// Output of `canonical_url`.
    pub url: &'a str,
    pub body: &'a str,
}

pub fn sign(i: &SignInput) -> String {
    let string_to_sign = format!("{}\n{}\n\n{}", i.method, content_sha256(i.body), i.url);
    let payload = format!(
        "{}{}{}{}{}",
        i.client_id,
        i.access_token.unwrap_or(""),
        i.t_millis,
        i.nonce,
        string_to_sign
    );
    let mut mac =
        HmacSha256::new_from_slice(i.secret.as_bytes()).expect("HMAC accepts any key length");
    mac.update(payload.as_bytes());
    hex::encode_upper(mac.finalize().into_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn token_request_signature_matches_reference_vector() {
        let got = sign(&SignInput {
            client_id: "abc123",
            secret: "secret456",
            access_token: None,
            t_millis: 1_700_000_000_000,
            nonce: "",
            method: "GET",
            url: "/v1.0/token?grant_type=1",
            body: "",
        });
        assert_eq!(
            got,
            "2D2386EF2B9C1FFD7816DF37D1023482B44F9DD74F5D569C3AF7B5F9C0CF651B"
        );
    }

    #[test]
    fn business_request_signature_includes_token_and_body_hash() {
        let body = r#"{"commands":[{"code":"switch_led","value":true}]}"#;
        assert_eq!(
            content_sha256(body),
            "8479c9c60cd5d531054c49333c7b361a9ce41b9b313ab8eb6bc9df4141f658ef"
        );
        let got = sign(&SignInput {
            client_id: "abc123",
            secret: "secret456",
            access_token: Some("tok789"),
            t_millis: 1_700_000_000_000,
            nonce: "",
            method: "POST",
            url: "/v1.0/devices/dev1/commands",
            body,
        });
        assert_eq!(
            got,
            "E9FF3A419E1F377DDE060A154847288C9F696C1191B40AC5B27C4AF9CA2AA8C1"
        );
    }

    #[test]
    fn empty_body_hash_is_the_well_known_constant() {
        assert_eq!(
            content_sha256(""),
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
    }

    #[test]
    fn canonical_url_sorts_query_by_key() {
        assert_eq!(
            canonical_url("/v1.0/x", &[("b", "2"), ("a", "1")]),
            "/v1.0/x?a=1&b=2"
        );
        assert_eq!(canonical_url("/v1.0/x", &[]), "/v1.0/x");
    }
}
