<script lang="ts">
  import { tick } from 'svelte';
  import Icon, { type IconName } from './Icon.svelte';
  import { t } from './i18n.svelte';
  import { firstDevice, groupByKind } from './kinds';
  import type { DeviceView } from './types';

  let {
    devices,
    selectedId,
    onselect
  }: { devices: DeviceView[]; selectedId: string; onselect: (id: string) => void } = $props();

  let root: HTMLElement | undefined = $state();
  let trigger: HTMLButtonElement | undefined = $state();
  let open = $state(false);

  const selected = $derived(devices.find((d) => d.id === selectedId) ?? firstDevice(devices));

  const icons: Record<string, IconName> = { dj: 'bulb', sp: 'camera', cz: 'plug' };
  const iconFor = (category: string): IconName => icons[category] ?? 'device';

  const groups = $derived(groupByKind(devices));

  const options = () => Array.from(root?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);

  async function show() {
    if (!devices.length) return;
    open = true;
    await tick();
    (options().find((o) => o.getAttribute('aria-selected') === 'true') ?? options()[0])?.focus();
  }

  function close(refocus = false) {
    open = false;
    if (refocus) trigger?.focus();
  }

  function choose(id: string) {
    onselect(id);
    close(true);
  }

  function triggerKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      show();
    }
  }

  function listKey(e: KeyboardEvent) {
    const items = options();
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') items[Math.min(items.length - 1, at + 1)]?.focus();
    else if (e.key === 'ArrowUp') items[Math.max(0, at - 1)]?.focus();
    else if (e.key === 'Home') items[0]?.focus();
    else if (e.key === 'End') items[items.length - 1]?.focus();
    else if (e.key === 'Escape') close(true);
    else if (e.key === 'Tab') close();
    else return;
    e.preventDefault();
    e.stopPropagation();
  }

  $effect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root?.contains(e.target as Node)) close();
    };
    window.addEventListener('pointerdown', away);
    return () => window.removeEventListener('pointerdown', away);
  });
</script>

<div class="switcher" bind:this={root}>
  <button
    bind:this={trigger}
    type="button"
    class="trigger"
    class:open
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label={t('devices.nav')}
    disabled={!devices.length}
    onclick={() => (open ? close() : show())}
    onkeydown={triggerKey}
  >
    {#if selected}
      <span class="kind" class:lit={!!selected.light?.on} class:on={!!selected.light?.on} aria-hidden="true">
        <Icon name={iconFor(selected.category)} size={18} />
      </span>
      <span class="name">{selected.name}</span>
    {/if}
    <span class="chev" aria-hidden="true"><Icon name="chevron" size={16} /></span>
  </button>

  {#if open}
    <div class="menu" role="listbox" aria-label={t('devices.nav')} tabindex="-1" onkeydown={listKey}>
      {#each groups as group (group.id)}
        <div class="group" role="group" aria-labelledby={groups.length > 1 ? `kind-${group.id}` : undefined}>
          {#if groups.length > 1}
            <div class="heading" id="kind-{group.id}">{t(group.label)}</div>
          {/if}
          {#each group.devices as device (device.id)}
            <button
              type="button"
              class="option"
              role="option"
              tabindex="-1"
              aria-selected={device.id === selected?.id}
              onclick={() => choose(device.id)}
            >
              <span class="kind" class:lit={!!device.light?.on} aria-hidden="true">
                <Icon name={iconFor(device.category)} size={18} />
              </span>
              <span class="name">{device.name}</span>
              {#if device.id === selected?.id}<span class="tick" aria-hidden="true"><Icon name="check" size={16} /></span>{/if}
            </button>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .switcher {
    position: relative;
    min-width: 0;
  }
  .trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 40px;
    padding: 0 10px 0 14px;
    border-radius: 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    transition:
      background 0.25s var(--ease-out),
      border-color 0.25s var(--ease-out);
  }
  .trigger:hover:not(:disabled),
  .trigger.open {
    background: var(--surface-hi);
    border-color: var(--border-strong);
  }
  .trigger:disabled {
    cursor: default;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chev {
    display: flex;
    flex: none;
    color: var(--muted);
    transform: rotate(90deg);
    transition: transform 0.25s var(--ease-out);
  }
  .open .chev {
    transform: rotate(-90deg);
  }

  .menu {
    position: absolute;
    z-index: 20;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    max-height: 232px;
    overflow-y: auto;
    padding: 6px;
    border-radius: 18px;
    background: linear-gradient(#1b1b1f, #151518);
    border: 1px solid var(--border-strong);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.07),
      0 12px 28px rgb(0 0 0 / 0.65);
    animation: drop 0.2s var(--ease-out) both;
  }
  @keyframes drop {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
  }
  .group + .group {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid var(--border);
  }
  .heading {
    padding: 6px 10px 4px;
    color: var(--muted);
    font-size: 11.5px;
  }
  .option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 38px;
    padding: 0 10px;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: var(--muted);
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    transition:
      background 0.2s var(--ease-out),
      color 0.2s var(--ease-out);
  }
  .option:hover,
  .option:focus-visible {
    background: var(--surface-hi);
    color: var(--text);
  }
  .option:focus-visible {
    outline-offset: -2px;
  }
  .option[aria-selected='true'] {
    color: var(--text);
  }
  .tick {
    display: flex;
    flex: none;
    color: var(--muted);
  }

  /* The icon says what the device is; a lit lamp's icon glows, in its own colour in the trigger. */
  .kind {
    display: flex;
    flex: none;
    color: #6b6a68;
    transition: color 0.25s var(--ease-out);
  }
  .kind.lit {
    color: #cfc9bf;
  }
  .trigger .kind.on {
    color: rgb(var(--light));
  }
  .trigger .kind:not(.lit),
  .option[aria-selected='true'] .kind:not(.lit) {
    color: var(--muted);
  }
</style>
