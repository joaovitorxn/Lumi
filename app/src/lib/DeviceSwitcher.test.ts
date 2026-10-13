import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import DeviceSwitcher from './DeviceSwitcher.svelte';
import type { DeviceView } from './types';

const light = { on: true, mode: 'white', brightness: 500, temperature: 0, hue: 0, saturation: 0, value: 800 } as const;
const devices: DeviceView[] = [
  { id: 'a', name: 'Luz do PC', category: 'dj', online: true, light },
  { id: 'b', name: 'Abajur', category: 'dj', online: true, light: { ...light, on: false } },
  { id: 'c', name: 'Tomada', category: 'cz', online: true, light: null }
];

describe('DeviceSwitcher', () => {
  it('lists every device as a button inside a labelled navigation', () => {
    render(DeviceSwitcher, { devices, selectedId: 'a', onselect: vi.fn() });
    const nav = screen.getByRole('navigation', { name: 'Aparelhos' });
    expect(nav.querySelectorAll('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /Abajur/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Tomada/ })).toBeTruthy();
  });

  it('marks only the selected device as current', () => {
    render(DeviceSwitcher, { devices, selectedId: 'b', onselect: vi.fn() });
    expect(screen.getByRole('button', { name: /Abajur/ }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('button', { name: /Luz do PC/ }).getAttribute('aria-current')).toBeNull();
  });

  it('reports the chosen device', async () => {
    const onselect = vi.fn();
    render(DeviceSwitcher, { devices, selectedId: 'a', onselect });
    await fireEvent.click(screen.getByRole('button', { name: /Tomada/ }));
    expect(onselect).toHaveBeenCalledWith('c');
  });

  it('turns the vertical mouse wheel into sideways scrolling when the row overflows', async () => {
    render(DeviceSwitcher, { devices, selectedId: 'a', onselect: vi.fn() });
    const nav = screen.getByRole('navigation', { name: 'Aparelhos' });
    Object.defineProperty(nav, 'scrollWidth', { value: 600, configurable: true });
    Object.defineProperty(nav, 'clientWidth', { value: 300, configurable: true });
    const notPrevented = await fireEvent.wheel(nav, { deltaY: 120 });
    expect(notPrevented).toBe(false);
  });

  it('leaves the wheel alone when everything fits', async () => {
    render(DeviceSwitcher, { devices, selectedId: 'a', onselect: vi.fn() });
    const nav = screen.getByRole('navigation', { name: 'Aparelhos' });
    Object.defineProperty(nav, 'scrollWidth', { value: 300, configurable: true });
    Object.defineProperty(nav, 'clientWidth', { value: 300, configurable: true });
    expect(await fireEvent.wheel(nav, { deltaY: 120 })).toBe(true);
  });

  it('renders nothing clickable for an empty list', () => {
    render(DeviceSwitcher, { devices: [], selectedId: '', onselect: vi.fn() });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
