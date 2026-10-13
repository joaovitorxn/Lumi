<script lang="ts">
  import { onMount } from 'svelte';
  import { onDevicesError, onDevicesUpdated, onOpenSettings, onPopupShown, tauriApi } from '$lib/api';
  import { DeviceStore } from '$lib/devices.svelte';
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
      oncancel={store.devices.length > 0 ? () => store.closeSettings() : undefined}
    />
  {:else}
    <header>
      <h1>Dispositivos</h1>
      <button class="refresh" aria-label="Atualizar" onclick={() => store.refresh()} disabled={store.loading}>↻</button>
    </header>

    {#if store.error}
      <div class="banner" role="alert">
        <span>{store.error.message}</span>
        {#if store.error.kind === 'auth'}
          <button onclick={() => store.openSettings()}>Configurações</button>
        {/if}
      </div>
    {/if}

    <section>
      {#each store.devices as device (device.id)}
        {#if device.light}
          <LightCard {device} light={device.light} onaction={(a) => store.sendLight(device.id, a)} />
        {:else}
          <InactiveCard {device} />
        {/if}
      {:else}
        {#if !store.loading && !store.error}<p class="empty">Nenhum dispositivo encontrado.</p>{/if}
      {/each}
    </section>
  {/if}
</main>

<style>
  :global(:root) {
    --bg: #14161c;
    --surface: #1e2129;
    --border: #2d313c;
    --text: #e8eaf0;
    --muted: #8b91a1;
    --accent: #4f6bed;
    --danger: #ff6b6b;
  }
  :global(html, body) {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 14px;
    overflow: hidden;
  }
  main {
    height: 100vh;
    box-sizing: border-box;
    padding: 14px;
    overflow-y: auto;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  h1 {
    margin: 0;
    font-size: 16px;
  }
  .refresh {
    background: none;
    border: none;
    color: var(--muted);
    font-size: 18px;
    cursor: pointer;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    margin-bottom: 10px;
    border-radius: 8px;
    background: rgb(255 107 107 / 0.12);
    color: var(--danger);
    font-size: 13px;
  }
  .banner button {
    background: none;
    border: 1px solid var(--danger);
    color: var(--danger);
    border-radius: 6px;
    cursor: pointer;
  }
  .empty {
    color: var(--muted);
    text-align: center;
  }
</style>
