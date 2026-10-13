<script module lang="ts">
  export type IconName = 'refresh' | 'settings' | 'alert' | 'power' | 'minus' | 'plus' | 'sun';
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
  {:else if name === 'settings'}
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" />
  {:else if name === 'alert'}
    <path d="M12 4 3 20h18z" /><path d="M12 10v4M12 17v.5" />
  {:else if name === 'power'}
    <path d="M12 3v9" /><path d="M6.4 6.6a8 8 0 1 0 11.2 0" />
  {:else if name === 'minus'}
    <path d="M6 12h12" />
  {:else if name === 'plus'}
    <path d="M12 6v12M6 12h12" />
  {:else if name === 'sun'}
    <circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  {/if}
</svg>
