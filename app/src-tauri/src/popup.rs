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
}
