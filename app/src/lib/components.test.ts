import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import InactiveCard from './InactiveCard.svelte';
import LightCard from './LightCard.svelte';
import Settings from './Settings.svelte';
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
const device: DeviceView = { id: 'lamp', name: 'Luz do PC', category: 'dj', online: true, light };

describe('LightCard', () => {
  it('clicking the bulb toggles power', async () => {
    const onaction = vi.fn();
    render(LightCard, { device, light, onaction });
    await fireEvent.click(screen.getByRole('button', { name: 'Desligar Luz do PC' }));
    expect(onaction).toHaveBeenCalledWith({ type: 'set_power', on: false });
  });

  it('an off lamp offers to turn on', () => {
    render(LightCard, { device, light: { ...light, on: false }, onaction: vi.fn() });
    expect(screen.getByRole('button', { name: 'Ligar Luz do PC' })).toBeTruthy();
    expect(screen.getByText('Desligada')).toBeTruthy();
  });

  it('controls are hidden until the card is expanded', async () => {
    render(LightCard, { device, light, onaction: vi.fn() });
    expect(screen.queryByLabelText('Brilho')).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Ajustes de Luz do PC' }));
    expect(screen.getByLabelText('Brilho')).toBeTruthy();
  });

  it('white mode shows temperature, not hue', async () => {
    render(LightCard, { device, light, onaction: vi.fn() });
    await fireEvent.click(screen.getByRole('button', { name: 'Ajustes de Luz do PC' }));
    expect(screen.getByLabelText('Temperatura')).toBeTruthy();
    expect(screen.queryByLabelText('Matiz')).toBeNull();
  });

  it('colour mode shows hue and saturation, not temperature', async () => {
    render(LightCard, { device, light: { ...light, mode: 'colour' }, onaction: vi.fn() });
    await fireEvent.click(screen.getByRole('button', { name: 'Ajustes de Luz do PC' }));
    expect(screen.getByLabelText('Matiz')).toBeTruthy();
    expect(screen.getByLabelText('Saturação')).toBeTruthy();
    expect(screen.queryByLabelText('Temperatura')).toBeNull();
  });

  it('moving sliders sends the matching action', async () => {
    const onaction = vi.fn();
    render(LightCard, { device, light, onaction });
    await fireEvent.click(screen.getByRole('button', { name: 'Ajustes de Luz do PC' }));
    await fireEvent.change(screen.getByLabelText('Brilho'), { target: { value: '300' } });
    expect(onaction).toHaveBeenLastCalledWith({ type: 'set_brightness', value: 300 });
    await fireEvent.change(screen.getByLabelText('Temperatura'), { target: { value: '700' } });
    expect(onaction).toHaveBeenLastCalledWith({ type: 'set_temperature', value: 700 });
  });

  it('hue slider keeps the current saturation and value', async () => {
    const onaction = vi.fn();
    render(LightCard, { device, light: { ...light, mode: 'colour' }, onaction });
    await fireEvent.click(screen.getByRole('button', { name: 'Ajustes de Luz do PC' }));
    await fireEvent.change(screen.getByLabelText('Matiz'), { target: { value: '200' } });
    expect(onaction).toHaveBeenLastCalledWith({ type: 'set_colour', h: 200, s: 900, v: 800 });
  });

  it('the Cor button switches to colour using the remembered colour', async () => {
    const onaction = vi.fn();
    render(LightCard, { device, light, onaction });
    await fireEvent.click(screen.getByRole('button', { name: 'Ajustes de Luz do PC' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Cor' }));
    expect(onaction).toHaveBeenCalledWith({ type: 'set_colour', h: 120, s: 900, v: 800 });
  });

  it('clicking the card name also toggles power', async () => {
    const onaction = vi.fn();
    render(LightCard, { device, light, onaction });
    await fireEvent.click(screen.getByText('Luz do PC'));
    expect(onaction).toHaveBeenCalledWith({ type: 'set_power', on: false });
  });

  it('brightness in colour mode sends the whole colour, never a bare brightness', async () => {
    const onaction = vi.fn();
    render(LightCard, { device, light: { ...light, mode: 'colour' }, onaction });
    await fireEvent.click(screen.getByRole('button', { name: 'Ajustes de Luz do PC' }));
    await fireEvent.change(screen.getByLabelText('Brilho'), { target: { value: '300' } });
    expect(onaction).toHaveBeenLastCalledWith({ type: 'set_colour', h: 120, s: 900, v: 300 });
  });
});

describe('InactiveCard', () => {
  const base = { ...device, light: null };

  it('explains why a device has no controls', () => {
    const { unmount } = render(InactiveCard, { device: { ...base, online: false } });
    expect(screen.getByText('Offline')).toBeTruthy();
    unmount();
    const second = render(InactiveCard, { device: { ...base, category: 'cz' } });
    expect(screen.getByText('Ainda não suportado')).toBeTruthy();
    second.unmount();
    render(InactiveCard, { device: base });
    expect(screen.getByText('Sem resposta')).toBeTruthy();
  });
});

describe('Settings', () => {
  it('does not submit empty credentials', async () => {
    const onsave = vi.fn();
    render(Settings, { onsave });
    await fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onsave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('Preencha');
  });

  it('submits the typed values with the chosen region', async () => {
    const onsave = vi.fn().mockResolvedValue(undefined);
    render(Settings, { onsave });
    await fireEvent.input(screen.getByLabelText('Access ID'), { target: { value: 'abc' } });
    await fireEvent.input(screen.getByLabelText('Access Secret'), { target: { value: 'xyz' } });
    await fireEvent.change(screen.getByLabelText('Região'), { target: { value: 'eu' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onsave).toHaveBeenCalledWith('abc', 'xyz', 'eu');
  });

  it('shows the error when saving fails', async () => {
    const onsave = vi.fn().mockRejectedValue({ kind: 'storage', message: 'cofre indisponível' });
    render(Settings, { onsave });
    await fireEvent.input(screen.getByLabelText('Access ID'), { target: { value: 'abc' } });
    await fireEvent.input(screen.getByLabelText('Access Secret'), { target: { value: 'xyz' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect((await screen.findByRole('alert')).textContent).toContain('cofre indisponível');
  });

  it('cancel is only offered when a handler is given', () => {
    const { unmount } = render(Settings, { onsave: vi.fn() });
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull();
    unmount();
    render(Settings, { onsave: vi.fn(), oncancel: vi.fn() });
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  });
});
