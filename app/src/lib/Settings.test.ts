import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Settings from './Settings.svelte';

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
