# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Existing codebase: Tauri v2 desktop shell (Rust core) with a Svelte 5 + TypeScript interface rendered in the Windows WebView2. The UI is a web view, so the platform is `web`; the window is a 360x560 frameless popup anchored to the Windows tray icon.

## Users
One person, the owner of the devices, using their own Windows PC. They open the tray popup several times a day to turn the lamp on or off in one or two clicks and, now and then, adjust brightness, colour temperature or colour. Personal use, not a team or public product.

## Product Purpose
Control Positivo Casa Inteligente (Tuya) devices from the Windows tray without the phone app. Success is the lamp changing within a second or two of the click, with the popup always showing the true state of each device.

## Positioning
A desktop control surface for the owner's own Positivo devices, reached from the tray in one click; the vendor's phone app has no desktop counterpart.

## Operating Context
The popup is opened from the Windows system tray, used briefly, and dismissed by clicking elsewhere. Devices are paired in the Smart Life app and reached through the Tuya cloud API (cloud only in v1). Status refreshes every 10 seconds while the popup is open.

## Capabilities and Constraints
- v1 controls lamps (Tuya category `dj`): power, brightness (10-1000), colour temperature (0 warm to 1000 cool), colour (hue 0-360, saturation 0-1000, value 10-1000).
- Other categories (plug `cz`, camera `sp`) are listed but not yet supported; the camera (live video and pan/tilt) is planned for a later version.
- Credentials live only in the Windows Credential Manager. The popup is fixed at 360x560.
- Interface language is Brazilian Portuguese.

## Brand Commitments
Name: Positivo Tray. No logo or brand assets exist. The owner supplied two reference interfaces (an air-conditioner control panel with a large product illustration, a very large light numeral, a tactile slider and a row of compact setting tiles) as the direction to move toward.

## Evidence on Hand
No real product photography or renders. Device illustrations must be authored as SVG. The two reference screenshots live only in the conversation, not in the repository.

## Product Principles
1. The primary action (power) is one click from the moment the popup opens.
2. The popup shows the real state of the device, never an optimistic guess that outlives the next refresh.
3. One device is in focus at a time; the interface is built around the device being controlled, not around a list of identical rows.
4. Every device type is a first-class module: adding the camera must not require redesigning the shell.

## Accessibility & Inclusion
Keyboard operable with visible focus, controls with Portuguese accessible names, text contrast of at least 4.5:1, and animation that respects the reduced-motion setting.
