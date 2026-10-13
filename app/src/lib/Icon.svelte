<script module lang="ts">
  export type IconName = 'refresh' | 'settings' | 'alert' | 'power' | 'minus' | 'plus' | 'sun' | 'check' | 'clock' | 'key' | 'globe' | 'login' | 'chevron' | 'back' | 'eye-off' | 'target' | 'volume' | 'volume-off' | 'pip' | 'bulb' | 'camera' | 'plug' | 'device';
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
  {:else if name === 'eye-off'}
    <path d="M4 4l16 16" /><path d="M10 6.2A9.6 9.6 0 0 1 12 6c5 0 8.5 4.5 9.5 6a14 14 0 0 1-2.6 3.2M6.5 7.6A14 14 0 0 0 2.5 12c1 1.5 4.5 6 9.5 6 1.4 0 2.7-.3 3.8-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  {:else if name === 'volume'}
    <path d="M4 10v4h3.5l4.5 4V6l-4.5 4z" /><path d="M16 9a4.2 4.2 0 0 1 0 6M18.6 6.6a8 8 0 0 1 0 10.8" />
  {:else if name === 'volume-off'}
    <path d="M4 10v4h3.5l4.5 4V6l-4.5 4z" /><path d="m16.5 9.5 5 5M21.5 9.5l-5 5" />
  {:else if name === 'bulb'}
    <path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
  {:else if name === 'camera'}
    <circle cx="12" cy="10" r="6.5" /><circle cx="12" cy="10" r="2.5" /><path d="M8 20.5h8M12 16.5v4" />
  {:else if name === 'plug'}
    <path d="M9 3v4M15 3v4" /><path d="M6 7h12v4a6 6 0 0 1-12 0z" /><path d="M12 17v4" />
  {:else if name === 'device'}
    <rect x="4" y="5" width="16" height="11" rx="2" /><path d="M9 20h6M12 16v4" />
  {:else if name === 'pip'}
    <rect x="3" y="5" width="18" height="14" rx="2.5" /><rect x="12" y="12" width="7" height="5" rx="1" />
  {:else if name === 'target'}
    <circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="1.5" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
  {:else if name === 'sun'}
    <circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  {/if}
</svg>
