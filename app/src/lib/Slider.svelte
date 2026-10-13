<script lang="ts">
  type Variant = 'main' | 'temp' | 'hue' | 'sat';

  let {
    label,
    min,
    max,
    value,
    variant = 'temp',
    hideLabel = false,
    disabled = false,
    hue = 0,
    oninput,
    onchange
  }: {
    label: string;
    min: number;
    max: number;
    value: number;
    variant?: Variant;
    hideLabel?: boolean;
    disabled?: boolean;
    /** Only the saturation track uses it: the colour it fades towards. */
    hue?: number;
    oninput?: (value: number) => void;
    onchange?: (value: number) => void;
  } = $props();

  const id = $props.id();
  const progress = $derived((value - min) / (max - min));
  const read = (e: Event) => Number((e.currentTarget as HTMLInputElement).value);
</script>

<div class={`slider ${variant}`} class:disabled>
  <label for={id} class:sr={hideLabel}>{label}</label>
  <input
    {id}
    type="range"
    {min}
    {max}
    {value}
    {disabled}
    style:--p={progress}
    style:--hue={hue}
    oninput={(e) => oninput?.(read(e))}
    onchange={(e) => onchange?.(read(e))}
  />
</div>

<style>
  .slider {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  label {
    font-size: 12px;
    color: var(--muted);
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  input {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    margin: 0;
    background: none;
    cursor: pointer;
  }
  input:focus-visible {
    outline: none;
  }
  input:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .disabled {
    opacity: 0.5;
  }
  .disabled input {
    cursor: default;
  }

  /* Main: an inset track with a raised cream pill. The fill always ends at the thumb's centre. The thumb
     is as tall as the track and has the same rounded end, so at 0% and 100% it sits exactly in the
     track's end and hides the fill's edge: no sliver of colour at the start, no dark gap at the end. */
  .main input::-webkit-slider-runnable-track {
    height: 44px;
    border-radius: 22px;
    background:
      linear-gradient(180deg, rgb(var(--light) / 0.62), rgb(var(--light) / 0.4)) 0 0 / calc(26px + (100% - 52px) * var(--p)) 100% no-repeat,
      var(--track);
    box-shadow:
      inset 0 3px 8px rgb(0 0 0 / 0.9),
      inset 0 -1px 0 rgb(255 255 255 / 0.05),
      0 1px 0 rgb(255 255 255 / 0.04);
  }
  .main input::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 52px;
    height: 44px;
    margin-top: 0;
    border: none;
    border-radius: 22px;
    background:
      linear-gradient(90deg, transparent 0 41%, rgb(0 0 0 / 0.22) 41% 44%, transparent 44% 56%, rgb(0 0 0 / 0.22) 56% 59%, transparent 59%),
      linear-gradient(#f1ede6, #cfcac1);
    box-shadow:
      0 2px 6px rgb(0 0 0 / 0.6),
      inset 0 1px 0 #fff,
      inset 0 -2px 0 rgb(0 0 0 / 0.12);
  }

  /* Fine controls: a slim track and a small raised round thumb. */
  .temp input::-webkit-slider-runnable-track,
  .hue input::-webkit-slider-runnable-track,
  .sat input::-webkit-slider-runnable-track {
    height: 14px;
    border-radius: 7px;
    box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.7);
  }
  .temp input::-webkit-slider-runnable-track {
    background: linear-gradient(90deg, #ffb46b, #fff1de 50%, #cfe3ff);
  }
  .hue input::-webkit-slider-runnable-track {
    background: linear-gradient(90deg, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00);
  }
  .sat input::-webkit-slider-runnable-track {
    background: linear-gradient(90deg, #fff, hsl(var(--hue) 100% 55%));
  }
  .temp input::-webkit-slider-thumb,
  .hue input::-webkit-slider-thumb,
  .sat input::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    margin-top: -4px;
    border: none;
    border-radius: 50%;
    background: linear-gradient(#f4f0e9, #cfcac1);
    box-shadow:
      0 2px 4px rgb(0 0 0 / 0.6),
      inset 0 1px 0 #fff;
  }
</style>
