use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::tuya::{Command, StatusItem};

pub const CATEGORY_CAMERA: &str = "sp";

#[derive(Debug, Clone, Default, PartialEq, Serialize)]
pub struct CameraState {
    /// Privacy mode: the lens stops streaming.
    pub private: bool,
    pub motion_tracking: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Direction {
    Up,
    Right,
    Down,
    Left,
}

impl Direction {
    /// Tuya's `ptz_control` enum: 0 up, 2 right, 4 down, 6 left (odd values are the diagonals).
    fn code(self) -> &'static str {
        match self {
            Direction::Up => "0",
            Direction::Right => "2",
            Direction::Down => "4",
            Direction::Left => "6",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum CameraAction {
    /// The camera keeps moving until it receives `PtzStop`.
    PtzMove { direction: Direction },
    PtzStop,
    SetPrivate { on: bool },
    SetMotionTracking { on: bool },
}

pub fn parse_camera(status: &[StatusItem]) -> CameraState {
    let mut state = CameraState::default();
    for item in status {
        let flag = item.value.as_bool().unwrap_or(false);
        match item.code.as_str() {
            "basic_private" => state.private = flag,
            "motion_tracking" => state.motion_tracking = flag,
            _ => {}
        }
    }
    state
}

fn cmd(code: &str, value: Value) -> Command {
    Command {
        code: code.into(),
        value,
    }
}

pub fn commands_for(action: &CameraAction) -> Vec<Command> {
    match *action {
        CameraAction::PtzMove { direction } => vec![cmd("ptz_control", json!(direction.code()))],
        CameraAction::PtzStop => vec![cmd("ptz_stop", json!(true))],
        CameraAction::SetPrivate { on } => vec![cmd("basic_private", json!(on))],
        CameraAction::SetMotionTracking { on } => vec![cmd("motion_tracking", json!(on))],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn item(code: &str, value: Value) -> StatusItem {
        StatusItem {
            code: code.into(),
            value,
        }
    }

    #[test]
    fn parses_the_two_toggles_and_ignores_the_rest() {
        let state = parse_camera(&[
            item("basic_private", json!(true)),
            item("motion_tracking", json!(false)),
            item("sd_storge", json!("1|2|3")),
        ]);
        assert_eq!(
            state,
            CameraState {
                private: true,
                motion_tracking: false
            }
        );
    }

    #[test]
    fn missing_status_means_everything_off() {
        assert_eq!(parse_camera(&[]), CameraState::default());
    }

    #[test]
    fn moving_sends_the_direction_as_a_string_enum() {
        let c = commands_for(&CameraAction::PtzMove {
            direction: Direction::Left,
        });
        assert_eq!((c[0].code.as_str(), &c[0].value), ("ptz_control", &json!("6")));
    }

    #[test]
    fn stop_and_toggles_map_to_their_codes() {
        assert_eq!(commands_for(&CameraAction::PtzStop)[0].code, "ptz_stop");
        let c = commands_for(&CameraAction::SetPrivate { on: true });
        assert_eq!((c[0].code.as_str(), &c[0].value), ("basic_private", &json!(true)));
        let c = commands_for(&CameraAction::SetMotionTracking { on: false });
        assert_eq!((c[0].code.as_str(), &c[0].value), ("motion_tracking", &json!(false)));
    }

    #[test]
    fn actions_deserialize_from_the_ui_shape() {
        let a: CameraAction =
            serde_json::from_value(json!({"type": "ptz_move", "direction": "up"})).unwrap();
        assert_eq!(a, CameraAction::PtzMove { direction: Direction::Up });
    }
}
