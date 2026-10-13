import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import DeviceSwitcher from './DeviceSwitcher.svelte';
import type { DeviceView } from './types';

const light = { on: true, mode: 'white', brightness: 500, temperature: 0, hue: 0, saturation: 0, value: 800 } as const;
const devices: DeviceView[] = [
  { id: 'a', name: 'Luz do PC', category: 'dj', online: true, light, camera: null },
  { id: 'b', name: 'Abajur', category: 'dj', online: true, light: { ...light, on: false }, camera: null },
  { id: 'c', name: 'Tomada', category: 'cz', online: true, light: null, camera: null }
];

const trigger = () => screen.getByRole('button', { name: 'Aparelhos' });

describe('DeviceSwitcher', () => {
  it('shows only the selected device until it is opened', () => {
    render(DeviceSwitcher, { devices, selectedId: 'b', onselect: vi.fn() });
    expect(trigger().textContent).toContain('Abajur');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('opens a listbox with every device and marks the selected one', async () => {
    render(DeviceSwitcher, { devices, selectedId: 'b', onselect: vi.fn() });
    await fireEvent.click(trigger());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: /Abajur/ }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('option', { name: /Luz do PC/ }).getAttribute('aria-selected')).toBe('false');
  });

  it('reports the chosen device and closes', async () => {
    const onselect = vi.fn();
    render(DeviceSwitcher, { devices, selectedId: 'a', onselect });
    await fireEvent.click(trigger());
    await fireEvent.click(screen.getByRole('option', { name: /Tomada/ }));
    expect(onselect).toHaveBeenCalledWith('c');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('closes on Escape without choosing', async () => {
    const onselect = vi.fn();
    render(DeviceSwitcher, { devices, selectedId: 'a', onselect });
    await fireEvent.click(trigger());
    await fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onselect).not.toHaveBeenCalled();
  });

  it('closes when the pointer goes down outside', async () => {
    render(DeviceSwitcher, { devices, selectedId: 'a', onselect: vi.fn() });
    await fireEvent.click(trigger());
    await fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('has nothing to open for an empty list', () => {
    render(DeviceSwitcher, { devices: [], selectedId: '', onselect: vi.fn() });
    expect((trigger() as HTMLButtonElement).disabled).toBe(true);
  });
});
