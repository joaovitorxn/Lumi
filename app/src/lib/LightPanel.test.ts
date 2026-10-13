import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import LightPanel from './LightPanel.svelte';
import type { DeviceView, LightState } from './types';

const light: LightState = {
  on: true,
  mode: 'white',
  brightness: 500,
  temperature: 100,
  hue: 120,
  saturation: 900,
  value: 800
};
const device: DeviceView = { id: 'lamp', name: 'Luz do PC', category: 'dj', online: true, light, camera: null };
const colour: LightState = { ...light, mode: 'colour' };

function show(state: LightState = light) {
  const onaction = vi.fn();
  render(LightPanel, { device, light: state, onaction });
  return onaction;
}

describe('LightPanel readout', () => {
  it('shows the brightness percentage and the white tone', () => {
    show();
    expect(screen.getByRole('img', { name: '49' })).toBeTruthy();
    expect(screen.getByText('Brilho', { selector: 'b' })).toBeTruthy();
    expect(screen.getByText('Branco quente')).toBeTruthy();
  });

  it('names the colour in colour mode', () => {
    show({ ...colour, hue: 280 });
    expect(screen.getByText('Violeta')).toBeTruthy();
    expect(screen.getByRole('img', { name: '80' })).toBeTruthy();
  });

  it('says the lamp is off and keeps its last brightness', () => {
    show({ ...light, on: false });
    expect(screen.getByText('Desligada')).toBeTruthy();
    expect(screen.getByRole('img', { name: '49' })).toBeTruthy();
  });
});

describe('LightPanel freshness', () => {
  it('is not marked stale by default', () => {
    show();
    expect(screen.getByRole('region', { name: 'Luz do PC' }).getAttribute('data-stale')).toBeNull();
  });

  it('is marked stale when the last sync failed, so values are not read as live', () => {
    render(LightPanel, { device, light, onaction: vi.fn(), stale: true });
    expect(screen.getByRole('region', { name: 'Luz do PC' }).getAttribute('data-stale')).toBe('true');
  });
});

describe('LightPanel brightness', () => {
  it('sends a bare brightness in white mode when the slider is released', async () => {
    const onaction = show();
    await fireEvent.change(screen.getByLabelText('Brilho'), { target: { value: '300' } });
    expect(onaction).toHaveBeenCalledWith({ type: 'set_brightness', value: 300 });
  });

  it('sends the whole colour in colour mode, never a bare brightness', async () => {
    const onaction = show(colour);
    await fireEvent.change(screen.getByLabelText('Brilho'), { target: { value: '300' } });
    expect(onaction).toHaveBeenCalledWith({ type: 'set_colour', h: 120, s: 900, v: 300 });
  });

  it('updates the readout live while dragging and sends nothing until release', async () => {
    const onaction = show();
    const slider = screen.getByLabelText('Brilho');
    await fireEvent.input(slider, { target: { value: '1000' } });
    expect(screen.getByRole('img', { name: '100' })).toBeTruthy();
    expect(onaction).not.toHaveBeenCalled();
    await fireEvent.change(slider, { target: { value: '1000' } });
    expect(onaction).toHaveBeenCalledWith({ type: 'set_brightness', value: 1000 });
  });

  it('the plus and minus buttons move brightness by 10% of the range', async () => {
    const onaction = show();
    await fireEvent.click(screen.getByRole('button', { name: 'Diminuir brilho' }));
    expect(onaction).toHaveBeenLastCalledWith({ type: 'set_brightness', value: 401 });
    await fireEvent.click(screen.getByRole('button', { name: 'Aumentar brilho' }));
    expect(onaction).toHaveBeenLastCalledWith({ type: 'set_brightness', value: 599 });
  });

  it('the buttons stay inside the range and respect colour mode', async () => {
    const onaction = show({ ...colour, value: 10 });
    await fireEvent.click(screen.getByRole('button', { name: 'Diminuir brilho' }));
    expect(onaction).toHaveBeenLastCalledWith({ type: 'set_colour', h: 120, s: 900, v: 10 });
  });
});

