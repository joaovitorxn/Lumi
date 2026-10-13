---
name: Lumi
description: Tray popup for smart lamps. Graphite instrument panel where the only colour is the focused lamp's own light.
colors:
  ground: "#0d0d0f"
  surface: "#17171a"
  surface-hi: "#1f1f23"
  raise-top: "#222226"
  raise-bot: "#18181b"
  border: "#232327"
  border-strong: "#2e2e33"
  track: "#070708"
  ink: "#ece8e1"
  muted: "#8c8a86"
  accent: "#e9e4da"
  cream-top: "#f1ede6"
  cream-bot: "#cfcac1"
  lamp-fallback: "rgb(255 196 120)"
  danger: "#ff7a7a"
  ok: "#46d39a"
typography:
  numeral:
    fontFamily: "Bahnschrift, 'Segoe UI Variable Display', 'Segoe UI', sans-serif"
    fontSize: "78px"
    fontWeight: 300
    lineHeight: 0.95
    letterSpacing: "-2px"
    fontFeature: "tabular-nums"
  title:
    fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  value:
    fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  caption:
    fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  pill: "16px"
  tile: "16px"
  field: "12px"
  panel: "18px"
  round: "50%"
spacing:
  gutter: "16px"
  gap: "10px"
  stack: "12px"
components:
  power-off:
    backgroundColor: "{colors.cream-top}"
    textColor: "#1d1a15"
    rounded: "{rounded.round}"
    size: "42px"
  power-on:
    textColor: "#1a1208"
    rounded: "{rounded.round}"
    size: "42px"
  stepper:
    backgroundColor: "{colors.raise-top}"
    textColor: "{colors.muted}"
    rounded: "{rounded.round}"
    size: "40px"
  tile:
    backgroundColor: "#1b1b1f"
    textColor: "{colors.muted}"
    rounded: "{rounded.tile}"
    height: "64px"
    padding: "10px 12px"
  tile-selected:
    backgroundColor: "#202025"
    textColor: "{colors.ink}"
  device-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    height: "32px"
    padding: "0 12px 0 10px"
  device-pill-selected:
    backgroundColor: "{colors.surface-hi}"
    textColor: "{colors.ink}"
  slider-main-track:
    backgroundColor: "{colors.track}"
    rounded: "22px"
    height: "44px"
  slider-main-thumb:
    backgroundColor: "{colors.cream-top}"
    rounded: "18px"
    width: "52px"
    height: "36px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#16130f"
    rounded: "{rounded.field}"
    padding: "10px 18px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
---

# Design System: Lumi

## Overview

**Creative North Star: "The Lit Instrument"**

A dark graphite console in which one device sits in focus, drawn as an object, and the only chroma on screen is that lamp's own light. The light reaches the window as a single channel triple, `--light` ("r g b"), set on `main` from `lampLight()` and consumed by the bulb glass, the pool under it, an ambient wash at the top of the window, the slider fill, the selected-tile top edge, the selected-pill dot and the lit power button. When the lamp is off the triple falls to black and the window goes quiet. Everything else is neutral: near-black ground, raised graphite panels, warm off-white ink.

Controls have weight. Tracks are inset, thumbs and buttons are raised with a 1px inner top highlight and a small downward shadow. The numeral is huge and light. The popup is a fixed 360x560 frameless window shown from the tray, one device per screen, switched with a row of pills; it is built for many glances a day, seconds each.

**Key Characteristics:**
- Graphite neutrals, warm ink, no second chroma: focus rings and selection use the warm off-white accent.
- Chroma comes only from the focused lamp (`--light`), plus the control-function tracks (hue, temperature) which show the value they set.
- Physical controls: inset track, cream raised thumb, ringed raised round steppers, raised tiles.
- Bahnschrift Light numerals; Segoe UI for everything else.
- Exponential ease-out motion; reduced motion respected globally.
- Hand-authored SVG illustration.

## Colors

Graphite and cream, lit by one borrowed colour.

