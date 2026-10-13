<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n.svelte';
  import { onDevicesError, onDevicesUpdated, onOpenSettings, onPopupShown, tauriApi } from '$lib/api';
  import { DeviceStore } from '$lib/devices.svelte';
  import DeviceSwitcher from '$lib/DeviceSwitcher.svelte';
  import InactivePanel from '$lib/InactivePanel.svelte';
  import { lampLight } from '$lib/light';
  import { tweenedLook } from '$lib/lookTween.svelte';
  import LightPanel from '$lib/LightPanel.svelte';
  import PowerButton from '$lib/PowerButton.svelte';
  import Settings from '$lib/Settings.svelte';
  import SettingsMenu from '$lib/SettingsMenu.svelte';
  import SyncFooter from '$lib/SyncFooter.svelte';

  const store = new DeviceStore(tauriApi);

  let selectedId = $state('');
  const selected = $derived(store.devices.find((d) => d.id === selectedId) ?? store.devices[0]);
  /** The focused lamp's light tints the whole window, so the colour on screen is always the real one. */
  const target = $derived(selected?.light ? lampLight(selected.light) : undefined);
  const look = tweenedLook(() => target, lampLight({ on: false } as never));

  // The tray menu is native, so it has to be told when the language changes.
  $effect(() => {
    tauriApi.setTrayLabels(t('tray.settings'), t('tray.quit')).catch(() => {});
  });

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

<main style:--light={look.current.rgb}>
  {#if store.screen === 'credentials'}
    <div class="pad">
      <Settings
        onsave={(id, secret, region) => store.saveCredentials(id, secret, region)}
        oncancel={store.configured ? () => store.closeCredentials() : undefined}
      />
    </div>
  {:else if store.screen === 'settings'}
    <div class="pad">
      <SettingsMenu
        autostart={store.autostart}
        onback={() => store.closeSettings()}
        oncredentials={() => store.openCredentials()}
        onautostart={(on) => store.setAutostart(on)}
      />
    </div>
  {:else}
    <header>
      <DeviceSwitcher devices={store.devices} selectedId={selected?.id ?? ''} onselect={(id) => (selectedId = id)} />
      {#if selected?.light}
        {@const light = selected.light}
        <PowerButton
          name={selected.name}
          on={light.on}
          onclick={() => store.sendLight(selected.id, { type: 'set_power', on: !light.on })}
        />
      {/if}
    </header>

    {#if selected}
      {#key selected.id}
        <div class="stage">
          {#if selected.light}
            <LightPanel device={selected} light={selected.light} stale={!!store.error} onaction={(a) => store.sendLight(selected.id, a)} />
          {:else}
            <InactivePanel device={selected} />
          {/if}
        </div>
      {/key}
    {:else if store.loading}
      <div class="stage"><div class="skeleton"></div></div>
    {:else}
      <div class="stage">{#if !store.error}<p class="empty">{t('app.noDevices')}</p>{/if}</div>
    {/if}

    <SyncFooter
      loading={store.loading}
      error={store.error}
      lastSync={store.lastSync}
      onrefresh={() => store.refresh()}
      onsettings={() => store.openSettings()}
    />
  {/if}
</main>

<style>
  main {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
    border-radius: var(--radius-window);
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.07);
  }
  /* Ambient wash: the lamp's light falling on the top of the window. */
  main::before {
    content: '';
    position: absolute;
    inset: 0 0 40% 0;
    background: radial-gradient(ellipse 70% 70% at 50% 18%, rgb(var(--light) / 0.16), transparent 70%);
    pointer-events: none;
  }

  header {
    position: relative;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 16px 16px 0;
  }
  header :global(nav) {
    flex: 1;
  }

  .stage {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    animation: enter 0.45s var(--ease-out) both;
  }
  @keyframes enter {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }

  .pad {
    position: relative;
    flex: 1;
    min-height: 0;
    padding: 22px 16px 18px;
    overflow-y: auto;
  }

  .skeleton {
    margin: 24px 16px;
    flex: 1;
    border-radius: var(--radius);
    background: linear-gradient(90deg, var(--surface) 30%, var(--surface-hi) 50%, var(--surface) 70%) 0 0 / 300% 100%;
    animation: shimmer 1.4s linear infinite;
  }
  @keyframes shimmer {
    to {
      background-position: -300% 0;
    }
  }

  .empty {
    margin: auto;
    color: var(--muted);
    text-align: center;
  }
</style>
