<script module lang="ts">
  export type IconName = 'refresh' | 'settings' | 'alert' | 'power' | 'minus' | 'plus' | 'sun' | 'check' | 'clock' | 'key' | 'globe' | 'login' | 'chevron' | 'back';
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
  {:else if name === 'check'}
    <circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16 9.5" />
  {:else if name === 'clock'}
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  {:else if name === 'key'}
    <circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16 7l3 3M14 9l2 2" />
  {:else if name === 'globe'}
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
  {:else if name === 'login'}
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M4 12h10M10 8l4 4-4 4" />
  {:else if name === 'chevron'}
    <path d="m9 6 6 6-6 6" />
  {:else if name === 'back'}
    <path d="m15 6-6 6 6 6" />
  {:else if name === 'sun'}
    <circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  {/if}
</svg>