### Primary
- **Lamp Light** (`rgb(255 196 120)` fallback; live value is `--light`): never a fixed hue. Warm-to-cool white follows temperature, colour mode follows hue and saturation at 0.75 saturation scale. Used at 0.16 alpha for the window wash, 0.34 for the floor pool, 0.4 to 0.62 for slider fill, 0.9 for the 2px selected-tile edge, and solid for the lit power button and selected-pill dot.
- **Warm Off-White Accent** (`#e9e4da`): focus rings (2px, 2px offset), text selection, input focus border, the one filled primary button. Adds no second chroma.

### Neutral
- **Ground** (`#0d0d0f`): the window.
- **Surface** (`#17171a`) and **Surface High** (`#1f1f23`): pills, fields, selected pill, hover fills.
- **Raise Top / Bottom** (`#222226` to `#18181b`): vertical gradient of raised round buttons.
- **Border** (`#232327`) and **Border Strong** (`#2e2e33`): hairlines on tiles, pills, raised buttons, fields.
- **Track** (`#070708`): the inset main slider channel.
- **Ink** (`#ece8e1`): primary text. **Muted** (`#8c8a86`): captions, units, idle icons.
- **Cream** (`#f1ede6` to `#cfcac1`): the raised pill thumb, fine thumbs, and the power button when the lamp is off.
- **Danger** (`#ff7a7a`) and **OK** (`#46d39a`): sync footer status only.

### Named Rules
**The Borrowed Light Rule.** The lamp is the only chroma. Anything that needs colour reads `rgb(var(--light) / alpha)`; nothing else is saturated.
**The Same Warm White Rule.** Focus, selection and the primary button share the accent `#e9e4da`, so interaction never introduces a hue.

## Typography

**Numeral Font:** Bahnschrift (ships with Windows), falling back to Segoe UI Variable Display
**Body Font:** Segoe UI Variable Text, Segoe UI, system-ui

**Character:** An instrument readout set against a plain system voice. The numeral is large, light and tabular so it does not shake while dragging.

### Hierarchy
- **Numeral** (300, 78px, 0.95, -2px tracking): brightness percent. The `%` is a 26px muted superscript. Dims to `#74726e` when off.
- **Title** (600, 24px, -0.01em): device name on the unsupported/offline panel; Settings heading is 18px/600.
- **Value** (600, 14px; 13.5px for the readout label): tile values, "Brilho" label, truncated with ellipsis.
- **Body** (400, 14px, 1.4): default.
- **Caption** (400, 12px to 12.5px, muted): pills, readout caption, footer, field labels, tile small label (11.5px).

### Named Rules
**The Readout Rule.** Large light numerals are Bahnschrift with tabular figures; no other text uses it.

## Layout

Fixed 360x560 window, `overflow: hidden`, column flex: header row, one stage, footer. Gutter is 16px. The stage is a column: the hero flexes to fill (min 88px), then fixed bands: readout, main control row (12px above), two-column tile grid with 10px gap (12px above), and a fixed 84px fine-control band (12px above) whose height is the same in white and colour mode so the bulb and numeral never move. Rhythm is 10 / 12 / 16px. A new stage fades and rises 8px on device switch. Device pills scroll horizontally with 22px edge fades, wheel mapped to horizontal.

## Elevation & Depth

Hybrid of tonal layering and small physical shadows. Raised things carry an inset 1px white top highlight (0.06 to 0.08 alpha) and a short downward drop. Inset things (tracks) carry a heavy inner top shadow. Light itself is the only glow, and it is a soft pool on the floor and a wash on the window, not a halo around controls.

