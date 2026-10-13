import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import DeviceIcon from './DeviceIcon.svelte';

function iconOf(props: { category: string; on?: boolean; color?: string; glow?: number }) {
  const { container } = render(DeviceIcon, props);
  return container.querySelector('[data-kind]') as HTMLElement;
}

describe('DeviceIcon', () => {
  it('a lit lamp is marked on and carries the lamp colour and glow', () => {
    const el = iconOf({ category: 'dj', on: true, color: 'rgb(255, 180, 107)', glow: 0.8 });
    expect(el.dataset.kind).toBe('light');
    expect(el.dataset.state).toBe('on');
    expect(el.style.getPropertyValue('--lamp')).toBe('rgb(255, 180, 107)');
    expect(el.style.getPropertyValue('--glow')).toBe('0.8');
  });

  it('an off lamp is marked off and has no glow', () => {
    const el = iconOf({ category: 'dj', on: false, color: '#3b4050', glow: 0 });
    expect(el.dataset.kind).toBe('light');
    expect(el.dataset.state).toBe('off');
    expect(el.style.getPropertyValue('--glow')).toBe('0');
  });

  it('draws a plug, a camera and a generic device for the other Tuya categories', () => {
    expect(iconOf({ category: 'cz' }).dataset.kind).toBe('plug');
    expect(iconOf({ category: 'sp' }).dataset.kind).toBe('camera');
    expect(iconOf({ category: 'qualquer-outra' }).dataset.kind).toBe('device');
  });

  it('is decorative: it never adds an accessible name of its own', () => {
    const el = iconOf({ category: 'dj', on: true, color: '#fff', glow: 1 });
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
});
