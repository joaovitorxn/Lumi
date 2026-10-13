<script lang="ts">
  import { LOCALES, locale, t } from './i18n.svelte';
  import Icon from './Icon.svelte';

  let {
    autostart,
    onback,
    oncredentials,
    onautostart
  }: {
    autostart: boolean;
    onback: () => void;
    oncredentials: () => void;
    onautostart: (on: boolean) => void;
  } = $props();
</script>

<div class="menu">
  <header>
    <button class="back" aria-label={t('settings.back')} onclick={onback}><Icon name="back" size={18} /></button>
    <h2>{t('settings.title')}</h2>
  </header>

  <button class="row link" onclick={oncredentials}>
    <span class="ic"><Icon name="key" size={18} /></span>
    <span class="text">
      <b>{t('settings.credentials')}</b>
      <small>{t('settings.credentialsHint')}</small>
    </span>
    <span class="chev"><Icon name="chevron" size={18} /></span>
  </button>

  <div class="row stacked">
    <div class="head">
      <span class="ic"><Icon name="globe" size={18} /></span>
      <b>{t('settings.language')}</b>
    </div>
    <div class="seg" role="radiogroup" aria-label={t('settings.language')}>
      {#each LOCALES as option (option.id)}
        <button
          role="radio"
          aria-checked={locale.current === option.id}
          class:sel={locale.current === option.id}
          onclick={() => locale.set(option.id)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="row">
    <span class="ic"><Icon name="login" size={18} /></span>
    <span class="text">
      <b>{t('settings.startup')}</b>
      <small>{t('settings.startupHint')}</small>
    </span>
    <button
      class="switch"
      role="switch"
      aria-checked={autostart}
      aria-label={t('settings.startup')}
      class:on={autostart}
      onclick={() => onautostart(!autostart)}
    >
      <i></i>
    </button>
  </div>
</div>

<style>
  .menu {
    display: flex;
    flex-direction: column;
    gap: 12px;
    animation: rise 0.4s var(--ease-out) both;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  h2 {
    margin: 0;
    font-family: var(--font-num);
    font-size: 26px;
    font-weight: 300;
    letter-spacing: -0.5px;
  }
  button {
    font: inherit;
    cursor: pointer;
  }
  .back {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex: none;
    border-radius: 50%;
    color: var(--muted);
    background: linear-gradient(var(--raise-top), var(--raise-bot));
    border: 1px solid var(--border-strong);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.08),
      0 2px 4px rgb(0 0 0 / 0.5);
    transition:
      transform 0.15s var(--ease-out),
      color 0.2s var(--ease-out),
      border-color 0.2s var(--ease-out);
  }
  .back:hover {
    color: var(--text);
    border-color: #3d3d44;
  }
  .back:active {
    transform: scale(0.92);
  }

  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px;
    text-align: left;
    border-radius: 16px;
    background: linear-gradient(#1b1b1f, #151518);
    border: 1px solid var(--border);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.07),
      0 2px 4px rgb(0 0 0 / 0.5);
  }
  .stacked {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .link {
    transition:
      transform 0.15s var(--ease-out),
      border-color 0.2s var(--ease-out),
      background 0.2s var(--ease-out);
  }
  .link:hover {
    border-color: var(--border-strong);
    background: linear-gradient(#202024, #18181b);
  }
  .link:hover .chev {
    color: var(--text);
  }
  .link:active {
    transform: scale(0.98);
  }
  .ic {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    flex: none;
    border-radius: 50%;
    color: var(--muted);
    background: var(--track);
    box-shadow: inset 0 2px 5px rgb(0 0 0 / 0.8);
  }
  .text {
    flex: 1;
    min-width: 0;
  }
  b {
    display: block;
    font-weight: 600;
    font-size: 14px;
    color: var(--text);
  }
  small {
    display: block;
    font-size: 12px;
    line-height: 1.4;
    color: var(--muted);
  }
  .chev {
    display: flex;
    color: var(--muted);
  }

  .seg {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 4px;
    border-radius: 22px;
    background: var(--track);
    box-shadow: inset 0 3px 8px rgb(0 0 0 / 0.9);
  }
  .seg button {
    height: 36px;
    border: none;
    border-radius: 18px;
    background: none;
    color: var(--muted);
    font-size: 13px;
    transition:
      background 0.25s var(--ease-out),
      color 0.25s var(--ease-out);
  }
  .seg button:hover:not(.sel) {
    color: var(--text);
    background: rgb(255 255 255 / 0.05);
  }
  .seg button.sel {
    color: #1d1a15;
    font-weight: 600;
    background: linear-gradient(#f1ede6, #cfcac1);
    box-shadow:
      inset 0 1px 0 #fff,
      0 2px 4px rgb(0 0 0 / 0.6);
  }

  .switch {
    position: relative;
    width: 52px;
    height: 30px;
    flex: none;
    padding: 0;
    border: none;
    border-radius: 15px;
    background: var(--track);
    box-shadow: inset 0 3px 8px rgb(0 0 0 / 0.9);
    transition: background 0.3s var(--ease-out);
  }
  .switch i {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(#f1ede6, #cfcac1);
    box-shadow:
      inset 0 1px 0 #fff,
      0 2px 4px rgb(0 0 0 / 0.6);
    transition: transform 0.3s var(--ease-out);
  }
  .switch:hover:not(.on) {
    background: #131316;
  }
  .switch:hover i {
    filter: brightness(1.08);
  }
  .switch.on {
    background: var(--ok);
  }
  .switch.on:hover {
    background: color-mix(in srgb, var(--ok) 88%, white);
  }
  .switch.on i {
    transform: translateX(22px);
  }
</style>
