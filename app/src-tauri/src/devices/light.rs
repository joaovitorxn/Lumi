use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::tuya::{Command, StatusItem};

pub const CATEGORY_LIGHT: &str = "dj";

const BRIGHTNESS: (u16, u16) = (10, 1000);
const TEMPERATURE: (u16, u16) = (0, 1000);
const HUE_MAX: u16 = 360;
const SATURATION_MAX: u16 = 1000;
const VALUE: (u16, u16) = (10, 1000);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum LightMode {
    White,
    Colour,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct LightState {
    pub on: bool,
    pub mode: LightMode,
    pub brightness: u16,
    pub temperature: u16,
    pub hue: u16,
    pub saturation: u16,
    pub value: u16,
}

impl Default for LightState {
    fn default() -> Self {
        Self {
            on: false,
            mode: LightMode::White,
            brightness: BRIGHTNESS.1,
            temperature: TEMPERATURE.1,
            hue: 0,
            saturation: SATURATION_MAX,
            value: VALUE.1,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum LightAction {
    SetPower { on: bool },
    SetBrightness { value: u16 },
    SetTemperature { value: u16 },
    SetColour { h: u16, s: u16, v: u16 },
}

fn int_in(value: &Value, min: u16, max: u16) -> Option<u16> {
    value
        .as_i64()
        .map(|n| n.clamp(min as i64, max as i64) as u16)
}

pub fn parse_light(status: &[StatusItem]) -> LightState {
    let mut state = LightState::default();
    for item in status {
        match item.code.as_str() {
            "switch_led" => state.on = item.value.as_bool().unwrap_or(false),
            "work_mode" => {
                state.mode = if item.value.as_str() == Some("colour") {
                    LightMode::Colour
                } else {
                    LightMode::White
                }
            }
            "bright_value_v2" => {
                state.brightness = int_in(&item.value, BRIGHTNESS.0, BRIGHTNESS.1)
                    .unwrap_or(state.brightness)
            }
            "temp_value_v2" => {
                state.temperature = int_in(&item.value, TEMPERATURE.0, TEMPERATURE.1)
                    .unwrap_or(state.temperature)
            }
            "colour_data_v2" => {
                // Tuya sends this as a JSON string; a malformed one keeps the defaults.
                if let Some(Ok(parsed)) = item
                    .value
                    .as_str()
                    .map(serde_json::from_str::<Value>)
                {
                    state.hue = int_in(&parsed["h"], 0, HUE_MAX).unwrap_or(state.hue);
                    state.saturation =
                        int_in(&parsed["s"], 0, SATURATION_MAX).unwrap_or(state.saturation);
                    state.value = int_in(&parsed["v"], VALUE.0, VALUE.1).unwrap_or(state.value);
                }
            }
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

fn colour_command(h: u16, s: u16, v: u16) -> Command {
    cmd(
        "colour_data_v2",
        json!(json!({"h": h, "s": s, "v": v}).to_string()),
    )
}

/// Stateless on purpose: the UI sends the full colour when it changes brightness in colour mode,
/// so no command depends on a (possibly lagging) status read.
pub fn commands_for(action: &LightAction) -> Vec<Command> {
    match *action {
        LightAction::SetPower { on } => vec![cmd("switch_led", json!(on))],
        LightAction::SetBrightness { value } => vec![cmd(
            "bright_value_v2",
            json!(value.clamp(BRIGHTNESS.0, BRIGHTNESS.1)),
        )],
        LightAction::SetTemperature { value } => vec![
            cmd("work_mode", json!("white")),
            cmd(
                "temp_value_v2",
                json!(value.clamp(TEMPERATURE.0, TEMPERATURE.1)),
            ),
        ],
        LightAction::SetColour { h, s, v } => vec![
            cmd("work_mode", json!("colour")),
            colour_command(
                h.min(HUE_MAX),
                s.min(SATURATION_MAX),
                v.clamp(VALUE.0, VALUE.1),
            ),
        ],
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

    fn spike_status() -> Vec<StatusItem> {
        vec![
            item("switch_led", json!(true)),
            item("work_mode", json!("white")),
            item("bright_value_v2", json!(1000)),
            item("temp_value_v2", json!(250)),
            item("colour_data_v2", json!("{\"h\":120,\"s\":900,\"v\":800}")),
            item("countdown_1", json!(0)),
        ]
    }

    #[test]
    fn parses_the_real_status_captured_in_the_spike() {
        let s = parse_light(&spike_status());
        assert_eq!(
            s,
            LightState {
                on: true,
                mode: LightMode::White,
                brightness: 1000,
                temperature: 250,
                hue: 120,
                saturation: 900,
                value: 800,
            }
        );
    }

    #[test]
    fn missing_codes_fall_back_to_defaults() {
        assert_eq!(parse_light(&[]), LightState::default());
    }

    #[test]
    fn malformed_colour_data_keeps_defaults_without_panicking() {
        let s = parse_light(&[item("colour_data_v2", json!("not json"))]);
        assert_eq!((s.hue, s.saturation, s.value), (0, 1000, 1000));
        let s = parse_light(&[item("colour_data_v2", json!(42))]);
        assert_eq!(s.hue, 0);
    }

    #[test]
    fn out_of_range_values_are_clamped() {
        let s = parse_light(&[
            item("bright_value_v2", json!(5000)),
            item("temp_value_v2", json!(-3)),
        ]);
        assert_eq!((s.brightness, s.temperature), (1000, 0));
    }

    #[test]
    fn wrongly_typed_values_do_not_panic() {
        let s = parse_light(&[
            item("switch_led", json!("yes")),
            item("bright_value_v2", json!("high")),
        ]);
        assert!(!s.on);
        assert_eq!(s.brightness, 1000);
    }

    #[test]
    fn set_power_sends_switch_led() {
        let cmds = commands_for(&LightAction::SetPower { on: true });
        assert_eq!(cmds, vec![cmd("switch_led", json!(true))]);
    }

    #[test]
    fn brightness_in_white_mode_uses_bright_value() {
        let cmds = commands_for(&LightAction::SetBrightness { value: 500 },
        );
        assert_eq!(cmds, vec![cmd("bright_value_v2", json!(500))]);
    }

    #[test]
    fn brightness_below_the_minimum_is_raised_to_10() {
        let cmds = commands_for(&LightAction::SetBrightness { value: 0 },
        );
        assert_eq!(cmds, vec![cmd("bright_value_v2", json!(10))]);
    }

    #[test]
    fn temperature_switches_to_white_mode_first() {
        let cmds = commands_for(&LightAction::SetTemperature { value: 300 },
        );
        assert_eq!(
            cmds,
            vec![
                cmd("work_mode", json!("white")),
                cmd("temp_value_v2", json!(300))
            ]
        );
    }

    #[test]
    fn colour_switches_to_colour_mode_and_clamps() {
        let cmds = commands_for(&LightAction::SetColour {
                h: 400,
                s: 2000,
                v: 1,
            },
        );
        assert_eq!(
            cmds,
            vec![
                cmd("work_mode", json!("colour")),
                cmd("colour_data_v2", json!("{\"h\":360,\"s\":1000,\"v\":10}")),
            ]
        );
    }

    #[test]
    fn actions_deserialize_from_the_ui_json_shape() {
        let a: LightAction = serde_json::from_str(r#"{"type":"set_power","on":true}"#).unwrap();
        assert_eq!(a, LightAction::SetPower { on: true });
        let a: LightAction =
            serde_json::from_str(r#"{"type":"set_colour","h":10,"s":20,"v":30}"#).unwrap();
        assert_eq!(a, LightAction::SetColour { h: 10, s: 20, v: 30 });
    }
}
