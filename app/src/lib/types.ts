export type LightMode = 'white' | 'colour';

export interface LightState {
  on: boolean;
  mode: LightMode;
  /** 10..1000, used in white mode */
  brightness: number;
  /** 0 (warm) .. 1000 (cool) */
  temperature: number;
  /** 0..360 */
  hue: number;
  /** 0..1000 */
  saturation: number;
  /** 10..1000, brightness in colour mode */
  value: number;
}

export interface DeviceView {
  id: string;
  name: string;
  category: string;
  online: boolean;
  light: LightState | null;
}

export type LightAction =
  | { type: 'set_power'; on: boolean }
  | { type: 'set_brightness'; value: number }
  | { type: 'set_temperature'; value: number }
  | { type: 'set_colour'; h: number; s: number; v: number };

export interface AppError {
  kind: string;
  message: string;
}

export type Region = 'us' | 'eu' | 'cn' | 'in';
