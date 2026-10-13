# Lumi

Windows tray app to control Tuya smart devices through the cloud.

## Requirements

- Devices must be paired in the **Smart Life** app (some white-label vendor apps do not let you link their account to a Tuya IoT project).
- A project on iot.tuya.com with the Smart Life account linked (Devices → Link App Account) and the IoT Core, Authorization Token Management and Smart Home Basic Service APIs enabled.
- Rust, Node.js and the Windows WebView2 runtime.

## Run

    npm install
    npm run tauri dev

On first launch, enter the project's Access ID, Access Secret and region. They are stored in Windows Credential Manager.

## Tests

    npm test                      # frontend
    cd src-tauri && cargo test    # Rust core

Live test against the Tuya API (uses the environment variables `TUYA_ACCESS_ID`, `TUYA_ACCESS_KEY`, `TUYA_REGION`):

    cargo test live_smoke -- --ignored --nocapture
