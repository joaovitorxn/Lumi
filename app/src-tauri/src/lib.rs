#[cfg(windows)]
mod vsync;
mod commands;
mod devices;
mod popup;
mod secrets;
mod service;
mod shell;
mod tuya;

use std::sync::Arc;

use secrets::KeyringStore;
use service::DeviceService;
use shell::PopupState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // A second launch would add a second tray icon; do nothing instead.
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(DeviceService::new(Arc::new(KeyringStore::new("positivo-tray"))))
        .manage(PopupState::default())
        .invoke_handler(tauri::generate_handler![
            commands::has_credentials,
            commands::save_credentials,
            commands::list_devices,
            commands::send_light_command,
            commands::camera_stream,
            commands::send_camera_command,
            commands::set_tray_labels
        ])
        .setup(|app| shell::setup(app))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
