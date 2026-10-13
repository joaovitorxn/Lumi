---
version: 1
slug: "app-src-routes-page-svelte"
primary_target: "app/src/routes/+page.svelte"
related_targets: []
---

# Surface: tray popup main screen (Operate)

Scope and mode: Operate. The 360x560 frameless popup opened from the Windows tray. One person, own devices, several short visits a day.

Task: turn the focused lamp on/off in one click; occasionally set brightness, white temperature or colour. Frequency: many times a day, seconds each. States that matter: on, off, offline, no response, unsupported device, loading, error, first run (no credentials).

Constraints: Tauri WebView2, Svelte 5, no new runtime dependencies, Bahnschrift (ships with Windows) for numerals, SVG-authored illustration only (no image generation), reduced-motion respected, text contrast >= 4.5:1.

Unresolved: popover notch pointing at the tray icon (deferred); camera screen (later version).

## Direction contract

THESIS: One device in focus, drawn as an object, with controls that have weight. It refuses the list of identical rows with a switch, flat chips, accent gradients and neon halos.

OWN-WORLD: Graphite neutrals (near-black ground, raised panels with a 1px inner top highlight), warm off-white ink. The only chroma on screen is the focused lamp's real light: it tints the bulb glass, a light pool on the ground under it, a faint ambient wash at the top of the window, the slider fill and the lit power button. Numerals in Bahnschrift Light, huge. Controls are physical: an inset track with a cream raised pill thumb, ringed raised round buttons, tiles with a raised border. Shadows carry an offset; no zero-offset coloured halos.

STORY: The owner opens the tray, instantly sees which device is selected and whether it is lit, presses the large power button or drags the slider, and sees the lamp's own light change in the window within a second. Details (temperature, colour) are one tile away.

FIRST VIEWPORT: Top row: device pills at the left (selected pill carries the lamp-light dot), round power button at the right. Below: the illustrated bulb filling the flexible hero area with its light pool under it. Then a 78px Bahnschrift numeral (brightness %) with the unit small at its top-right and a right-aligned "Brilho / lamp colour name" caption. Then minus button, the 44px inset slider with the cream thumb, plus button, and a 0/100 scale. Then two tiles side by side (Branco with kelvin and warmth name, Cor with swatch and hue name), a fine-control row for the active tile, and a footer with sync status plus refresh and settings icons.

FORM: User-pinned from two reference screenshots (an air-conditioner control panel: big illustrated product, huge light numeral, tactile slider, row of setting tiles, "Syncing" footer). No seed; user-supplied references beat the roll.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
