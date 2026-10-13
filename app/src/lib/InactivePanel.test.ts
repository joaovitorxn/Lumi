import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import InactivePanel from './InactivePanel.svelte';
import type { DeviceView } from './types';

const base: DeviceView = { id: 'x', name: 'Corredor', category: 'dj', online: true, light: null };

describe('InactivePanel', () => {
  it('shows the device name and why it has no controls', () => {
    const { unmount } = render(InactivePanel, { device: { ...base, online: false } });
    expect(screen.getByText('Corredor')).toBeTruthy();
    expect(screen.getByText('Offline')).toBeTruthy();
    unmount();
    const second = render(InactivePanel, { device: { ...base, category: 'cz' } });
    expect(screen.getByText('Ainda não suportado')).toBeTruthy();
    second.unmount();
    render(InactivePanel, { device: base });
    expect(screen.getByText('Sem resposta')).toBeTruthy();
  });

  it('offers no controls', () => {
    render(InactivePanel, { device: base });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
  });
});
