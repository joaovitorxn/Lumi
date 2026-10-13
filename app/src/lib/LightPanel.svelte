<script lang="ts">
  import DeviceHero from './DeviceHero.svelte';
  import Icon from './Icon.svelte';
  import {
    brightnessPct,
    effectiveBrightness,
    hueName,
    kelvin,
    lampLight,
    stepBrightness,
    warmthName
  } from './light';
  import Slider from './Slider.svelte';
  import type { DeviceView, LightAction, LightState } from './types';

  let {
    device,
    light,
    onaction,
    stale = false
  }: { device: DeviceView; light: LightState; onaction: (a: LightAction) => void; stale?: boolean } = $props();

  /** Slider values while the thumb is being dragged; nothing is sent until release. */
  let drafts = $state<Record<string, number>>({});

  const look = $derived(lampLight(light));
  const current = $derived(effectiveBrightness(light));
  const shown = $derived(drafts.brightness ?? current);
  const white = $derived(light.mode === 'white');
  const caption = $derived(
    !light.on ? 'Toque no botão para ligar' : white ? `Branco ${warmthName(light.temperature).toLowerCase()}` : hueName(light.hue)
  );

  /** In colour mode brightness is the V of the colour: send the whole colour, never a bare brightness. */
  function setBrightness(value: number) {
    onaction(
      white
        ? { type: 'set_brightness', value }
        : { type: 'set_colour', h: light.hue, s: light.saturation, v: value }
    );
  }

  const drag = (key: string) => (value: number) => {
    drafts[key] = value;
  };
  function release(key: string, value: number, send: (value: number) => void) {
    delete drafts[key];
    send(value);
  }
  const colour = (h: number, s: number) => onaction({ type: 'set_colour', h, s, v: light.value });
</script>

