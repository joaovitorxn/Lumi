use serde::{Deserialize, Serialize};

use crate::tuya::Region;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Credentials {
    pub access_id: String,
    pub access_secret: String,
    pub region: Region,
}

#[derive(Debug, Clone, PartialEq, thiserror::Error)]
#[error("armazenamento de credenciais: {0}")]
pub struct StoreError(pub String);

pub trait SecretStore: Send + Sync {
    fn load(&self) -> Result<Option<Credentials>, StoreError>;
    fn save(&self, credentials: &Credentials) -> Result<(), StoreError>;
}

const KEYRING_USER: &str = "tuya-credentials";

/// Windows Credential Manager, one JSON entry for all three values.
pub struct KeyringStore {
    service: String,
}

impl KeyringStore {
    pub fn new(service: impl Into<String>) -> Self {
        Self {
            service: service.into(),
        }
    }

    fn entry(&self) -> Result<keyring::Entry, StoreError> {
        keyring::Entry::new(&self.service, KEYRING_USER).map_err(|e| StoreError(e.to_string()))
    }
}

impl SecretStore for KeyringStore {
    fn load(&self) -> Result<Option<Credentials>, StoreError> {
        match self.entry()?.get_password() {
            Ok(json) => serde_json::from_str(&json)
                .map(Some)
                .map_err(|e| StoreError(format!("credenciais salvas estão corrompidas: {e}"))),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(StoreError(e.to_string())),
        }
    }

    fn save(&self, credentials: &Credentials) -> Result<(), StoreError> {
        let json = serde_json::to_string(credentials).map_err(|e| StoreError(e.to_string()))?;
        self.entry()?
            .set_password(&json)
            .map_err(|e| StoreError(e.to_string()))
    }
}

#[cfg(test)]
impl KeyringStore {
    fn clear(&self) -> Result<(), StoreError> {
        match self.entry()?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(e) => Err(StoreError(e.to_string())),
        }
    }
}

#[cfg(test)]
pub struct MemoryStore(pub std::sync::Mutex<Option<Credentials>>);

#[cfg(test)]
impl MemoryStore {
    pub fn empty() -> Self {
        Self(std::sync::Mutex::new(None))
    }

    pub fn with(credentials: Credentials) -> Self {
        Self(std::sync::Mutex::new(Some(credentials)))
    }
}

#[cfg(test)]
impl SecretStore for MemoryStore {
    fn load(&self) -> Result<Option<Credentials>, StoreError> {
        Ok(self.0.lock().unwrap().clone())
    }

    fn save(&self, credentials: &Credentials) -> Result<(), StoreError> {
        *self.0.lock().unwrap() = Some(credentials.clone());
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> Credentials {
        Credentials {
            access_id: "id".into(),
            access_secret: "secret".into(),
            region: Region::Us,
        }
    }

    #[test]
    fn credentials_round_trip_through_json_with_lowercase_region() {
        let json = serde_json::to_string(&sample()).unwrap();
        assert!(json.contains(r#""region":"us""#), "{json}");
        assert_eq!(serde_json::from_str::<Credentials>(&json).unwrap(), sample());
    }

    #[test]
    fn memory_store_saves_and_loads() {
        let store = MemoryStore::empty();
        assert_eq!(store.load().unwrap(), None);
        store.save(&sample()).unwrap();
        assert_eq!(store.load().unwrap(), Some(sample()));
    }

    /// Touches the real Windows Credential Manager (with a throwaway service name).
    /// Run with: cargo test keyring -- --ignored
    #[test]
    #[ignore]
    fn keyring_store_round_trips_in_the_real_credential_manager() {
        let store = KeyringStore::new("positivo-tray-test");
        store.clear().unwrap();
        assert_eq!(store.load().unwrap(), None);
        store.save(&sample()).unwrap();
        assert_eq!(store.load().unwrap(), Some(sample()));
        store.clear().unwrap();
        assert_eq!(store.load().unwrap(), None);
    }
}
