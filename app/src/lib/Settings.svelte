<script lang="ts">
  import { toAppError } from './api';
  import { t } from './i18n.svelte';
  import Icon from './Icon.svelte';
  import type { Region } from './types';

  let {
    onsave,
    oncancel
  }: {
    onsave: (accessId: string, accessSecret: string, region: Region) => Promise<void>;
    oncancel?: () => void;
  } = $props();

  let accessId = $state('');
  let accessSecret = $state('');
  let region = $state<Region>('us');
  let message = $state('');
  let saving = $state(false);

  async function submit(e: Event) {
    e.preventDefault();
    if (!accessId.trim() || !accessSecret.trim()) {
      message = t('cred.fill');
      return;
    }
    saving = true;
    message = '';
    try {
      await onsave(accessId, accessSecret, region);
    } catch (err) {
      message = toAppError(err).message;
    } finally {
      saving = false;
    }
  }
</script>

<form onsubmit={submit}>
  <header>
    <span class="badge"><Icon name="key" size={20} /></span>
    <div>
      <h2>{t('cred.title')}</h2>
      <p class="hint">{t('cred.hint')}</p>
    </div>
  </header>

  <div class="fields">
    <label>
      {t('cred.accessId')}
      <input bind:value={accessId} autocomplete="off" spellcheck="false" />
    </label>
    <label>
      {t('cred.accessSecret')}
      <input type="password" bind:value={accessSecret} autocomplete="off" />
    </label>
    <label class="pick">
      {t('cred.region')}
      <select bind:value={region}>
        <option value="us">Western America (us)</option>
        <option value="eu">Central Europe (eu)</option>
        <option value="cn">China (cn)</option>
        <option value="in">India (in)</option>
      </select>
    </label>
  </div>

  {#if message}<p class="error" role="alert"><Icon name="alert" size={16} />{message}</p>{/if}

  <div class="actions">
    {#if oncancel}<button type="button" class="ghost" onclick={oncancel}>{t('cred.cancel')}</button>{/if}
    <button type="submit" class="primary" disabled={saving}>{saving ? t('cred.saving') : t('cred.save')}</button>
  </div>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 22px;
    min-height: 100%;
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
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 6px 6px 0;
  }
  .badge {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    color: #1d1a15;
    background: linear-gradient(#f1ede6, #cfcac1);
    box-shadow:
      inset 0 1px 0 #fff,
      0 2px 6px rgb(0 0 0 / 0.6);
  }
  h2 {
    margin: 0 0 6px;
    font-family: var(--font-num);
    font-size: 26px;
    font-weight: 300;
    letter-spacing: -0.5px;
    line-height: 1.1;
  }
  .hint {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--muted);
  }
  .fields {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding-left: 6px;
    font-size: 12px;
    color: var(--muted);
  }
  /* Inset like the main slider's track, so fields read as sunk into the panel. */
  input,
  select {
    height: 44px;
    padding: 0 18px;
    border-radius: 22px;
    border: none;
    background: var(--track);
    color: var(--text);
    font: inherit;
    font-size: 14px;
    box-shadow:
      inset 0 3px 8px rgb(0 0 0 / 0.9),
      inset 0 -1px 0 rgb(255 255 255 / 0.05),
      0 1px 0 rgb(255 255 255 / 0.04);
    transition: box-shadow 0.25s var(--ease-out);
  }
  select {
    appearance: none;
    padding-right: 44px;
    cursor: pointer;
    background:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238c8a86' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")
        right 16px center / 16px no-repeat,
      var(--track);
  }
  select option {
    background: var(--surface);
    color: var(--text);
  }
  input:focus-visible,
  select:focus-visible {
    outline: none;
    box-shadow:
      inset 0 3px 8px rgb(0 0 0 / 0.9),
      0 0 0 2px var(--accent);
  }
  .error {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding: 0 6px;
    color: var(--danger);
    font-size: 13px;
  }
  .actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: auto;
  }
  .actions button {
    height: 44px;
    padding: 0 24px;
    border-radius: 22px;
    border: 1px solid transparent;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s var(--ease-out);
  }
  .actions button:active:not(:disabled) {
    transform: scale(0.96);
  }
  .primary {
    flex: 1;
    color: #1d1a15;
    background: linear-gradient(#f1ede6, #cfcac1);
    box-shadow:
      inset 0 1px 0 #fff,
      inset 0 -2px 0 rgb(0 0 0 / 0.12),
      0 2px 6px rgb(0 0 0 / 0.6);
  }
  .ghost {
    color: var(--muted);
    background: linear-gradient(var(--raise-top), var(--raise-bot));
    border-color: var(--border-strong);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.08),
      0 2px 4px rgb(0 0 0 / 0.5);
  }
  .ghost:hover {
    color: var(--text);
  }
  button:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>
