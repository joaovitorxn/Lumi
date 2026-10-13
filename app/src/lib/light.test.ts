import { describe, expect, it } from 'vitest';
import {
  applyAction,
  brightnessPct,
  effectiveBrightness,
  hueName,
  kelvin,
  lampLight,
  stepBrightness,
  warmthName
} from './light';
import type { LightState } from './types';

const base: LightState = {
  on: true,
  mode: 'white',
  brightness: 500,
  temperature: 0,
  hue: 120,
  saturation: 900,
  value: 800
};

describe('applyAction', () => {
  it('set_power only flips the switch', () => {
    expect(applyAction(base, { type: 'set_power', on: false })).toEqual({ ...base, on: false });
  });

  it('set_brightness changes brightness in white mode and value in colour mode', () => {
    expect(applyAction(base, { type: 'set_brightness', value: 300 }).brightness).toBe(300);
    const colour = { ...base, mode: 'colour' as const };
    const next = applyAction(colour, { type: 'set_brightness', value: 300 });
    expect(next.value).toBe(300);
    expect(next.brightness).toBe(500);
  });

  it('set_brightness never goes below 10 or above 1000', () => {
    expect(applyAction(base, { type: 'set_brightness', value: 0 }).brightness).toBe(10);
    expect(applyAction(base, { type: 'set_brightness', value: 5000 }).brightness).toBe(1000);
  });

  it('set_temperature and set_colour switch the mode', () => {
    const colour = { ...base, mode: 'colour' as const };
    expect(applyAction(colour, { type: 'set_temperature', value: 700 })).toMatchObject({ mode: 'white', temperature: 700 });
    expect(applyAction(base, { type: 'set_colour', h: 10, s: 20, v: 30 })).toMatchObject({
      mode: 'colour',
      hue: 10,
      saturation: 20,
      value: 30
    });
  });
});

describe('readouts', () => {
  it('effectiveBrightness follows the mode', () => {
    expect(effectiveBrightness(base)).toBe(500);
    expect(effectiveBrightness({ ...base, mode: 'colour' })).toBe(800);
  });

  it('brightnessPct maps 10..1000 onto 0..100 and clamps', () => {
    expect(brightnessPct(10)).toBe(0);
    expect(brightnessPct(500)).toBe(49);
    expect(brightnessPct(1000)).toBe(100);
    expect(brightnessPct(5)).toBe(0);
    expect(brightnessPct(5000)).toBe(100);
  });

  it('stepBrightness moves by 10% of the range and stays inside 10..1000', () => {
    expect(stepBrightness(500, 1)).toBe(599);
    expect(stepBrightness(500, -1)).toBe(401);
    expect(stepBrightness(10, -1)).toBe(10);
    expect(stepBrightness(1000, 1)).toBe(1000);
  });

  it('kelvin runs from 2700 (warm) to 6500 (cool) in steps of 100', () => {
    expect(kelvin(0)).toBe(2700);
    expect(kelvin(1000)).toBe(6500);
    expect(kelvin(100)).toBe(3100);
    expect(kelvin(-50)).toBe(2700);
    expect(kelvin(9999)).toBe(6500);
  });

  it('warmthName splits the temperature scale in three', () => {
    expect(warmthName(0)).toBe('Quente');
    expect(warmthName(500)).toBe('Neutro');
    expect(warmthName(1000)).toBe('Frio');
  });

  it('hueName names the colour wheel in Portuguese and wraps at 360', () => {
    expect(hueName(0)).toBe('Vermelho');
    expect(hueName(30)).toBe('Laranja');
    expect(hueName(120)).toBe('Verde');
    expect(hueName(280)).toBe('Violeta');
    expect(hueName(360)).toBe('Vermelho');
  });
});

describe('lampLight', () => {
  it('is dark and unlit when the lamp is off', () => {
    expect(lampLight({ ...base, on: false }).rgb).toBe('0 0 0');
  });

  it('white mode goes from warm to cool with temperature', () => {
    const warm = lampLight({ ...base, temperature: 0 });
    const cool = lampLight({ ...base, temperature: 1000 });
    expect(warm.rgb).toBe('255 196 120');
    expect(cool.rgb).toBe('190 215 255');
    expect(warm.core).not.toBe(cool.core);
  });

  it('colour mode follows the hue and returns three channel numbers', () => {
    const red = lampLight({ ...base, mode: 'colour', hue: 0, saturation: 1000 });
    const green = lampLight({ ...base, mode: 'colour', hue: 120, saturation: 1000 });
    expect(red.rgb).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
    expect(red.rgb).not.toBe(green.rgb);
    const [r, g] = red.rgb.split(' ').map(Number);
    expect(r).toBeGreaterThan(g);
  });

  it('a desaturated colour tends to white', () => {
    const grey = lampLight({ ...base, mode: 'colour', hue: 200, saturation: 0 });
    const [r, g, b] = grey.rgb.split(' ').map(Number);
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(2);
  });
});
