<script lang="ts">
  import { t } from './i18n.svelte';
  import Icon from './Icon.svelte';

  let {
    name,
    on,
    disabled = false,
    onclick
  }: { name: string; on: boolean; disabled?: boolean; onclick: () => void } = $props();
</script>

<button
  class="power"
  class:on
  aria-label={t(on ? 'power.off' : 'power.on', { name })}
  aria-pressed={on}
  {disabled}
  {onclick}
>
  <Icon name="power" size={18} />
</button>

<style>
  .power {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    flex: none;
    border-radius: 50%;
    background: linear-gradient(var(--raise-top), var(--raise-bot));
    border: 1px solid var(--border-strong);
    color: var(--muted);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.06),
      0 2px 6px rgb(0 0 0 / 0.5);
    cursor: pointer;
    transition:
      transform 0.15s var(--ease-out),
      background 0.35s var(--ease-out),
      color 0.35s var(--ease-out),
      filter 0.2s var(--ease-out);
  }
  .power:hover:not(:disabled) {
    filter: brightness(1.12);
  }
  .power:active:not(:disabled) {
    transform: scale(0.94);
  }
  .power:not(.on) {
    color: #1d1a15;
    background: linear-gradient(#f1ede6, #cfcac1);
    border-color: transparent;
    box-shadow:
      inset 0 1px 0 #fff,
      0 2px 6px rgb(0 0 0 / 0.6);
  }
  .power.on {
    color: #1a1208;
    background: linear-gradient(rgb(var(--light)), rgb(var(--light) / 0.78));
    border-color: transparent;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.45),
      0 2px 8px rgb(0 0 0 / 0.5);
  }
  .power:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
