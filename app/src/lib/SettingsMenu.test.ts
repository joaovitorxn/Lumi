import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { locale } from './i18n.svelte';
import SettingsMenu from './SettingsMenu.svelte';

const props = () => ({ autostart: false, onback: vi.fn(), oncredentials: vi.fn(), onautostart: vi.fn() });

describe('SettingsMenu', () => {
  afterEach(() => locale.set('pt'));

  it('opens the credentials form', async () => {
    const p = props();
    render(SettingsMenu, p);
    await fireEvent.click(screen.getByRole('button', { name: /Credenciais Tuya/ }));
    expect(p.oncredentials).toHaveBeenCalled();
  });

  it('toggles start with Windows', async () => {
    const p = { ...props(), autostart: true };
    render(SettingsMenu, p);
    const toggle = screen.getByRole('switch', { name: 'Iniciar com o Windows' });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    await fireEvent.click(toggle);
    expect(p.onautostart).toHaveBeenCalledWith(false);
  });

  it('switches the whole interface language', async () => {
    render(SettingsMenu, props());
    await fireEvent.click(screen.getByRole('radio', { name: 'English' }));
    expect(locale.current).toBe('en');
    expect(screen.getByText('Start with Windows')).toBeTruthy();
    await fireEvent.click(screen.getByRole('radio', { name: 'Español' }));
    expect(screen.getByText('Iniciar con Windows')).toBeTruthy();
  });

  it('goes back', async () => {
    const p = props();
    render(SettingsMenu, p);
    await fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(p.onback).toHaveBeenCalled();
  });
});
