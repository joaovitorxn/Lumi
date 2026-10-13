use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, WindowEvent};

use crate::popup::{
    click_action, popup_position, slide_start, slide_y, ClickAction, Rect, FRAME_MS, SLIDE_DISTANCE, SLIDE_MS,
};
use crate::service::DeviceService;
#[cfg(windows)]
use crate::vsync;

const MAIN_WINDOW: &str = "main";
const TRAY_ID: &str = "main";
const REFRESH_EVERY: Duration = Duration::from_secs(10);

#[derive(Default)]
pub struct PopupState {
    /// When the popup was last hidden because it lost focus.
    last_blur_hide: Mutex<Option<Instant>>,
    /// Bumped on every slide-in so an older animation stops when a newer one starts.
    slide_generation: AtomicU64,
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
    // (x, start y, final y) of the slide-in, when the popup is anchored to the tray icon.
    let mut slide: Option<(i32, i32, i32)> = None;
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
                let (x, to_y) = (x + origin.x, y + origin.y);
                let from_y = slide_start(to_y, pos.y, (SLIDE_DISTANCE * scale).round() as i32);
                let _ = window.set_position(PhysicalPosition::new(x, from_y));
                slide = Some((x, from_y, to_y));
            }
        }
        None => {
            let _ = window.center();
        }
    }
    let _ = window.show();
    let _ = window.set_focus();
    let _ = app.emit("popup-shown", ());
    if let Some((x, from_y, to_y)) = slide {
        animate_slide(app.clone(), x, from_y, to_y);
    }
}

/// Moves the window from `from_y` to `to_y` with a soft bounce. The window itself moves because the
/// web view cannot fade a native window without flashing its last frame.
///
/// On Windows one thread draws a frame per display refresh (`DwmFlush`) and moves the window
/// directly with `SetWindowPos`, so the motion runs at the monitor's own rate. Position follows the
/// clock, not the frame count, so a late frame never slows the animation down.
fn animate_slide(app: AppHandle, x: i32, from_y: i32, to_y: i32) {
    let generation = app
        .state::<PopupState>()
        .slide_generation
        .fetch_add(1, Ordering::SeqCst)
        + 1;

    #[cfg(windows)]
    {
        if let Some(hwnd) = app
            .get_webview_window(MAIN_WINDOW)
            .and_then(|window| window.hwnd().ok())
        {
            let hwnd = hwnd.0 as isize;
            std::thread::spawn(move || {
                let started = Instant::now();
                loop {
                    let superseded = app
                        .state::<PopupState>()
                        .slide_generation
                        .load(Ordering::SeqCst)
                        != generation;
                    if superseded || !vsync::is_visible(hwnd) {
                        break;
                    }
                    let t = started.elapsed().as_millis() as f64 / SLIDE_MS as f64;
                    vsync::move_to(hwnd, x, slide_y(from_y, to_y, t));
                    if t >= 1.0 {
                        break;
                    }
                    vsync::wait_next_frame();
                }
            });
            return;
        }
    }

    tauri::async_runtime::spawn(async move {
        let started = Instant::now();
        loop {
            let superseded =
                app.state::<PopupState>().slide_generation.load(Ordering::SeqCst) != generation;
            let Some(window) = app.get_webview_window(MAIN_WINDOW) else {
                break;
            };
            if superseded || !window.is_visible().unwrap_or(false) {
                break;
            }
            let t = started.elapsed().as_millis() as f64 / SLIDE_MS as f64;
            let _ = window.set_position(PhysicalPosition::new(x, slide_y(from_y, to_y, t)));
            if t >= 1.0 {
                break;
            }
            tokio::time::sleep(Duration::from_millis(FRAME_MS)).await;
        }
    });
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
