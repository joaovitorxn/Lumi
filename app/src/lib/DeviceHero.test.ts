import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import DeviceHero from './DeviceHero.svelte';

const warm = { core: 'rgb(255 220 168)', edge: 'rgb(232 163 90)', rgb: '255 196 120' };

function heroOf(props: { category: string; on?: boolean; look?: typeof warm }) {
  const { container } = render(DeviceHero, props);
  return container.querySelector('[data-kind]') as HTMLElement;
}

describe('DeviceHero', () => {
  it('a lit lamp is marked on and carries the lamp light as CSS variables', () => {
    const el = heroOf({ category: 'dj', on: true, look: warm });
    expect(el.dataset.kind).toBe('light');
    expect(el.dataset.state).toBe('on');
    expect(el.style.getPropertyValue('--light')).toBe('255 196 120');
    expect(el.style.getPropertyValue('--core')).toBe('rgb(255 220 168)');
    expect(el.style.getPropertyValue('--edge')).toBe('rgb(232 163 90)');
  });

  it('an off lamp is marked off', () => {
    expect(heroOf({ category: 'dj', on: false }).dataset.state).toBe('off');
  });

  it('draws a plug, a camera and a generic device for the other Tuya categories', () => {
    expect(heroOf({ category: 'cz' }).dataset.kind).toBe('plug');
    expect(heroOf({ category: 'sp' }).dataset.kind).toBe('camera');
    expect(heroOf({ category: 'qualquer-outra' }).dataset.kind).toBe('device');
  });

  it('is decorative: hidden from assistive tech', () => {
    expect(heroOf({ category: 'dj', on: true, look: warm }).getAttribute('aria-hidden')).toBe('true');
  });

  it('two lamps on the page never share gradient ids', () => {
    const { container } = render(DeviceHero, { category: 'dj', on: true, look: warm });
    const second = render(DeviceHero, { category: 'dj', on: true, look: warm });
    const ids = [...container.querySelectorAll('[id]'), ...second.container.querySelectorAll('[id]')].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
