import { describe, expect, it, vi } from 'vitest';
import type { Api } from './api';
import { DeviceStore } from './devices.svelte';
import type { DeviceView, LightState } from './types';

const light: LightState = {
  on: true,
  mode: 'white',
  brightness: 500,
  temperature: 0,
  hue: 0,
  saturation: 1000,
  value: 1000
};
const lamp: DeviceView = { id: 'lamp', name: 'Luz', category: 'dj', online: true, light };

function fakeApi(over: Partial<Api> = {}): Api {
  return {
    hasCredentials: vi.fn().mockResolvedValue(true),
    saveCredentials: vi.fn().mockResolvedValue(undefined),
    listDevices: vi.fn().mockResolvedValue([lamp]),
    sendLightCommand: vi.fn().mockResolvedValue(undefined),
    ...over
  };
}

describe('DeviceStore', () => {
  it('start goes to settings when there are no credentials', async () => {
    const store = new DeviceStore(fakeApi({ hasCredentials: vi.fn().mockResolvedValue(false) }));
    await store.start();
    expect(store.screen).toBe('settings');
  });

  it('start loads devices when credentials exist', async () => {
    const store = new DeviceStore(fakeApi());
    await store.start();
    expect(store.devices).toEqual([lamp]);
    expect(store.error).toBeNull();
  });

  it('a failed refresh keeps the old devices and records the error', async () => {
    const api = fakeApi();
    const store = new DeviceStore(api);
    await store.refresh();
    api.listDevices = vi.fn().mockRejectedValue({ kind: 'network', message: 'sem conexão' });
    await store.refresh();
    expect(store.devices).toEqual([lamp]);
    expect(store.error).toEqual({ kind: 'network', message: 'sem conexão' });
  });

  it('a no_credentials error opens settings', async () => {
    const store = new DeviceStore(
      fakeApi({ listDevices: vi.fn().mockRejectedValue({ kind: 'no_credentials', message: 'x' }) })
    );
    await store.refresh();
    expect(store.screen).toBe('settings');
  });

  it('sendLight updates the card immediately and calls the API', async () => {
    let release!: () => void;
    const api = fakeApi({
      sendLightCommand: vi.fn().mockImplementation(() => new Promise<void>((r) => (release = r)))
    });
    const store = new DeviceStore(api);
    await store.refresh();
    const sending = store.sendLight('lamp', { type: 'set_power', on: false });
    expect(store.devices[0].light?.on).toBe(false);
    release();
    await sending;
    expect(api.sendLightCommand).toHaveBeenCalledWith('lamp', { type: 'set_power', on: false });
    expect(store.devices[0].light?.on).toBe(false);
  });

  it('sendLight reverts the card and shows the error when the API fails', async () => {
    const store = new DeviceStore(
      fakeApi({ sendLightCommand: vi.fn().mockRejectedValue({ kind: 'api', message: 'falhou' }) })
    );
    await store.refresh();
    await store.sendLight('lamp', { type: 'set_power', on: false });
    expect(store.devices[0].light?.on).toBe(true);
    expect(store.error?.message).toBe('falhou');
  });

  it('background updates are ignored while a command is in flight', async () => {
    let release!: () => void;
    let t = 1_000;
    const store = new DeviceStore(
      fakeApi({ sendLightCommand: vi.fn().mockImplementation(() => new Promise<void>((r) => (release = r))) }),
      () => t
    );
    await store.refresh();
    const sending = store.sendLight('lamp', { type: 'set_power', on: false });
    store.receive([lamp]);
    expect(store.devices[0].light?.on).toBe(false);
    release();
    await sending;
    t += 5_000;
    store.receive([lamp]);
    expect(store.devices[0].light?.on).toBe(true);
  });

  it('sendLight on an unknown or offline device does nothing', async () => {
    const api = fakeApi({ listDevices: vi.fn().mockResolvedValue([{ ...lamp, online: false, light: null }]) });
    const store = new DeviceStore(api);
    await store.refresh();
    await store.sendLight('lamp', { type: 'set_power', on: true });
    await store.sendLight('ghost', { type: 'set_power', on: true });
    expect(api.sendLightCommand).not.toHaveBeenCalled();
  });

  it('saving credentials returns to the device list and refreshes', async () => {
    const api = fakeApi();
    const store = new DeviceStore(api);
    store.openSettings();
    await store.saveCredentials('id', 'secret', 'us');
    expect(api.saveCredentials).toHaveBeenCalledWith('id', 'secret', 'us');
    expect(store.screen).toBe('devices');
    expect(store.devices).toEqual([lamp]);
  });

  it('a push that arrives right after a command finished does not undo it', async () => {
    let t = 1_000;
    const store = new DeviceStore(fakeApi(), () => t);
    await store.refresh();
    await store.sendLight('lamp', { type: 'set_power', on: false });
    t += 1_000;
    store.receive([lamp]); // status that was read before the command landed
    expect(store.devices[0].light?.on).toBe(false);
    t += 5_000;
    store.receive([lamp]);
    expect(store.devices[0].light?.on).toBe(true);
  });

  it('refresh also keeps a device that was just commanded', async () => {
    let t = 1_000;
    const store = new DeviceStore(fakeApi(), () => t);
    await store.refresh();
    await store.sendLight('lamp', { type: 'set_power', on: false });
    t += 1_000;
    await store.refresh(); // the fake API still reports the old state
    expect(store.devices[0].light?.on).toBe(false);
  });

  it('a failed older command does not roll back a newer one', async () => {
    let rejectFirst!: (e: unknown) => void;
    const send = vi
      .fn()
      .mockImplementationOnce(() => new Promise<void>((_, reject) => (rejectFirst = reject)))
      .mockResolvedValue(undefined);
    const store = new DeviceStore(fakeApi({ sendLightCommand: send }));
    await store.refresh();
    const first = store.sendLight('lamp', { type: 'set_power', on: false });
    await store.sendLight('lamp', { type: 'set_brightness', value: 300 });
    rejectFirst({ kind: 'api', message: 'falhou' });
    await first;
    expect(store.devices[0].light).toMatchObject({ on: false, brightness: 300 });
    expect(store.error?.message).toBe('falhou');
  });

  it('remembers whether credentials exist so settings can be cancelled', async () => {
    const store = new DeviceStore(fakeApi());
    expect(store.configured).toBe(false);
    await store.start();
    expect(store.configured).toBe(true);
    const fresh = new DeviceStore(fakeApi({ hasCredentials: vi.fn().mockResolvedValue(false) }));
    await fresh.start();
    expect(fresh.configured).toBe(false);
    await fresh.saveCredentials('id', 'secret', 'us');
    expect(fresh.configured).toBe(true);
  });
});
