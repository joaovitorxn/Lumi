import { t } from './i18n.svelte';
import type { LightAction, LightState } from './types';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** How a lit lamp looks: glass colours for the illustration and the light itself as "r g b". */
export interface Look {
  core: string;
  edge: string;
  rgb: string;
}

/** The brightness the slider shows: `value` in colour mode, `brightness` in white mode. */
export function effectiveBrightness(s: LightState): number {
  return s.mode === 'colour' ? s.value : s.brightness;
}

/** Tuya brightness (10..1000) as a 0..100 percentage. */
export function brightnessPct(value: number): number {
  return Math.round(((clamp(value, 10, 1000) - 10) / 990) * 100);
}

/** One press of the plus/minus buttons: 10% of the range, kept inside 10..1000. */
export function stepBrightness(current: number, direction: 1 | -1): number {
  return clamp(current + direction * 99, 10, 1000);
}

/** Tuya white temperature (0 warm .. 1000 cool) as kelvin, 2700..6500 in steps of 100. */
export function kelvin(temperature: number): number {
  return Math.round((2700 + clamp(temperature, 0, 1000) * 3.8) / 100) * 100;
}

export function warmthName(temperature: number): string {
  return temperature < 340 ? t('warmth.warm') : temperature < 670 ? t('warmth.neutral') : t('warmth.cool');
}

export function hueName(hue: number): string {
  const h = ((hue % 360) + 360) % 360;
  if (h < 15 || h >= 335) return t('hue.red');
  if (h < 45) return t('hue.orange');
  if (h < 70) return t('hue.yellow');
  if (h < 160) return t('hue.green');
  if (h < 200) return t('hue.cyan');
  if (h < 255) return t('hue.blue');
  if (h < 290) return t('hue.violet');
  return t('hue.pink');
}

/** What the lamp will look like after `action`, used to update the panel before Tuya answers. */
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

const WARM = { core: [255, 220, 168], edge: [232, 163, 90], rgb: [255, 196, 120] };
const COOL = { core: [232, 240, 255], edge: [159, 184, 232], rgb: [190, 215, 255] };
const UNLIT: Look = { core: 'rgb(45 46 51)', edge: 'rgb(28 29 33)', rgb: '0 0 0' };

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const channels = (c: number[]) => c.join(' ');

/** h in degrees, s and v in 0..1. */
export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const hh = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** The light a lamp gives off: warm-to-cool in white mode, the hue in colour mode, none when off. */
export function lampLight(s: LightState): Look {
  if (!s.on) return UNLIT;
  if (s.mode === 'colour') {
    const sat = clamp(s.saturation, 0, 1000) / 1000;
    return {
      core: `rgb(${channels(hsvToRgb(s.hue, 0.25 * sat, 1))})`,
      edge: `rgb(${channels(hsvToRgb(s.hue, 0.62 * sat, 0.9))})`,
      rgb: channels(hsvToRgb(s.hue, 0.75 * sat, 1))
    };
  }
  const t = clamp(s.temperature, 0, 1000) / 1000;
  return {
    core: `rgb(${channels(mix(WARM.core, COOL.core, t))})`,
    edge: `rgb(${channels(mix(WARM.edge, COOL.edge, t))})`,
    rgb: channels(mix(WARM.rgb, COOL.rgb, t))
  };
}
