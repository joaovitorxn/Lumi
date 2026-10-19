<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n.svelte';
  import { onDevicesError, onDevicesUpdated, onOpenSettings, onPopupShown, tauriApi } from '$lib/api';
  import { DeviceStore } from '$lib/devices.svelte';
  import type { DeviceView } from '$lib/types';
  import CameraPanel from '$lib/CameraPanel.svelte';
  import DeviceSwitcher from '$lib/DeviceSwitcher.svelte';
  import InactivePanel from '$lib/InactivePanel.svelte';
  import { firstDevice } from '$lib/kinds';
  import { lampLight } from '$lib/light';
  import { tweenedLook } from '$lib/lookTween.svelte';
  import LightPanel from '$lib/LightPanel.svelte';
  import PowerButton from '$lib/PowerButton.svelte';
  import Settings from '$lib/Settings.svelte';
  import SettingsMenu from '$lib/SettingsMenu.svelte';
  import SyncFooter from '$lib/SyncFooter.svelte';

  const store = new DeviceStore(tauriApi);

  let selectedId = $state('');
  const selected = $derived(store.devices.find((d) => d.id === selectedId) ?? firstDevice(store.devices));
  /** The focused lamp's light tints the whole window, so the colour on screen is always the real one. */
  /** The power button stays rendered while it slides away, so it does not vanish before the dropdown has grown. */
  let lastLamp = $state<DeviceView>();
  $effect(() => {
    if (selected?.light) lastLamp = selected;
  });
  const powerDevice = $derived(selected?.light ? selected : lastLamp);
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
      <div class="power-slot" class:open={!!selected?.light} inert={!selected?.light}>
        {#if powerDevice?.light}
          {@const lamp = powerDevice}
          {@const light = powerDevice.light}
          <PowerButton
            name={lamp.name}
            on={light.on}
            onclick={() => store.sendLight(lamp.id, { type: 'set_power', on: !light.on })}
          />
        {/if}
      </div>
    </header>

    {#if selected}
      {#key selected.id}
        <div class="stage">
          {#if selected.light}
            <LightPanel device={selected} light={selected.light} stale={!!store.error} onaction={(a) => store.sendLight(selected.id, a)} />
          {:else if selected.camera}
            <CameraPanel device={selected} camera={selected.camera} onaction={(a) => store.sendCamera(selected.id, a)} />
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
    /* Above the stage, so the open device list is not painted under it. */
    z-index: 5;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 16px 0;
  }
  /* Opens to the power button's width, so the dropdown eases between full width and sharing the row. */
  .power-slot {
    flex: none;
    width: 0;
    margin-left: 0;
    opacity: 0;
    transform: scale(0.8);
    transition:
      width 0.4s var(--ease-out),
      margin-left 0.4s var(--ease-out),
      opacity 0.3s var(--ease-out),
      transform 0.4s var(--ease-out);
  }
  .power-slot.open {
    width: 42px;
    margin-left: 10px;
    opacity: 1;
    transform: none;
  }
  header :global(.switcher) {
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
