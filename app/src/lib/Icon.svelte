<script module lang="ts">
  export type IconName = 'refresh' | 'chevron' | 'settings' | 'alert' | 'plug' | 'camera' | 'device';
</script>

<script lang="ts">
  let { name, size = 20 }: { name: IconName; size?: number } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.75"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if name === 'refresh'}
    <path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 5v6h-6" />
  {:else if name === 'chevron'}
    <path d="m6 9 6 6 6-6" />
  {:else if name === 'settings'}
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" />
  {:else if name === 'alert'}
    <path d="M12 4 3 20h18z" /><path d="M12 10v4M12 17v.5" />
  {:else if name === 'plug'}
    <path d="M9 3v5M15 3v5" /><path d="M6 8h12v3a6 6 0 0 1-12 0z" /><path d="M12 17v4" />
  {:else if name === 'camera'}
    <rect x="3" y="7" width="12" height="10" rx="2.5" /><path d="m15 11 6-3v8l-6-3" />
  {:else}
    <rect x="4" y="5" width="16" height="12" rx="2" /><path d="M9 21h6M12 17v4" />
  {/if}
</svg>
