<script lang="ts">
  import { bulbColor, effectiveBrightness, glowStrength } from './light';
  import type { DeviceView, LightAction, LightState } from './types';

  let { device, light, onaction }: { device: DeviceView; light: LightState; onaction: (a: LightAction) => void } =
    $props();

  let expanded = $state(false);

  const color = $derived(bulbColor(light));
  const glow = $derived(glowStrength(light));

  const num = (e: Event) => Number((e.currentTarget as HTMLInputElement).value);

  /** In colour mode brightness is the V of the colour: send the whole colour, never a bare brightness. */
  function setBrightness(value: number) {
    onaction(
      light.mode === 'colour'
        ? { type: 'set_colour', h: light.hue, s: light.saturation, v: value }
        : { type: 'set_brightness', value }
    );
  }
</script>

<article class="card" class:on={light.on}>
  <div class="row">
    <button
      class="toggle"
      aria-label={`${light.on ? 'Desligar' : 'Ligar'} ${device.name}`}
      aria-pressed={light.on}
      onclick={() => onaction({ type: 'set_power', on: !light.on })}
    >
      <span
        class="bulb"
        style:background={color}
        style:box-shadow={light.on ? `0 0 ${8 + 28 * glow}px ${color}` : 'none'}
      ></span>
      <span class="name">
        <strong>{device.name}</strong>
        <span>{light.on ? (light.mode === 'colour' ? 'Cor' : 'Branco') : 'Desligada'}</span>
      </span>
    </button>
    <button class="chevron" aria-label={`Ajustes de ${device.name}`} aria-expanded={expanded} onclick={() => (expanded = !expanded)}>
      {expanded ? '▴' : '▾'}
    </button>
  </div>

  {#if expanded}
    <div class="controls">
      <div class="modes" role="group" aria-label="Modo">
        <button
          class:active={light.mode === 'white'}
          onclick={() => onaction({ type: 'set_temperature', value: light.temperature })}>Branco</button
        >
        <button
          class:active={light.mode === 'colour'}
          onclick={() => onaction({ type: 'set_colour', h: light.hue, s: light.saturation, v: light.value })}>Cor</button
        >
      </div>

      <label>
        Brilho
        <input
          type="range"
          min="10"
          max="1000"
          value={effectiveBrightness(light)}
          onchange={(e) => setBrightness(num(e))}
        />
      </label>

      {#if light.mode === 'white'}
        <label>
          Temperatura
          <input
            class="temp"
            type="range"
            min="0"
            max="1000"
            value={light.temperature}
            onchange={(e) => onaction({ type: 'set_temperature', value: num(e) })}
          />
        </label>
      {:else}
        <label>
          Matiz
          <input
            class="hue"
            type="range"
            min="0"
            max="360"
            value={light.hue}
            onchange={(e) => onaction({ type: 'set_colour', h: num(e), s: light.saturation, v: light.value })}
          />
        </label>
        <label>
          Saturação
          <input
            type="range"
            min="0"
            max="1000"
            value={light.saturation}
            onchange={(e) => onaction({ type: 'set_colour', h: light.hue, s: num(e), v: light.value })}
          />
        </label>
      {/if}
    </div>
  {/if}
</article>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px 12px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    padding: 0;
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .bulb {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid rgb(255 255 255 / 0.15);
    flex: none;
    transition: box-shadow 0.2s, background 0.2s;
  }
  .name {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .name strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .name span {
    font-size: 12px;
    color: var(--muted);
  }
  .chevron {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 16px;
    padding: 4px 8px;
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--muted);
  }
  input[type='range'] {
    width: 100%;
  }
  .temp {
    accent-color: #ffb46b;
  }
  .hue {
    accent-color: #8b5cf6;
  }
  .modes {
    display: flex;
    gap: 6px;
  }
  .modes button {
    flex: 1;
    padding: 6px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    cursor: pointer;
  }
  .modes button.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
</style>
