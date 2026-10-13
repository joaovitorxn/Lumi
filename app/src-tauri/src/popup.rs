//! Pure logic for the tray popup: where it goes and what a tray click should do.

const MARGIN: i32 = 8;
/// A tray click arriving this soon after the blur-hide is the same click that closed the popup.
const BLUR_CLICK_WINDOW_MS: u128 = 250;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Rect {
    pub x: i32,
    pub y: i32,
    pub w: u32,
    pub h: u32,
}

/// Top-left corner (physical pixels) for a popup of `win` size, next to the tray icon `tray`
/// and kept fully inside the `screen`.
pub fn popup_position(tray: Rect, win: (u32, u32), screen: (u32, u32)) -> (i32, i32) {
    let (win_w, win_h) = (win.0 as i32, win.1 as i32);
    let (screen_w, screen_h) = (screen.0 as i32, screen.1 as i32);

    let centered_x = tray.x + tray.w as i32 / 2 - win_w / 2;
    let x = centered_x.min(screen_w - win_w - MARGIN).max(MARGIN);

    let taskbar_at_bottom = tray.y > screen_h / 2;
    let y = if taskbar_at_bottom {
        tray.y - win_h - MARGIN
    } else {
        tray.y + tray.h as i32 + MARGIN
    };
    let y = y.min(screen_h - win_h - MARGIN).max(MARGIN);
    (x, y)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ClickAction {
    Show,
    Hide,
    Ignore,
}

/// How far (logical pixels) the popup starts from its final spot, on the tray side.
pub const SLIDE_DISTANCE: f64 = 36.0;
pub const SLIDE_MS: u128 = 360;
pub const FRAME_MS: u64 = 16;
/// 2.2 lets the slide run about 15% past its target before settling: a soft bounce, not a spring.
const BACK_OVERSHOOT: f64 = 2.2;

/// Ease-out with a small overshoot: 0 at t=0, exactly 1 for t>=1, a little over 1 on the way.
fn ease_out_back(t: f64) -> f64 {
    let t = t.clamp(0.0, 1.0);
    let c3 = BACK_OVERSHOOT + 1.0;
    1.0 + c3 * (t - 1.0).powi(3) + BACK_OVERSHOOT * (t - 1.0).powi(2)
}

/// Vertical position at progress `t` (0..1) of a slide from `from` to `to`.
pub fn slide_y(from: i32, to: i32, t: f64) -> i32 {
    (from as f64 + (to - from) as f64 * ease_out_back(t)).round() as i32
}

/// Where the slide starts: on the tray's side of the final spot, `distance` pixels away, so the
/// popup always moves away from the tray icon it came from.
pub fn slide_start(final_y: i32, tray_y: i32, distance: i32) -> i32 {
    if final_y < tray_y {
        final_y + distance
    } else {
        final_y - distance
    }
}

pub fn click_action(visible: bool, ms_since_blur_hide: Option<u128>) -> ClickAction {
    if visible {
        ClickAction::Hide
    } else if ms_since_blur_hide.is_some_and(|ms| ms < BLUR_CLICK_WINDOW_MS) {
        ClickAction::Ignore
    } else {
        ClickAction::Show
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SCREEN: (u32, u32) = (1920, 1080);
    const WIN: (u32, u32) = (360, 480);

    #[test]
    fn popup_sits_centered_above_a_bottom_taskbar_icon() {
        let tray = Rect { x: 1700, y: 1040, w: 24, h: 40 };
        let (x, y) = popup_position(tray, WIN, SCREEN);
        assert_eq!(x, 1700 + 12 - 180);
        assert_eq!(y, 1040 - 480 - 8);
    }

    #[test]
    fn popup_is_pushed_inside_the_right_edge() {
        let tray = Rect { x: 1900, y: 1040, w: 20, h: 40 };
        let (x, _) = popup_position(tray, WIN, SCREEN);
        assert_eq!(x, 1920 - 360 - 8);
    }

    #[test]
    fn popup_is_pushed_inside_the_left_edge() {
        let tray = Rect { x: 0, y: 1040, w: 20, h: 40 };
        let (x, _) = popup_position(tray, WIN, SCREEN);
        assert_eq!(x, 8);
    }

    #[test]
    fn popup_opens_below_a_top_taskbar_icon() {
        let tray = Rect { x: 1700, y: 0, w: 24, h: 40 };
        let (_, y) = popup_position(tray, WIN, SCREEN);
        assert_eq!(y, 40 + 8);
    }

    #[test]
    fn popup_larger_than_the_screen_still_returns_a_position() {
        let tray = Rect { x: 10, y: 700, w: 20, h: 40 };
        let (x, y) = popup_position(tray, (800, 900), (640, 720));
        assert_eq!((x, y), (8, 8));
    }

    #[test]
    fn click_toggles_visibility() {
        assert_eq!(click_action(true, None), ClickAction::Hide);
        assert_eq!(click_action(false, None), ClickAction::Show);
    }

    #[test]
    fn click_right_after_a_blur_hide_is_ignored_so_it_does_not_reopen() {
        assert_eq!(click_action(false, Some(40)), ClickAction::Ignore);
        assert_eq!(click_action(false, Some(900)), ClickAction::Show);
    }

    #[test]
    fn the_slide_starts_at_the_start_and_lands_exactly_on_the_target() {
        assert_eq!(slide_y(300, 200, 0.0), 300);
        assert_eq!(slide_y(300, 200, 1.0), 200);
        assert_eq!(slide_y(300, 200, 5.0), 200);
        assert_eq!(slide_y(300, 200, -1.0), 300);
    }

    #[test]
    fn the_slide_overshoots_a_little_then_settles() {
        // Moving up from 300 to 200: the bounce passes 200 (a smaller y) before settling back on it.
        let ys: Vec<i32> = (0..=100).map(|i| slide_y(300, 200, i as f64 / 100.0)).collect();
        let lowest = *ys.iter().min().unwrap();
        assert!(lowest < 200, "no overshoot: {lowest}");
        assert!(lowest >= 180, "bounce too big: {lowest}");
        assert_eq!(*ys.last().unwrap(), 200);
        let peak = ys.iter().position(|&y| y == lowest).unwrap();
        assert!(
            ys[peak..].windows(2).all(|w| w[1] >= w[0]),
            "does not settle monotonically"
        );
    }

    #[test]
    fn the_slide_works_downwards_too() {
        let ys: Vec<i32> = (0..=100).map(|i| slide_y(100, 200, i as f64 / 100.0)).collect();
        assert!(*ys.iter().max().unwrap() > 200);
        assert_eq!(*ys.last().unwrap(), 200);
    }

    #[test]
    fn the_popup_starts_on_the_tray_side_of_its_final_spot() {
        // Popup above a bottom tray: it starts lower, closer to the tray, and rises.
        assert_eq!(slide_start(400, 1040, 24), 424);
        // Popup below a top tray: it starts higher, closer to the tray, and drops.
        assert_eq!(slide_start(48, 0, 24), 24);
    }
}
