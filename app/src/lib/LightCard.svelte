<script lang="ts">
  import { onDestroy } from 'svelte';
  import DeviceIcon from './DeviceIcon.svelte';
  import Icon from './Icon.svelte';
  import { bulbColor, effectiveBrightness, glowStrength } from './light';
  import type { DeviceView, LightAction, LightState } from './types';

  let { device, light, onaction }: { device: DeviceView; light: LightState; onaction: (a: LightAction) => void } =
    $props();

  const uid = $props.id();

  /** `open` is the user's intent; `mounted` keeps the panel in the DOM while it folds away. */
  let open = $state(false);
  let mounted = $state(false);
  let unmountTimer: ReturnType<typeof setTimeout> | undefined;
  const FOLD_MS = 260;

  function toggleOpen() {
    clearTimeout(unmountTimer);
    if (open) {
      open = false;
      unmountTimer = setTimeout(() => (mounted = false), FOLD_MS);
    } else {
      mounted = true;
      open = true;
    }
  }
  onDestroy(() => clearTimeout(unmountTimer));

  /** Slider values while the thumb is being dragged; nothing is sent until release. */
  let drafts = $state<Record<string, number>>({});

  const color = $derived(bulbColor(light));
  const glow = $derived(glowStrength(light));
  const brightness = $derived(drafts.brightness ?? effectiveBrightness(light));
  const brightnessPct = $derived(Math.round(((brightness - 10) / 990) * 100));
  const temperature = $derived(drafts.temperature ?? light.temperature);
  const hue = $derived(drafts.hue ?? light.hue);
  const saturation = $derived(drafts.saturation ?? light.saturation);
  const status = $derived(
    light.on ? `${light.mode === 'colour' ? 'Cor' : 'Branco'} · ${Math.round(((effectiveBrightness(light) - 10) / 990) * 100)}%` : 'Desligada'
  );

  const num = (e: Event) => Number((e.currentTarget as HTMLInputElement).value);
  const drag = (key: string) => (e: Event) => {
    drafts[key] = num(e);
  };
  function release(key: string, e: Event, send: (value: number) => void) {
    delete drafts[key];
    send(num(e));
  }

  /** In colour mode brightness is the V of the colour: send the whole colour, never a bare brightness. */
  function setBrightness(value: number) {
    onaction(
      light.mode === 'colour'
        ? { type: 'set_colour', h: light.hue, s: light.saturation, v: value }
        : { type: 'set_brightness', value }
    );
  }

</script>

