<script lang="ts">
  import Icon, { type IconName } from './Icon.svelte';

  let {
    category,
    on = false,
    color = '#3b4050',
    glow = 0
  }: { category: string; on?: boolean; color?: string; glow?: number } = $props();

  const other: Record<string, { kind: string; icon: IconName }> = {
    cz: { kind: 'plug', icon: 'plug' },
    sp: { kind: 'camera', icon: 'camera' }
  };
  const fallback = $derived(other[category] ?? { kind: 'device', icon: 'device' as IconName });
</script>

{#if category === 'dj'}
  <span
    class="tile light"
    data-kind="light"
    data-state={on ? 'on' : 'off'}
    style:--lamp={color}
    style:--glow={glow}
    aria-hidden="true"
  >
    <span class="pool"></span>
    <svg viewBox="0 0 48 48" width="34" height="34" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path class="glass" d="M24 7a12 12 0 0 0-7 21.8V33h14v-4.2A12 12 0 0 0 24 7z" />
      <path class="filament" d="M20.5 25 24 20.5l3.5 4.5" />
      <path class="cap" d="M19 37.5h10M21 41.5h6" />
    </svg>
  </span>
{:else}
  <span class="tile muted" data-kind={fallback.kind} aria-hidden="true">
    <Icon name={fallback.icon} size={24} />
  </span>
{/if}

<style>
  .tile {
    position: relative;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    flex: none;
    border-radius: 16px;
    background: var(--surface-hi);
    border: 1px solid var(--border);
    overflow: hidden;
  }
  .muted {
    color: #6e7586;
  }

  .pool {
    position: absolute;
    inset: -30%;
    background: radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--lamp) 85%, transparent), transparent 52%);
    opacity: calc(var(--glow) * 0.7);
    transition: opacity 0.45s var(--ease-out);
  }
  [data-state='on'] .pool {
    animation: breathe 5s ease-in-out infinite;
  }
  @keyframes breathe {
    50% {
      transform: scale(1.08);
    }
  }

  svg {
    position: relative;
    stroke-width: 1.8;
  }
  .glass {
    stroke: #6e7586;
    fill: transparent;
    transition:
      fill 0.4s var(--ease-out),
      stroke 0.4s var(--ease-out);
  }
  .filament,
  .cap {
    stroke: #6e7586;
    transition: stroke 0.4s var(--ease-out);
  }
  [data-state='on'] .glass {
    fill: color-mix(in srgb, var(--lamp) 85%, transparent);
    stroke: var(--lamp);
  }
  [data-state='on'] .filament {
    stroke: rgb(255 255 255 / 0.85);
  }
  [data-state='on'] .cap {
    stroke: #a8aebd;
  }
</style>
