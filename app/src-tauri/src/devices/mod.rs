pub mod camera;
pub mod light;

use serde::Serialize;

use crate::tuya::{StatusItem, TuyaDevice};
use camera::{parse_camera, CameraState, CATEGORY_CAMERA};
use light::{parse_light, LightState, CATEGORY_LIGHT};

/// What the UI sees for one device. `light` is present only for an online lamp whose status was read.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct DeviceView {
    pub id: String,
    pub name: String,
    pub category: String,
    pub online: bool,
    pub light: Option<LightState>,
    /// Present only for an online camera whose status was read.
    pub camera: Option<CameraState>,
}

pub fn build_view(device: &TuyaDevice, status: Option<&[StatusItem]>) -> DeviceView {
    let light = match (device.category.as_str(), device.online, status) {
        (CATEGORY_LIGHT, true, Some(items)) => Some(parse_light(items)),
        _ => None,
    };
    let camera = match (device.category.as_str(), device.online, status) {
        (CATEGORY_CAMERA, true, Some(items)) => Some(parse_camera(items)),
        _ => None,
    };
    DeviceView {
        id: device.id.clone(),
        name: device.name.clone(),
        category: device.category.clone(),
        online: device.online,
        light,
        camera,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn device(category: &str, online: bool) -> TuyaDevice {
        TuyaDevice {
            id: "d1".into(),
            name: "Luz".into(),
            category: category.into(),
            online,
        }
    }

    fn status() -> Vec<StatusItem> {
        vec![StatusItem {
            code: "switch_led".into(),
            value: json!(true),
        }]
    }

    #[test]
    fn online_lamp_with_status_gets_light_state() {
        let view = build_view(&device("dj", true), Some(&status()));
        assert!(view.light.unwrap().on);
    }

    #[test]
    fn offline_lamp_has_no_light_state() {
        assert!(build_view(&device("dj", false), Some(&status())).light.is_none());
    }

    #[test]
    fn lamp_whose_status_failed_has_no_light_state() {
        assert!(build_view(&device("dj", true), None).light.is_none());
    }

    #[test]
    fn online_camera_with_status_gets_camera_state() {
        let view = build_view(&device("sp", true), Some(&status()));
        assert!(view.camera.is_some() && view.light.is_none());
        assert!(build_view(&device("sp", false), Some(&status())).camera.is_none());
    }

    #[test]
    fn unsupported_category_has_no_light_state_but_keeps_identity() {
        let view = build_view(&device("cz", true), Some(&status()));
        assert!(view.light.is_none());
        assert_eq!((view.id.as_str(), view.name.as_str()), ("d1", "Luz"));
    }
}