<section class="panel" class:off={!light.on} data-stale={stale ? 'true' : undefined} aria-label={device.name}>
  <div class="hero">
    <DeviceHero category="dj" on={light.on} {look} />
  </div>

  <div class="readout">
    <div class="num">{brightnessPct(shown)}<sup>%</sup></div>
    <div class="what">
      <b>{light.on ? 'Brilho' : 'Desligada'}</b>
      <span>{caption}</span>
    </div>
  </div>

  <div class="main">
    <button class="step" aria-label="Diminuir brilho" disabled={!light.on} onclick={() => setBrightness(stepBrightness(current, -1))}>
      <Icon name="minus" size={18} />
    </button>
    <Slider
      label="Brilho"
      hideLabel
      variant="main"
      min={10}
      max={1000}
      value={shown}
      disabled={!light.on}
      oninput={drag('brightness')}
      onchange={(v) => release('brightness', v, setBrightness)}
    />
    <button class="step" aria-label="Aumentar brilho" disabled={!light.on} onclick={() => setBrightness(stepBrightness(current, 1))}>
      <Icon name="plus" size={18} />
    </button>
  </div>

  <div class="tiles">
    <button
      class="tile"
      class:sel={white}
      aria-pressed={white}
      disabled={!light.on}
      onclick={() => onaction({ type: 'set_temperature', value: light.temperature })}
    >
      <span class="head"><span class="ic"><Icon name="sun" size={18} /></span><small>Branco</small></span>
      <b>{kelvin(light.temperature).toLocaleString('pt-BR')} K · {warmthName(light.temperature)}</b>
    </button>
    <button
      class="tile"
      class:sel={!white}
      aria-pressed={!white}
      disabled={!light.on}
      onclick={() => onaction({ type: 'set_colour', h: light.hue, s: light.saturation, v: light.value })}
    >
      <span class="head"><span class="ic"><span class="swatch"></span></span><small>Cor</small></span>
      <b>{white ? 'Toque para escolher' : `${hueName(light.hue)} · ${Math.round(light.saturation / 10)}%`}</b>
    </button>
  </div>

  <div class="fine">
    {#if white}
      <Slider
        label="Temperatura"
        variant="temp"
        min={0}
        max={1000}
        value={drafts.temperature ?? light.temperature}
        disabled={!light.on}
        oninput={drag('temperature')}
        onchange={(v) => release('temperature', v, (value) => onaction({ type: 'set_temperature', value }))}
      />
    {:else}
      <Slider
        label="Matiz"
        variant="hue"
        min={0}
        max={360}
        value={drafts.hue ?? light.hue}
        disabled={!light.on}
        oninput={drag('hue')}
        onchange={(v) => release('hue', v, (h) => colour(h, light.saturation))}
      />
      <Slider
        label="Saturação"
        variant="sat"
        min={0}
        max={1000}
        value={drafts.saturation ?? light.saturation}
        hue={drafts.hue ?? light.hue}
        disabled={!light.on}
        oninput={drag('saturation')}
        onchange={(v) => release('saturation', v, (s) => colour(light.hue, s))}
      />
    {/if}
  </div>
</section>

<style>
  .panel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0 16px;
  }
  .hero {
    flex: 1 1 auto;
    min-height: 88px;
    padding-top: 6px;
  }

  .readout {
    flex: none;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 0 6px;
  }
  .num {
    font-family: var(--font-num);
    font-weight: 300;
    font-size: 78px;
    line-height: 0.95;
    letter-spacing: -2px;
    font-variant-numeric: tabular-nums;
    transition: color 0.4s var(--ease-out);
  }
  .num sup {
    position: relative;
    top: 12px;
    margin-left: 3px;
    font-size: 26px;
    letter-spacing: 0;
    color: var(--muted);
    vertical-align: top;
  }
  .off .num {
    color: #74726e;
  }
  .what {
    text-align: right;
    font-size: 12px;
    line-height: 1.5;
    color: var(--muted);
  }
  .what b {
    display: block;
    color: var(--text);
    font-size: 13.5px;
    font-weight: 600;
  }

  .main {
    flex: none;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
  }
  .main :global(.slider) {
    flex: 1;
    min-width: 0;
  }
  .step {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex: none;
    border-radius: 50%;
    background: linear-gradient(var(--raise-top), var(--raise-bot));
    border: 1px solid var(--border-strong);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.08),
      0 2px 4px rgb(0 0 0 / 0.5);
    color: var(--muted);
    cursor: pointer;
    transition: transform 0.15s var(--ease-out);
  }
  .step:active:not(:disabled) {
    transform: scale(0.92);
  }
  .step:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .tiles {
    flex: none;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 12px;
  }
  .tile {
    height: 68px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: left;
    border-radius: 16px;
    background: linear-gradient(#1b1b1f, #151518);
    border: 1px solid var(--border);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.07),
      0 2px 4px rgb(0 0 0 / 0.5);
    cursor: pointer;
    transition:
      border-color 0.25s var(--ease-out),
      background 0.25s var(--ease-out),
      transform 0.15s var(--ease-out);
  }
  .tile:active:not(:disabled) {
    transform: scale(0.98);
  }
  /* The selected tile is lit from its top edge by the lamp's own light. */
  .tile.sel {
    border-color: #3a3a40;
    background: linear-gradient(#202025, #18181b);
    box-shadow:
      inset 0 2px 0 rgb(var(--light) / 0.9),
      inset 0 1px 0 rgb(255 255 255 / 0.06),
      0 2px 4px rgb(0 0 0 / 0.5);
  }
  .tile.sel b {
    color: var(--text);
  }
  .tile:disabled {
    opacity: 0.55;
    cursor: default;
  }
  /* Icon and label share one row, so icon + label + value fit the tile without spilling. */
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
  }
  .head small {
    font-size: 12px;
    line-height: 1.2;
  }
  .ic {
    display: flex;
  }
  .tile b {
    display: block;
    color: var(--muted);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .swatch {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: conic-gradient(#f66, #fc4, #6d6, #4cf, #86f, #f6c, #f66);
    box-shadow: inset 0 0 0 2px #17171a;
  }

  /* Same height in both modes (colour has two rows) so the bulb and numeral never jump. */
  .fine {
    flex: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    height: 84px;
    margin-top: 12px;
  }
  .panel[data-stale] .num,
  .panel[data-stale] .what {
    opacity: 0.5;
  }
</style>
