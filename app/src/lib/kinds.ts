import type { Key } from './i18n.svelte';
import type { DeviceView } from './types';

export interface Kind {
  id: string;
  label: Key;
  categories: string[];
}

/** Device sections in display order; any category not listed falls into the last one. */
export const KINDS: Kind[] = [
  { id: 'lights', label: 'devices.lights', categories: ['dj'] },
  { id: 'cameras', label: 'devices.cameras', categories: ['sp'] },
  { id: 'plugs', label: 'devices.plugs', categories: ['cz'] },
  { id: 'other', label: 'devices.other', categories: [] }
];

const kindOf = (category: string) => KINDS.find((k) => k.categories.includes(category)) ?? KINDS[KINDS.length - 1];

/** Devices grouped by kind, keeping the cloud's order inside each group; empty groups are dropped. */
export function groupByKind(devices: DeviceView[]): (Kind & { devices: DeviceView[] })[] {
  return KINDS.map((kind) => ({ ...kind, devices: devices.filter((d) => kindOf(d.category) === kind) })).filter(
    (g) => g.devices.length
  );
}

/** The device the menu lists first, which is the one shown when nothing is chosen yet. */
export const firstDevice = (devices: DeviceView[]): DeviceView | undefined => groupByKind(devices)[0]?.devices[0];