### Shadow Vocabulary
- **Raised round / tile** (`inset 0 1px 0 rgb(255 255 255 / 0.08), 0 2px 4px rgb(0 0 0 / 0.5)`): steppers, tiles, power button.
- **Cream thumb** (`0 2px 6px rgb(0 0 0 / 0.6), inset 0 1px 0 #fff, inset 0 -2px 0 rgb(0 0 0 / 0.12)`): main thumb; fine thumb uses `0 2px 4px` and no bottom inset.
- **Inset track** (`inset 0 3px 8px rgb(0 0 0 / 0.9), inset 0 -1px 0 rgb(255 255 255 / 0.05)`): main slider; fine tracks use `inset 0 1px 3px rgb(0 0 0 / 0.7)`.
- **Lit tile edge** (`inset 0 2px 0 rgb(var(--light) / 0.9)` first in the stack): the selected tile.

### Named Rules
**The Offset Shadow Rule.** Every shadow has a downward offset. No zero-offset coloured halos.
**The Lit Edge Rule.** Selection on a raised tile is a 2px inset top edge in lamp light, not a fill or outline.

## Shapes

Round and capsule. Fully round for power, steppers, fine thumbs and the swatch. Capsule for the 44px track (22px) and the 52x36 thumb (18px). Tiles 16px, device pills 16px (32px tall), fields and buttons 12px, skeleton 18px. Borders are 1px hairlines in Border / Border Strong.

## Components

### Power Button
42px round. Off: cream raised pill with dark glyph (`#1d1a15`), an invitation to press. On: lamp-light gradient (`rgb(var(--light))` to 0.78 alpha) with dark glyph. Active scales to 0.94.

### Slider
Main: 44px inset track, light-tinted fill that stops under the thumb centre, 52x36 cream pill thumb with two grip grooves. Fine: 14px track with a gradient that shows what it sets (warm-to-cool white, full hue wheel, white to the current hue), 22px cream round thumb. Focus: 2px accent ring on the thumb. Disabled: 0.5 opacity.

### Stepper
40px ringed raised round button, muted glyph, minus and plus flank the main slider. Disabled 0.5.

### Tile
64px raised graphite tile, small label above, value below, muted. Selected: lit top edge, brighter fill, ink value. Tapping a tile switches mode (white or colour). Disabled 0.55.

### Device Pill
32px capsule; leading 8px dot (dim off, `#cfc9bf` lit, lamp light when selected and lit). Selected pill is Surface High with Border Strong. Focus ring is inset.

### Hero Illustration
Hand-authored SVG, 120x160 viewBox. Bulb has an unlit glass, a lit glass that cross-fades in over 0.55s, a floor pool that swells (opacity 0.6s, scaleX 0.7 to 1 over 0.8s), highlight and filament. Gradient ids are unique per instance (`$props.id()`). Other categories (plug, camera, generic) are flat graphite drawings.

### Sync Footer
12px muted status with a 6px LED (`--ok`, idle grey), spinner, or danger alert; 32px round ghost icon buttons for refresh and settings; "Tentar de novo" ghost pill on error. When stale the numeral and caption dim to 0.5.

### Fields and Buttons (Settings)
Fields: Surface fill, Border Strong, 12px radius, focus swaps border to accent with a 3px 25% accent glow. Primary: filled accent, dark text, 600. Ghost: transparent, Border Strong.

## Do's and Don'ts

### Do:
- **Do** route every lamp-derived colour through `--light`, with alpha.
- **Do** build new controls as inset-or-raised objects with a 1px top highlight and a downward shadow.
- **Do** use `var(--ease-out)` (`cubic-bezier(0.16, 1, 0.3, 1)`) for all transitions; 0.15s press, 0.25 to 0.6s state.
- **Do** keep text at 4.5:1 or better against graphite and keep the fixed 360x560 frame.
- **Do** give inline SVG gradients per-instance ids.

### Don't:
- **Don't** add a second accent hue; use `#e9e4da` for focus and selection.
- **Don't** use zero-offset coloured halos or neon glow around controls.
- **Don't** replace the single focused device with a list of identical rows each with a switch.
- **Don't** set the numeral in anything but Bahnschrift Light with tabular figures.
- **Don't** use bare opacity changes for state without a transition, and don't override reduced-motion.
