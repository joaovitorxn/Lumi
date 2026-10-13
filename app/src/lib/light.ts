import type { LightAction, LightState } from './types';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** The brightness the slider shows: `value` in colour mode, `brightness` in white mode. */
export function effectiveBrightness(s: LightState): number {
  return s.mode === 'colour' ? s.value : s.brightness;
}

/** What the lamp will look like after `action`, used to update the card before Tuya answers. */
export function applyAction(s: LightState, action: LightAction): LightState {
  switch (action.type) {
    case 'set_power':
      return { ...s, on: action.on };
    case 'set_brightness': {
      const value = clamp(action.value, 10, 1000);
      return s.mode === 'colour' ? { ...s, value } : { ...s, brightness: value };
    }
    case 'set_temperature':
      return { ...s, mode: 'white', temperature: clamp(action.value, 0, 1000) };
    case 'set_colour':
      return {
        ...s,
        mode: 'colour',
        hue: clamp(action.h, 0, 360),
        saturation: clamp(action.s, 0, 1000),
        value: clamp(action.v, 10, 1000)
      };
  }
}

const WARM = [255, 180, 107];
const COOL = [207, 227, 255];
const OFF = '#3b4050';

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** CSS colour of the bulb icon: grey when off, tinted by temperature or hue when on. */
export function bulbColor(s: LightState): string {
  if (!s.on) return OFF;
  if (s.mode === 'colour') {
    const [r, g, b] = hsvToRgb(clamp(s.hue, 0, 359.99), clamp(s.saturation, 0, 1000) / 1000, 1);
    return `rgb(${r}, ${g}, ${b})`;
  }
  const t = clamp(s.temperature, 0, 1000) / 1000;
  const [r, g, b] = WARM.map((w, i) => Math.round(w + (COOL[i] - w) * t));
  return `rgb(${r}, ${g}, ${b})`;
}

/** 0.25 (dimmest) .. 1 (brightest) glow strength; 0 when off. */
export function glowStrength(s: LightState): number {
  if (!s.on) return 0;
  return 0.25 + 0.75 * ((clamp(effectiveBrightness(s), 10, 1000) - 10) / 990);
}
