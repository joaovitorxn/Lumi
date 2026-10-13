# Positivo Tray

App de bandeja do Windows para controlar dispositivos Positivo Casa Inteligente (Tuya) pela nuvem.

## Pré-requisitos

- Os dispositivos precisam estar pareados no app **Smart Life** (o app Positivo não deixa vincular a conta a um projeto Tuya IoT).
- Projeto em iot.tuya.com com a conta do Smart Life vinculada (Devices → Link App Account) e os serviços IoT Core, Authorization Token Management e Smart Home Basic Service ativos.
- Rust, Node.js e o WebView2 do Windows.

## Rodar

    npm install
    npm run tauri dev

Na primeira execução, informe Access ID, Access Secret e a região do projeto. Ficam no Gerenciador de Credenciais do Windows.

## Testes

    npm test                      # frontend
    cd src-tauri && cargo test    # núcleo Rust

Teste ao vivo contra a API Tuya (usa variáveis de ambiente `TUYA_ACCESS_ID`, `TUYA_ACCESS_KEY`, `TUYA_REGION`):

    cargo test live_smoke -- --ignored --nocapture
