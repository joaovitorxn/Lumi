use tauri::State;

use crate::devices::light::LightAction;
use crate::devices::DeviceView;
use crate::secrets::Credentials;
use crate::service::{CommandError, DeviceService};
use crate::tuya::Region;

#[tauri::command]
pub fn has_credentials(service: State<'_, DeviceService>) -> Result<bool, CommandError> {
    service.has_credentials()
}

#[tauri::command]
pub async fn save_credentials(
    service: State<'_, DeviceService>,
    access_id: String,
    access_secret: String,
    region: Region,
) -> Result<(), CommandError> {
    service
        .save_credentials(Credentials {
            access_id,
            access_secret,
            region,
        })
        .await
}

#[tauri::command]
pub async fn list_devices(
    service: State<'_, DeviceService>,
) -> Result<Vec<DeviceView>, CommandError> {
    service.list_devices().await
}

#[tauri::command]
pub async fn send_light_command(
    service: State<'_, DeviceService>,
    id: String,
    action: LightAction,
) -> Result<(), CommandError> {
    service.send_light_command(&id, action).await
}
