import { describe, expect, it } from 'vitest';
import { firstDevice, groupByKind } from './kinds';
import type { DeviceView } from './types';

const device = (id: string, category: string): DeviceView => ({
  id,
  name: id,
  category,
  online: true,
  light: null,
  camera: null
});

describe('groupByKind', () => {
  it('orders lamps, cameras, plugs, then the rest, keeping the order inside each group', () => {
    const groups = groupByKind([device('cam', 'sp'), device('a', 'dj'), device('x', 'wsdcg'), device('b', 'dj')]);
    expect(groups.map((g) => [g.id, g.devices.map((d) => d.id)])).toEqual([
      ['lights', ['a', 'b']],
      ['cameras', ['cam']],
      ['other', ['x']]
    ]);
  });
});

describe('firstDevice', () => {
  it('is the first lamp even when the cloud lists another device first', () => {
    expect(firstDevice([device('cam', 'sp'), device('plug', 'cz'), device('a', 'dj')])?.id).toBe('a');
  });

  it('falls back to the next kind without lamps, and to nothing without devices', () => {
    expect(firstDevice([device('plug', 'cz'), device('cam', 'sp')])?.id).toBe('cam');
    expect(firstDevice([])).toBeUndefined();
  });
});
