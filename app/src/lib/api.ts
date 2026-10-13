import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';
import type { AppError, DeviceView, LightAction, Region } from './types';

/** The calls the UI needs from the Rust core. The store depends on this, not on Tauri. */
export interface Api {
  hasCredentials(): Promise<boolean>;
  saveCredentials(accessId: string, accessSecret: string, region: Region): Promise<void>;
  listDevices(): Promise<DeviceView[]>;
  sendLightCommand(id: string, action: LightAction): Promise<void>;
  isAutostart(): Promise<boolean>;
  setAutostart(on: boolean): Promise<void>;
  setTrayLabels(settings: string, quit: string): Promise<void>;
}

export function toAppError(e: unknown): AppError {
  if (typeof e === 'object' && e !== null && 'kind' in e && 'message' in e) {
    const { kind, message } = e as AppError;
    return { kind: String(kind), message: String(message) };
  }
  return { kind: 'unknown', message: e instanceof Error ? e.message : String(e) };
}

export const tauriApi: Api = {
  hasCredentials: () => invoke<boolean>('has_credentials'),
  saveCredentials: (accessId, accessSecret, region) =>
    invoke('save_credentials', { accessId, accessSecret, region }),
  listDevices: () => invoke<DeviceView[]>('list_devices'),
  sendLightCommand: (id, action) => invoke('send_light_command', { id, action }),
  isAutostart: () => isEnabled(),
  setAutostart: (on) => (on ? enable() : disable()),
  setTrayLabels: (settings, quit) => invoke('set_tray_labels', { settings, quit })
};

export const onDevicesUpdated = (cb: (d: DeviceView[]) => void): Promise<UnlistenFn> =>
  listen<DeviceView[]>('devices-updated', (e) => cb(e.payload));
export const onDevicesError = (cb: (e: AppError) => void): Promise<UnlistenFn> =>
  listen<AppError>('devices-error', (e) => cb(toAppError(e.payload)));
export const onPopupShown = (cb: () => void): Promise<UnlistenFn> =>
  listen('popup-shown', () => cb());
export const onOpenSettings = (cb: () => void): Promise<UnlistenFn> =>
  listen('open-settings', () => cb());
