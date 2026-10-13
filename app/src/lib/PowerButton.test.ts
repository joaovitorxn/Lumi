import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import PowerButton from './PowerButton.svelte';

describe('PowerButton', () => {
  it('offers to turn a lit device off and reports it pressed', async () => {
    const onclick = vi.fn();
    render(PowerButton, { name: 'Luz do PC', on: true, onclick });
    const button = screen.getByRole('button', { name: 'Desligar Luz do PC' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    await fireEvent.click(button);
    expect(onclick).toHaveBeenCalledOnce();
  });

  it('offers to turn an off device on', () => {
    render(PowerButton, { name: 'Luz do PC', on: false, onclick: vi.fn() });
    const button = screen.getByRole('button', { name: 'Ligar Luz do PC' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('can be disabled', () => {
    render(PowerButton, { name: 'Luz do PC', on: true, disabled: true, onclick: vi.fn() });
    const button = screen.getByRole('button', { name: 'Desligar Luz do PC' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
