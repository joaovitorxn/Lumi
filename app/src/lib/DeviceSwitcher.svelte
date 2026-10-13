<script lang="ts">
  import { t } from './i18n.svelte';
  import type { DeviceView } from './types';

  let {
    devices,
    selectedId,
    onselect
  }: { devices: DeviceView[]; selectedId: string; onselect: (id: string) => void } = $props();

  let nav: HTMLElement | undefined = $state();
  let fadeLeft = $state(false);
  let fadeRight = $state(false);

  function measure() {
    if (!nav) return;
    fadeLeft = nav.scrollLeft > 1;
    fadeRight = nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 1;
  }

  /** A plain mouse wheel only scrolls vertically; map it onto the row when the row overflows. */
  function wheel(e: WheelEvent) {
    if (!nav || nav.scrollWidth <= nav.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    nav.scrollLeft += e.deltaY;
  }

  $effect(() => {
    const el = nav;
    if (!el) return;
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('scroll', measure, { passive: true });
    measure();
    return () => {
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('scroll', measure);
    };
  });

  // Keep the chosen pill in view when there are more devices than fit.
  $effect(() => {
    void selectedId;
    nav?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' });
  });
</script>

<!-- tabindex=-1 keeps the scroll container itself out of the Tab order; the pills are the stops. -->
<nav aria-label={t('devices.nav')} tabindex="-1" class:fade-left={fadeLeft} class:fade-right={fadeRight} bind:this={nav}>
  {#each devices as device (device.id)}
    <button
      class="pill"
      class:lit={!!device.light?.on}
      aria-current={device.id === selectedId ? 'true' : undefined}
      onclick={() => onselect(device.id)}
    >
      <i aria-hidden="true"></i>{device.name}
    </button>
  {/each}
</nav>

<style>
  nav {
    display: flex;
    gap: 6px;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
    /* The selected pill is scrolled in clear of the fades. */
    scroll-padding-inline: 28px;
    --fade-l: 0px;
    --fade-r: 0px;
    mask-image: linear-gradient(90deg, transparent, #000 var(--fade-l), #000 calc(100% - var(--fade-r)), transparent);
  }
  nav.fade-left {
    --fade-l: 22px;
  }
  nav.fade-right {
    --fade-r: 22px;
  }
  nav::-webkit-scrollbar {
    display: none;
  }
  .pill {
    display: flex;
    align-items: center;
    gap: 7px;
    flex: none;
    height: 32px;
    max-width: 150px;
    padding: 0 12px 0 10px;
    border-radius: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 12.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition:
      background 0.25s var(--ease-out),
      color 0.25s var(--ease-out),
      border-color 0.25s var(--ease-out);
  }
  .pill:hover {
    color: var(--text);
  }
  /* Inset ring: an outside ring would be clipped by the scrolling row. */
  .pill:focus-visible {
    outline-offset: -2px;
  }
  .pill[aria-current='true'] {
    background: var(--surface-hi);
    border-color: var(--border-strong);
    color: var(--text);
  }
  i {
    width: 8px;
    height: 8px;
    flex: none;
    border-radius: 50%;
    background: #3a3a3f;
  }
  .lit i {
    background: #cfc9bf;
  }
  .pill[aria-current='true'].lit i {
    background: rgb(var(--light));
  }
</style>
