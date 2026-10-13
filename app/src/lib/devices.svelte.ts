import { toAppError, type Api } from './api';
import { applyAction } from './light';
import type { AppError, CameraAction, DeviceView, LightAction, Region } from './types';

export type Screen = 'devices' | 'settings' | 'credentials';

/** After a command, server reads for that device are distrusted this long: Tuya's status lags the command. */
const PROTECT_MS = 3000;

export class DeviceStore {
  devices = $state<DeviceView[]>([]);
  error = $state<AppError | null>(null);
  loading = $state(false);
  screen = $state<Screen>('devices');
  /** True once credentials exist, so the settings screen can always be cancelled. */
  configured = $state(false);
  /** Whether Lumi is registered to start with Windows. */
  autostart = $state(false);
  /** Timestamp of the last successful read from the cloud, or null before the first one. */
  lastSync = $state<number | null>(null);

  /** Commands in flight per device. */
  private inflight = new Map<string, number>();
  /** Per device: until when its card is owned by the last command rather than by server reads. */
  private protectedUntil = new Map<string, number>();
  /** Per device: number of the newest action, so an older failure cannot roll back a newer one. */
  private actionSeq = new Map<string, number>();

  constructor(
    private api: Api,
    private now: () => number = Date.now
  ) {}

  /** First load: go to settings when nothing is configured yet. */
  async start() {
    try {
      this.configured = await this.api.hasCredentials();
      this.autostart = await this.api.isAutostart().catch(() => false);
      if (!this.configured) {
        this.screen = 'credentials';
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
      this.devices = this.merge(await this.api.listDevices());
      this.error = null;
      this.lastSync = this.now();
    } catch (e) {
      this.fail(toAppError(e));
    } finally {
      this.loading = false;
    }
  }

  /** Push update from the Rust refresh loop. */
  receive(devices: DeviceView[]) {
    this.devices = this.merge(devices);
    this.error = null;
    this.lastSync = this.now();
  }

  fail(error: AppError) {
    this.error = error;
    if (error.kind === 'no_credentials') this.screen = 'credentials';
  }

  async sendLight(id: string, action: LightAction) {
    const before = this.devices.find((d) => d.id === id);
    if (!before?.light) return;
    const previousLight = before.light;
    const seq = (this.actionSeq.get(id) ?? 0) + 1;
    this.actionSeq.set(id, seq);
    this.setLight(id, applyAction(previousLight, action));
    this.inflight.set(id, (this.inflight.get(id) ?? 0) + 1);
    try {
      await this.api.sendLightCommand(id, action);
    } catch (e) {
      // A newer action already changed the card; rolling back would erase it.
      if (this.actionSeq.get(id) === seq) this.setLight(id, previousLight);
      this.fail(toAppError(e));
    } finally {
      this.inflight.set(id, (this.inflight.get(id) ?? 1) - 1);
      this.protectedUntil.set(id, this.now() + PROTECT_MS);
    }
  }

  /** Movement is fire-and-forget; the toggles update the card at once and roll back on failure. */
  async sendCamera(id: string, action: CameraAction) {
    const before = this.devices.find((d) => d.id === id)?.camera;
    if (!before) return;
    const next =
      action.type === 'set_private'
        ? { ...before, private: action.on }
        : action.type === 'set_motion_tracking'
          ? { ...before, motion_tracking: action.on }
          : before;
    if (next !== before) this.setCamera(id, next);
    this.inflight.set(id, (this.inflight.get(id) ?? 0) + 1);
    try {
      await this.api.sendCameraCommand(id, action);
    } catch (e) {
      if (next !== before) this.setCamera(id, before);
      this.fail(toAppError(e));
    } finally {
      this.inflight.set(id, (this.inflight.get(id) ?? 1) - 1);
      this.protectedUntil.set(id, this.now() + PROTECT_MS);
    }
  }

  async saveCredentials(accessId: string, accessSecret: string, region: Region) {
    await this.api.saveCredentials(accessId, accessSecret, region);
    this.configured = true;
    this.screen = 'devices';
    this.error = null;
    await this.refresh();
  }

  /** The settings menu, or straight to the credentials form while there are none yet. */
  openSettings() {
    this.screen = this.configured ? 'settings' : 'credentials';
  }

  openCredentials() {
    this.screen = 'credentials';
  }

  /** Leaves the credentials form without saving: back to the menu it was opened from. */
  closeCredentials() {
    this.screen = 'settings';
  }

  async setAutostart(on: boolean) {
    const before = this.autostart;
    this.autostart = on;
    try {
      await this.api.setAutostart(on);
    } catch (e) {
      this.autostart = before;
      this.error = toAppError(e);
    }
  }

  closeSettings() {
    this.screen = 'devices';
  }

  private isProtected(id: string) {
    return (this.inflight.get(id) ?? 0) > 0 || (this.protectedUntil.get(id) ?? 0) > this.now();
  }

  /** Server state wins, except for a lamp the user just commanded: that card keeps its local state. */
  private merge(fresh: DeviceView[]): DeviceView[] {
    return fresh.map((d) => {
      if (!this.isProtected(d.id)) return d;
      const local = this.devices.find((x) => x.id === d.id);
      return {
        ...d,
        light: d.light && local?.light ? local.light : d.light,
        camera: d.camera && local?.camera ? local.camera : d.camera
      };
    });
  }

  private setCamera(id: string, camera: DeviceView['camera']) {
    this.devices = this.devices.map((d) => (d.id === id ? { ...d, camera } : d));
  }

  private setLight(id: string, light: DeviceView['light']) {
    this.devices = this.devices.map((d) => (d.id === id ? { ...d, light } : d));
  }
}