<article class="card" class:on={light.on} style:--lamp={color}>
  <div class="row">
    <button
      class="toggle"
      aria-label={`${light.on ? 'Desligar' : 'Ligar'} ${device.name}`}
      aria-pressed={light.on}
      onclick={() => onaction({ type: 'set_power', on: !light.on })}
    >
      <DeviceIcon category={device.category} on={light.on} {color} {glow} />
      <span class="name">
        <strong>{device.name}</strong>
        <span class="status">{status}</span>
      </span>
      <span class="switch" aria-hidden="true"><span class="thumb"></span></span>
    </button>
    <button
      class="chevron"
      class:open
      aria-label={`Ajustes de ${device.name}`}
      aria-expanded={open}
      onclick={toggleOpen}
    >
      <Icon name="chevron" size={18} />
    </button>
  </div>

  {#if mounted}
    <div class="panel" class:closing={!open}>
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

        <div class="field">
          <div class="field-head">
            <label for={`${uid}-brightness`}>Brilho</label>
            <output class="num" for={`${uid}-brightness`}>{brightnessPct}%</output>
          </div>
          <input
            id={`${uid}-brightness`}
            class="range fill"
            type="range"
            min="10"
            max="1000"
            value={brightness}
            style:--fill={`${brightnessPct}%`}
            oninput={drag('brightness')}
            onchange={(e) => release('brightness', e, setBrightness)}
          />
        </div>

        {#if light.mode === 'white'}
          <div class="field">
            <div class="field-head"><label for={`${uid}-temperature`}>Temperatura</label></div>
            <input
              id={`${uid}-temperature`}
              class="range temp"
              type="range"
              min="0"
              max="1000"
              value={temperature}
              oninput={drag('temperature')}
              onchange={(e) => release('temperature', e, (value) => onaction({ type: 'set_temperature', value }))}
            />
          </div>
        {:else}
          <div class="field">
            <div class="field-head"><label for={`${uid}-hue`}>Matiz</label></div>
            <input
              id={`${uid}-hue`}
              class="range hue"
              type="range"
              min="0"
              max="360"
              value={hue}
              oninput={drag('hue')}
              onchange={(e) =>
                release('hue', e, (h) => onaction({ type: 'set_colour', h, s: light.saturation, v: light.value }))}
            />
          </div>
          <div class="field">
            <div class="field-head"><label for={`${uid}-saturation`}>Saturação</label></div>
            <input
              id={`${uid}-saturation`}
              class="range sat"
              type="range"
              min="0"
              max="1000"
              value={saturation}
              style:--hue={hue}
              oninput={drag('saturation')}
              onchange={(e) =>
                release('saturation', e, (s) => onaction({ type: 'set_colour', h: light.hue, s, v: light.value }))}
            />
          </div>
        {/if}
      </div>
    </div>
  {/if}
</article>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px;
    transition: border-color 0.3s var(--ease-out);
  }
  .card.on {
    border-color: color-mix(in srgb, var(--lamp) 28%, var(--border));
  }

  .row {
    display: flex;
    align-items: center;
    gap: 4px;
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
    text-align: left;
    cursor: pointer;
    border-radius: var(--radius-sm);
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
    font-weight: 600;
    font-size: 15px;
  }
  .status {
    color: var(--muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .switch {
    flex: none;
    width: 42px;
    height: 24px;
    border-radius: 999px;
    background: var(--track);
    border: 1px solid var(--border);
    position: relative;
    transition: background 0.3s var(--ease-out);
  }
  .thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #aeb4c2;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.5);
    transition:
      transform 0.3s var(--ease-out),
      background 0.3s var(--ease-out);
  }
  .on .switch {
    background: var(--lamp);
    border-color: transparent;
  }
  .on .thumb {
    transform: translateX(18px);
    background: #fff;
  }
  .toggle:active .thumb {
    width: 22px;
  }
  .on .toggle:active .thumb {
    transform: translateX(14px);
  }

  .chevron {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    flex: none;
    background: none;
    border: none;
    border-radius: 50%;
    color: var(--muted);
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;
  }
  .chevron:hover {
    background: var(--surface-hi);
    color: var(--text);
  }
  .chevron :global(svg) {
    transition: transform 0.3s var(--ease-out);
  }
  .chevron.open :global(svg) {
    transform: rotate(180deg);
  }

  /* Height animates through grid rows so the panel can fold without measuring it. */
  .panel {
    display: grid;
    grid-template-rows: 1fr;
    animation: unfold 0.26s var(--ease-out) both;
  }
  .panel.closing {
    grid-template-rows: 0fr;
    animation: fold 0.26s var(--ease-out) both;
  }
  .panel > .controls {
    min-height: 0;
    overflow: hidden;
  }
  @keyframes unfold {
    from {
      grid-template-rows: 0fr;
      opacity: 0;
    }
  }
  @keyframes fold {
    from {
      grid-template-rows: 1fr;
      opacity: 1;
    }
    to {
      grid-template-rows: 0fr;
      opacity: 0;
    }
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px 4px 4px;
    margin-top: 10px;
    border-top: 1px solid var(--border);
  }

  .modes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    padding: 3px;
    border-radius: var(--radius-sm);
    background: var(--bg);
  }
  .modes button {
    padding: 7px;
    border: none;
    border-radius: 9px;
    background: none;
    color: var(--muted);
    cursor: pointer;
    transition:
      background 0.25s var(--ease-out),
      color 0.25s var(--ease-out);
  }
  .modes button.active {
    background: var(--surface-hi);
    color: var(--text);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .field-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .field-head label {
    color: var(--muted);
    font-size: 12px;
  }
  .num {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }

  .range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 12px;
    margin: 0;
    border-radius: 999px;
    cursor: pointer;
    background: var(--track);
  }
  .range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fff;
    border: none;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.55);
    transition: transform 0.2s var(--ease-out);
  }
  .range:active::-webkit-slider-thumb {
    transform: scale(1.12);
  }
  .fill {
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--lamp) 45%, #1a1d26), var(--lamp)) 0 / var(--fill) 100% no-repeat,
      var(--track);
  }
  .temp {
    background: linear-gradient(90deg, #ffb46b, #fff1de 50%, #cfe3ff);
  }
  .hue {
    background: linear-gradient(90deg, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00);
  }
  .sat {
    background: linear-gradient(90deg, #fff, hsl(calc(var(--hue) * 1) 100% 50%));
  }
</style>
