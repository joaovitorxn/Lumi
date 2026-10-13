<script lang="ts">
  import { locale, t } from './i18n.svelte';
  import Icon from './Icon.svelte';
  import type { AppError } from './types';

  let {
    loading,
    error,
    lastSync,
    onrefresh,
    onsettings
  }: {
    loading: boolean;
    error: AppError | null;
    lastSync: number | null;
    onrefresh: () => void;
    onsettings: () => void;
  } = $props();

  const message = $derived(error ? error.message.charAt(0).toUpperCase() + error.message.slice(1) : '');
  const time = $derived(
    lastSync === null ? '' : new Date(lastSync).toLocaleTimeString(locale.tag, { hour: '2-digit', minute: '2-digit' })
  );
</script>

<footer>
  {#if error}
    <span class="status bad" role="alert" title={error.message}><Icon name="alert" size={16} /><span class="msg">{message}</span></span>
  {:else if loading}
    <span class="status" role="status"><span class="spinner"></span>{t('sync.updating')}</span>
  {:else}
    <span class="status" role="status">
      {#if lastSync === null}
        <span class="ico"><Icon name="clock" size={15} /></span>{t('sync.waiting')}
      {:else}
        <span class="ico ok"><Icon name="check" size={15} /></span>{t('sync.syncedAt', { time })}
      {/if}
    </span>
  {/if}
  <span class="tools">
    {#if error}
      <button class="retry" onclick={onrefresh}>{t('sync.retry')}</button>
    {:else}
      <button aria-label={t('sync.refresh')} disabled={loading} onclick={onrefresh}><Icon name="refresh" size={17} /></button>
    {/if}
    <button aria-label={t('sync.settings')} onclick={onsettings}><Icon name="settings" size={17} /></button>
  </span>
</footer>

<style>
  footer {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px 12px 18px;
    font-size: 12px;
    color: var(--muted);
  }
  .status {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }
  .bad {
    color: var(--danger);
  }
  .msg {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    line-height: 1.3;
  }
  .ico {
    display: flex;
    flex: none;
  }
  .ico.ok {
    color: var(--ok);
  }
  .spinner {
    width: 12px;
    height: 12px;
    flex: none;
    border-radius: 50%;
    border: 2px solid #55555b;
    border-top-color: var(--text);
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .tools {
    display: flex;
    flex: none;
  }
  button {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: none;
    color: var(--muted);
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;
  }
  .retry {
    width: auto;
    padding: 0 12px;
    border-radius: 16px;
    border: 1px solid var(--border-strong);
    color: var(--text);
    font-size: 12px;
  }
  button:hover:not(:disabled) {
    background: var(--surface-hi);
    color: var(--text);
  }
  button:disabled {
    cursor: default;
    opacity: 0.5;
  }
</style>
