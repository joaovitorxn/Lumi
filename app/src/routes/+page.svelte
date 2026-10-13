<script lang="ts">
  import { onMount } from 'svelte';
  import { onDevicesError, onDevicesUpdated, onOpenSettings, onPopupShown, tauriApi } from '$lib/api';
  import { DeviceStore } from '$lib/devices.svelte';
  import Icon from '$lib/Icon.svelte';
  import InactiveCard from '$lib/InactiveCard.svelte';
  import LightCard from '$lib/LightCard.svelte';
  import Settings from '$lib/Settings.svelte';

  const store = new DeviceStore(tauriApi);

  onMount(() => {
    store.start();
    const unlisten = Promise.all([
      onPopupShown(() => store.refresh()),
      onDevicesUpdated((d) => store.receive(d)),
      onDevicesError((e) => store.fail(e)),
      onOpenSettings(() => store.openSettings())
    ]);
    return () => {
      unlisten.then((fns) => fns.forEach((fn) => fn()));
    };
  });
</script>

<main>
  {#if store.screen === 'settings'}
    <Settings
      onsave={(id, secret, region) => store.saveCredentials(id, secret, region)}
      oncancel={store.configured ? () => store.closeSettings() : undefined}
    />
  {:else}
    <header>
      <div class="title">
        <h1>Dispositivos</h1>
        <span class="state" class:bad={!!store.error}>
          <span class="led"></span>{store.error ? 'Sem conexão' : 'Conectado'}
        </span>
      </div>
      <div class="tools">
        <button class="icon-btn" aria-label="Atualizar" onclick={() => store.refresh()} disabled={store.loading}>
          <span class:spin={store.loading}><Icon name="refresh" size={18} /></span>
        </button>
        <button class="icon-btn" aria-label="Configurações" onclick={() => store.openSettings()}>
          <Icon name="settings" size={18} />
        </button>
      </div>
    </header>

    {#if store.error}
      <div class="banner" role="alert">
        <Icon name="alert" size={18} />
        <span>{store.error.message}</span>
        {#if store.error.kind === 'auth'}
          <button onclick={() => store.openSettings()}>Configurações</button>
        {/if}
      </div>
    {/if}

    <section>
      {#each store.devices as device, i (device.id)}
        <div class="item" style:--i={i}>
          {#if device.light}
            <LightCard {device} light={device.light} onaction={(a) => store.sendLight(device.id, a)} />
          {:else}
            <InactiveCard {device} />
          {/if}
        </div>
      {:else}
        {#if store.loading}
          <div class="skeleton"></div>
          <div class="skeleton short"></div>
        {:else if !store.error}
          <p class="empty">Nenhum dispositivo encontrado.</p>
        {/if}
      {/each}
    </section>
  {/if}
</main>

<style>
  main {
    height: 100vh;
    padding: 16px 14px;
    overflow-y: auto;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .state {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--muted);
  }
  .led {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ok);
    transition: background 0.3s;
  }
  .bad .led {
    background: var(--danger);
  }
  .tools {
    display: flex;
    gap: 2px;
  }
  .icon-btn {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 50%;
    background: none;
    color: var(--muted);
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;
  }
  .icon-btn:hover:not(:disabled) {
    background: var(--surface-hi);
    color: var(--text);
  }
  .icon-btn:disabled {
    cursor: default;
  }
  .spin {
    display: grid;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .item {
    animation: rise 0.45s var(--ease-out) both;
    animation-delay: calc(var(--i) * 50ms);
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }

  .banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    margin-bottom: 12px;
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--danger) 12%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
    color: var(--danger);
    font-size: 13px;
    animation: drop 0.35s var(--ease-out) both;
  }
  .banner span {
    flex: 1;
    min-width: 0;
  }
  .banner button {
    padding: 4px 10px;
    border: 1px solid var(--danger);
    border-radius: 8px;
    background: none;
    color: var(--danger);
    cursor: pointer;
  }
  @keyframes drop {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
  }

  .skeleton {
    height: 72px;
    border-radius: var(--radius);
    background: linear-gradient(90deg, var(--surface) 30%, var(--surface-hi) 50%, var(--surface) 70%) 0 0 / 300% 100%;
    animation: shimmer 1.4s linear infinite;
  }
  .skeleton.short {
    height: 56px;
    opacity: 0.6;
  }
  @keyframes shimmer {
    to {
      background-position: -300% 0;
    }
  }

  .empty {
    margin: 32px 0;
    color: var(--muted);
    text-align: center;
  }
</style>