describe('LightPanel tiles and fine controls', () => {
  it('the white tile shows kelvin and warmth and marks itself pressed in white mode', () => {
    show();
    const tile = screen.getByRole('button', { name: /^Branco/ });
    expect(tile.textContent).toContain('3.100 K');
    expect(tile.textContent).toContain('Quente');
    expect(tile.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /^Cor/ }).getAttribute('aria-pressed')).toBe('false');
  });

  it('keeps icon and label on one row above the value so the tile content fits its height', () => {
    show();
    for (const name of [/^Branco/, /^Cor/]) {
      const tile = screen.getByRole('button', { name });
      const head = tile.querySelector('.head');
      expect(head?.querySelector('small')).toBeTruthy();
      expect(head?.nextElementSibling?.tagName).toBe('B');
    }
  });

  it('the colour tile shows the hue name and saturation in colour mode', () => {
    show({ ...colour, hue: 280, saturation: 900 });
    const tile = screen.getByRole('button', { name: /^Cor/ });
    expect(tile.textContent).toContain('Violeta');
    expect(tile.textContent).toContain('90%');
    expect(tile.getAttribute('aria-pressed')).toBe('true');
  });

  it('tapping the colour tile switches to colour using the remembered colour', async () => {
    const onaction = show();
    await fireEvent.click(screen.getByRole('button', { name: /^Cor/ }));
    expect(onaction).toHaveBeenCalledWith({ type: 'set_colour', h: 120, s: 900, v: 800 });
  });

  it('tapping the white tile switches back to white using the remembered temperature', async () => {
    const onaction = show(colour);
    await fireEvent.click(screen.getByRole('button', { name: /^Branco/ }));
    expect(onaction).toHaveBeenCalledWith({ type: 'set_temperature', value: 100 });
  });

  it('white mode offers temperature, not hue or saturation', () => {
    show();
    expect(screen.getByLabelText('Temperatura')).toBeTruthy();
    expect(screen.queryByLabelText('Matiz')).toBeNull();
    expect(screen.queryByLabelText('Saturação')).toBeNull();
  });

  it('colour mode offers hue and saturation, not temperature', () => {
    show(colour);
    expect(screen.getByLabelText('Matiz')).toBeTruthy();
    expect(screen.getByLabelText('Saturação')).toBeTruthy();
    expect(screen.queryByLabelText('Temperatura')).toBeNull();
  });

  it('the fine sliders send the matching action and keep the rest of the colour', async () => {
    const onaction = show();
    await fireEvent.change(screen.getByLabelText('Temperatura'), { target: { value: '700' } });
    expect(onaction).toHaveBeenLastCalledWith({ type: 'set_temperature', value: 700 });
  });

  it('hue keeps saturation and value, saturation keeps hue and value', async () => {
    const onaction = show(colour);
    await fireEvent.change(screen.getByLabelText('Matiz'), { target: { value: '200' } });
    expect(onaction).toHaveBeenLastCalledWith({ type: 'set_colour', h: 200, s: 900, v: 800 });
    await fireEvent.change(screen.getByLabelText('Saturação'), { target: { value: '400' } });
    expect(onaction).toHaveBeenLastCalledWith({ type: 'set_colour', h: 120, s: 400, v: 800 });
  });
});

describe('LightPanel when the lamp is off', () => {
  it('disables every control so nothing can be sent to a lamp that is off', () => {
    show({ ...light, on: false });
    const disabled = (el: HTMLElement) => (el as HTMLInputElement | HTMLButtonElement).disabled;
    expect(disabled(screen.getByLabelText('Brilho'))).toBe(true);
    expect(disabled(screen.getByLabelText('Temperatura'))).toBe(true);
    expect(disabled(screen.getByRole('button', { name: 'Diminuir brilho' }))).toBe(true);
    expect(disabled(screen.getByRole('button', { name: 'Aumentar brilho' }))).toBe(true);
    expect(disabled(screen.getByRole('button', { name: /^Branco/ }))).toBe(true);
    expect(disabled(screen.getByRole('button', { name: /^Cor/ }))).toBe(true);
  });
});
