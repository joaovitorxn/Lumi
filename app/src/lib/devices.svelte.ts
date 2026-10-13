import { toAppError, type Api } from './api';
import { applyAction } from './light';
import type { AppError, DeviceView, LightAction, Region } from './types';

export type Screen = 'devices' | 'settings';

export class DeviceStore {
  devices = $state<DeviceView[]>([]);
  error = $state<AppError | null>(null);
  loading = $state(false);
  screen = $state<Screen>('devices');

  /** Commands in flight. Background updates are ignored meanwhile so they cannot undo the optimistic change. */
  private pending = 0;

  constructor(private api: Api) {}

  /** First load: go to settings when nothing is configured yet. */
  async start() {
    try {
      if (!(await this.api.hasCredentials())) {
        this.screen = 'settings';
        return;
      }
    } catch (e) {
      this.error = toAppError(e);
      return;
    }
    await this.refresh();
  }

  async refresh() {
    this.loading = true;
    try {
      this.devices = await this.api.listDevices();
      this.error = null;
    } catch (e) {
      this.fail(toAppError(e));
    } finally {
      this.loading = false;
    }
  }

  /** Push update from the Rust refresh loop. */
  receive(devices: DeviceView[]) {
    if (this.pending > 0) return;
    this.devices = devices;
    this.error = null;
  }

  fail(error: AppError) {
    this.error = error;
    if (error.kind === 'no_credentials') this.screen = 'settings';
  }

  async sendLight(id: string, action: LightAction) {
    const before = this.devices.find((d) => d.id === id);
    if (!before?.light) return;
    const previousLight = before.light;
    this.setLight(id, applyAction(previousLight, action));
    this.pending++;
    try {
      await this.api.sendLightCommand(id, action);
    } catch (e) {
      this.setLight(id, previousLight);
      this.fail(toAppError(e));
    } finally {
      this.pending--;
    }
  }

  async saveCredentials(accessId: string, accessSecret: string, region: Region) {
    await this.api.saveCredentials(accessId, accessSecret, region);
    this.screen = 'devices';
    this.error = null;
    await this.refresh();
  }

  openSettings() {
    this.screen = 'settings';
  }

  closeSettings() {
    this.screen = 'devices';
  }

  private setLight(id: string, light: DeviceView['light']) {
    this.devices = this.devices.map((d) => (d.id === id ? { ...d, light } : d));
  }
}
