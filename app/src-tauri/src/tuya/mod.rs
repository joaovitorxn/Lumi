pub mod client;
pub mod sign;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Region {
    Us,
    Eu,
    Cn,
    In,
}

impl Region {
    pub fn base_url(self) -> &'static str {
        match self {
            Region::Us => "https://openapi.tuyaus.com",
            Region::Eu => "https://openapi.tuyaeu.com",
            Region::Cn => "https://openapi.tuyacn.com",
            Region::In => "https://openapi.tuyain.com",
        }
    }
}

#[derive(Debug, Clone, PartialEq, thiserror::Error)]
pub enum Error {
    #[error("sem conexão com a Tuya: {0}")]
    Network(String),
    #[error("credenciais Tuya inválidas: {0}")]
    Auth(String),
    #[error("erro da API Tuya ({code}): {msg}")]
    Api { code: i64, msg: String },
    #[error("resposta inesperada da Tuya: {0}")]
    Decode(String),
}

#[derive(Debug, Clone, Deserialize)]
pub struct TuyaDevice {
    pub id: String,
    pub name: String,
    pub category: String,
    #[serde(default)]
    pub online: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StatusItem {
    pub code: String,
    pub value: serde_json::Value,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Command {
    pub code: String,
    pub value: serde_json::Value,
}
