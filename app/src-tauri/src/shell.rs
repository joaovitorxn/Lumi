use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, WindowEvent};

use crate::popup::{click_action, popup_position, ClickAction, Rect};
use crate::service::DeviceService;

const MAIN_WINDOW: &str = "main";
const TRAY_ID: &str = "main";
const REFRESH_EVERY: Duration = Duration::from_secs(10);

/// When the popup was last hidden because it lost focus.
#[derive(Default)]
pub struct PopupState {
    last_blur_hide: Mutex<Option<Instant>>,
}

pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let settings = MenuItem::with_id(app, "settings", "Configurações", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&settings, &quit])?;

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(
            app.default_window_icon()
                .cloned()
                .ok_or("o app precisa de um ícone padrão")?,
        )
        .tooltip("Positivo Tray")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "settings" => {
                show_popup(app, tray_rect(app));
                let _ = app.emit("open-settings", ());
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                rect,
                ..
            } = event
            {
                toggle_popup(tray.app_handle(), rect);
            }
        })
        .build(app)?;

    let handle = app.handle().clone();
    let window = app
        .get_webview_window(MAIN_WINDOW)
        .ok_or("janela principal não encontrada")?;
    window.on_window_event(move |event| {
        if let WindowEvent::Focused(false) = event {
            if let Some(window) = handle.get_webview_window(MAIN_WINDOW) {
                let _ = window.hide();
            }
            *handle.state::<PopupState>().last_blur_hide.lock().unwrap() = Some(Instant::now());
        }
    });

    spawn_refresh_loop(app.handle().clone());
    Ok(())
}

fn tray_rect(app: &AppHandle) -> Option<tauri::Rect> {
    app.tray_by_id(TRAY_ID)?.rect().ok().flatten()
}

fn toggle_popup(app: &AppHandle, rect: tauri::Rect) {
    let Some(window) = app.get_webview_window(MAIN_WINDOW) else {
        return;
    };
    let since_blur = app
        .state::<PopupState>()
        .last_blur_hide
        .lock()
        .unwrap()
        .map(|at| at.elapsed().as_millis());
    match click_action(window.is_visible().unwrap_or(false), since_blur) {
        ClickAction::Hide => {
            let _ = window.hide();
        }
        ClickAction::Ignore => {}
        ClickAction::Show => show_popup(app, Some(rect)),
    }
}

fn show_popup(app: &AppHandle, rect: Option<tauri::Rect>) {
    let Some(window) = app.get_webview_window(MAIN_WINDOW) else {
        return;
    };
    match rect {
        Some(rect) => {
            let scale = window.scale_factor().unwrap_or(1.0);
            let pos = rect.position.to_physical::<i32>(scale);
            let size = rect.size.to_physical::<u32>(scale);
            let monitor = app
                .monitor_from_point(pos.x as f64, pos.y as f64)
                .ok()
                .flatten()
                .or_else(|| app.primary_monitor().ok().flatten());
            if let (Some(monitor), Ok(win)) = (monitor, window.outer_size()) {
                let origin = monitor.position();
                let relative = Rect {
                    x: pos.x - origin.x,
                    y: pos.y - origin.y,
                    w: size.width,
                    h: size.height,
                };
                let screen = (monitor.size().width, monitor.size().height);
                let (x, y) = popup_position(relative, (win.width, win.height), screen);
                let _ = window.set_position(PhysicalPosition::new(x + origin.x, y + origin.y));
            }
        }
        None => {
            let _ = window.center();
        }
    }
    let _ = window.show();
    let _ = window.set_focus();
    let _ = app.emit("popup-shown", ());
}

/// While the popup is visible, push fresh device status to the UI every few seconds.
fn spawn_refresh_loop(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(REFRESH_EVERY).await;
            let visible = app
                .get_webview_window(MAIN_WINDOW)
                .and_then(|w| w.is_visible().ok())
                .unwrap_or(false);
            if !visible {
                continue;
            }
            let service = app.state::<DeviceService>();
            match service.list_devices().await {
                Ok(devices) => {
                    let _ = app.emit("devices-updated", devices);
                }
                Err(error) => {
                    let _ = app.emit("devices-error", error);
                }
            }
        }
    });
}
