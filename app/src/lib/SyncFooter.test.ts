import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import SyncFooter from './SyncFooter.svelte';

const base = { loading: false, error: null, lastSync: null, onrefresh: vi.fn(), onsettings: vi.fn() };

describe('SyncFooter', () => {
  it('says it is updating while loading and blocks a second refresh', () => {
    render(SyncFooter, { ...base, loading: true });
    expect(screen.getByText('Atualizando…')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Atualizar' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows the time of the last successful sync', () => {
    render(SyncFooter, { ...base, lastSync: new Date(2026, 9, 12, 14, 5).getTime() });
    expect(screen.getByText('Sincronizado às 14:05')).toBeTruthy();
  });

  it('waits quietly before the first sync', () => {
    render(SyncFooter, base);
    expect(screen.getByText('Aguardando…')).toBeTruthy();
  });

  it('announces an error as a capitalised sentence', () => {
    render(SyncFooter, { ...base, error: { kind: 'network', message: 'sem conexão com a Tuya' } });
    expect(screen.getByRole('alert').textContent).toContain('Sem conexão com a Tuya');
  });

  it('offers the recovery next to the error and calls refresh', async () => {
    const onrefresh = vi.fn();
    render(SyncFooter, { ...base, onrefresh, error: { kind: 'network', message: 'sem conexão' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onrefresh).toHaveBeenCalledOnce();
  });

  it('keeps the plain refresh button out of the way while an error shows its own retry', () => {
    render(SyncFooter, { ...base, error: { kind: 'network', message: 'sem conexão' } });
    expect(screen.queryByRole('button', { name: 'Atualizar' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Configurações' })).toBeTruthy();
  });

  it('a long error is clipped for display but kept whole for hover and screen readers', () => {
    const message = 'x'.repeat(300);
    render(SyncFooter, { ...base, error: { kind: 'api', message } });
    expect(screen.getByRole('alert').getAttribute('title')).toBe(message);
  });

  it('refresh and settings buttons call back', async () => {
    const onrefresh = vi.fn();
    const onsettings = vi.fn();
    render(SyncFooter, { ...base, onrefresh, onsettings });
    await fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Configurações' }));
    expect(onrefresh).toHaveBeenCalledOnce();
    expect(onsettings).toHaveBeenCalledOnce();
  });
});
