import { describe, expect, it } from 'vitest';
import { applyAction, bulbColor, effectiveBrightness, glowStrength } from './light';
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

describe('bulb appearance', () => {
  it('is grey and has no glow when off', () => {
    const off = { ...base, on: false };
    expect(bulbColor(off)).toBe('#3b4050');
    expect(glowStrength(off)).toBe(0);
  });

  it('white mode goes from warm to cool with temperature', () => {
    expect(bulbColor({ ...base, temperature: 0 })).toBe('rgb(255, 180, 107)');
    expect(bulbColor({ ...base, temperature: 1000 })).toBe('rgb(207, 227, 255)');
  });

  it('colour mode shows the hue at full value', () => {
    const red = { ...base, mode: 'colour' as const, hue: 0, saturation: 1000 };
    expect(bulbColor(red)).toBe('rgb(255, 0, 0)');
    expect(bulbColor({ ...red, hue: 120 })).toBe('rgb(0, 255, 0)');
    expect(bulbColor({ ...red, hue: 360 })).toBe('rgb(255, 0, 0)');
  });

  it('glow grows with brightness between 0.25 and 1', () => {
    expect(glowStrength({ ...base, brightness: 10 })).toBeCloseTo(0.25);
    expect(glowStrength({ ...base, brightness: 1000 })).toBeCloseTo(1);
  });

  it('effectiveBrightness follows the mode', () => {
    expect(effectiveBrightness(base)).toBe(500);
    expect(effectiveBrightness({ ...base, mode: 'colour' })).toBe(800);
  });
});
