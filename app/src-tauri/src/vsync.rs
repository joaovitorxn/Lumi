//! Frame pacing for the popup slide-in on Windows.
//!
//! A plain `sleep` cannot hit the display refresh: the default Windows timer ticks about every
//! 15.6 ms, so a 16 ms sleep often lasts ~31 ms (roughly 30 fps). `DwmFlush` blocks until the
//! compositor presents the next frame, which is the display's own refresh whatever its rate.

use std::time::Duration;

use windows_sys::Win32::Graphics::Dwm::DwmFlush;
use windows_sys::Win32::UI::WindowsAndMessaging::{
    IsWindowVisible, SetWindowPos, SWP_NOACTIVATE, SWP_NOSIZE, SWP_NOZORDER,
};

/// Blocks until the next display refresh.
pub fn wait_next_frame() {
    // A failure means desktop composition is unavailable; fall back to a short sleep.
    if unsafe { DwmFlush() } < 0 {
        std::thread::sleep(Duration::from_millis(8));
    }
}

/// Moves the window to `(x, y)` (physical pixels) right now, keeping its size, order and focus.
pub fn move_to(hwnd: isize, x: i32, y: i32) {
    unsafe {
        SetWindowPos(
            hwnd as _,
            std::ptr::null_mut(),
            x,
            y,
            0,
            0,
            SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE,
        );
    }
}

pub fn is_visible(hwnd: isize) -> bool {
    unsafe { IsWindowVisible(hwnd as _) != 0 }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{Duration, Instant};

    fn average_ms(frames: u32, mut wait: impl FnMut()) -> f64 {
        wait(); // line up with a frame boundary before timing
        let start = Instant::now();
        for _ in 0..frames {
            wait();
        }
        start.elapsed().as_secs_f64() * 1000.0 / frames as f64
    }

    #[test]
    fn waiting_for_the_next_frame_returns_promptly() {
        let start = Instant::now();
        wait_next_frame();
        assert!(start.elapsed() < Duration::from_millis(250), "DwmFlush did not return");
    }

    /// Manual measurement, on the real display: why a plain sleep cannot hit the refresh rate.
    /// Run with: cargo test vsync -- --ignored --nocapture
    #[test]
    #[ignore]
    fn measure_sleep_against_the_display_refresh() {
        let sleep = average_ms(60, || std::thread::sleep(Duration::from_millis(16)));
        let frame = average_ms(120, wait_next_frame);
        println!("sleep(16 ms) average: {sleep:.1} ms  ({:.0} fps)", 1000.0 / sleep);
        println!("wait_next_frame average: {frame:.1} ms  ({:.0} Hz)", 1000.0 / frame);
        assert!(frame > 2.0 && frame < 40.0, "unexpected refresh interval: {frame} ms");
    }
}
