import { toAppError, type Api } from './api';
import { applyAction } from './light';
import type { AppError, DeviceView, LightAction, Region } from './types';

export type Screen = 'devices' | 'settings';

/** After a command, server reads for that device are distrusted this long: Tuya's status lags the command. */
const PROTECT_MS = 3000;

export class DeviceStore {
  devices = $state<DeviceView[]>([]);
  error = $state<AppError | null>(null);
  loading = $state(false);
  screen = $state<Screen>('devices');
  /** True once credentials exist, so the settings screen can always be cancelled. */
  configured = $state(false);

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
      if (!this.configured) {
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
      this.devices = this.merge(await this.api.listDevices());
      this.error = null;
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
  }

  fail(error: AppError) {
    this.error = error;
    if (error.kind === 'no_credentials') this.screen = 'settings';
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

  async saveCredentials(accessId: string, accessSecret: string, region: Region) {
    await this.api.saveCredentials(accessId, accessSecret, region);
    this.configured = true;
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

  private isProtected(id: string) {
    return (this.inflight.get(id) ?? 0) > 0 || (this.protectedUntil.get(id) ?? 0) > this.now();
  }

  /** Server state wins, except for a lamp the user just commanded: that card keeps its local state. */
  private merge(fresh: DeviceView[]): DeviceView[] {
    return fresh.map((d) => {
      if (!d.light || !this.isProtected(d.id)) return d;
      const local = this.devices.find((x) => x.id === d.id);
      return local?.light ? { ...d, light: local.light } : d;
    });
  }

  private setLight(id: string, light: DeviceView['light']) {
    this.devices = this.devices.map((d) => (d.id === id ? { ...d, light } : d));
  }
}
