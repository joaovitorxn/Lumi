<script lang="ts">
  import type { Look } from './light';

  let {
    category,
    on = false,
    look,
    brightness = 1
  }: { category: string; on?: boolean; look?: Look; brightness?: number } = $props();

  /** 0..1; the lamp never goes fully dark while on, so the lowest setting stays visible. */
  const level = $derived(Math.min(1, Math.max(0, brightness)));

  const uid = $props.id();
  const kinds: Record<string, string> = { dj: 'light', cz: 'plug', sp: 'camera' };
  const kind = $derived(kinds[category] ?? 'device');
</script>

<div
  class="hero"
  data-kind={kind}
  data-state={on ? 'on' : 'off'}
  style:--light={look?.rgb}
  style:--core={look?.core}
  style:--edge={look?.edge}
  style:--level={level}
  aria-hidden="true"
>
  {#if kind === 'light'}
    <span class="pool"></span>
    <svg viewBox="0 0 120 160" role="presentation">
      <defs>
        <radialGradient id={`${uid}-off`} cx="50%" cy="40%" r="62%">
          <stop offset="0" stop-color="#3b3c42" />
          <stop offset=".5" stop-color="#26272b" />
          <stop offset="1" stop-color="#17181b" />
        </radialGradient>
        <radialGradient id={`${uid}-on`} cx="50%" cy="40%" r="62%">
          <stop offset="0" stop-color="#fff" stop-opacity=".96" />
          <stop offset=".38" class="core" />
          <stop offset="1" class="edge" />
        </radialGradient>
        <linearGradient id={`${uid}-metal`} x1="0" x2="1">
          <stop offset="0" stop-color="#5d6068" />
          <stop offset=".3" stop-color="#d6d8dd" />
          <stop offset=".62" stop-color="#8b8e96" />
          <stop offset="1" stop-color="#4b4d54" />
        </linearGradient>
      </defs>
      <path
        class="glass"
        d="M60 8c-27 0-46 19-46 44 0 18 8 28 18 38 5 6 7 11 7 19h42c0-8 2-13 7-19 10-10 18-20 18-38C106 27 87 8 60 8z"
        fill={`url(#${uid}-off)`}
      />
      <path
        class="glass lit"
        d="M60 8c-27 0-46 19-46 44 0 18 8 28 18 38 5 6 7 11 7 19h42c0-8 2-13 7-19 10-10 18-20 18-38C106 27 87 8 60 8z"
        fill={`url(#${uid}-on)`}
      />
      <path
        class="rim"
        d="M60 8c-27 0-46 19-46 44 0 18 8 28 18 38 5 6 7 11 7 19h42c0-8 2-13 7-19 10-10 18-20 18-38C106 27 87 8 60 8z"
        fill="none"
        stroke="#fff"
        stroke-opacity=".16"
        stroke-width="1.5"
      />
      <path class="spec" d="M33 32c5-11 13-18 24-21" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" />
      <path class="fil" d="M49 108V76m22 32V76M49 76c3-11 19-11 22 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" />
      <rect class="metal" x="38" y="109" width="44" height="9" rx="3" fill="#bfc2c9" />
      <rect class="metal" x="36" y="118" width="48" height="30" rx="5" fill={`url(#${uid}-metal)`} />
      <path class="metal" d="M36 126h48M36 134h48M36 142h48" stroke="#000" stroke-opacity=".28" stroke-width="2" />
      <path d="M46 148h28l-4 8H50z" fill="#2a2b30" />
    </svg>
  {:else if kind === 'plug'}
    <svg viewBox="0 0 120 160" role="presentation">
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#43454b" />
          <stop offset="1" stop-color="#222327" />
        </linearGradient>
      </defs>
      <path d="M60 150v-30" stroke="#33353a" stroke-width="10" stroke-linecap="round" />
      <rect x="44" y="26" width="9" height="34" rx="3" fill="#6d7077" />
      <rect x="67" y="26" width="9" height="34" rx="3" fill="#6d7077" />
      <rect x="28" y="56" width="64" height="68" rx="18" fill={`url(#${uid}-body)`} />
      <path d="M38 66c8-4 20-5 34-3" stroke="#fff" stroke-opacity=".18" stroke-width="3" fill="none" stroke-linecap="round" />
      <circle cx="60" cy="92" r="9" fill="#17181b" stroke="#3a3c42" stroke-width="2" />
    </svg>
  {:else if kind === 'camera'}
    <svg viewBox="0 0 120 160" role="presentation">
      <defs>
        <radialGradient id={`${uid}-head`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stop-color="#4a4c53" />
          <stop offset="1" stop-color="#1e1f23" />
        </radialGradient>
      </defs>
      <rect x="34" y="118" width="52" height="22" rx="8" fill="#33353a" />
      <rect x="52" y="104" width="16" height="16" fill="#2a2b30" />
      <circle cx="60" cy="70" r="38" fill={`url(#${uid}-head)`} />
      <circle cx="60" cy="70" r="21" fill="#0b0b0d" stroke="#3a3c42" stroke-width="3" />
      <circle cx="52" cy="62" r="5" fill="#fff" fill-opacity=".22" />
    </svg>
  {:else}
    <svg viewBox="0 0 120 160" role="presentation">
      <rect x="22" y="40" width="76" height="56" rx="8" fill="#26272b" stroke="#3a3c42" stroke-width="2" />
      <rect x="30" y="48" width="60" height="40" rx="3" fill="#17181b" />
      <path d="M50 118h20M60 96v22" stroke="#3a3c42" stroke-width="5" stroke-linecap="round" />
    </svg>
  {/if}
</div>

<style>
  .hero {
    position: relative;
    display: flex;
    justify-content: center;
    height: 100%;
    min-height: 0;
  }
  svg {
    position: relative;
    height: 100%;
    width: auto;
    max-height: 196px;
    transition: filter 0.3s var(--ease-out);
  }

  .pool {
    position: absolute;
    left: 50%;
    bottom: 2px;
    width: 230px;
    height: 40px;
    transform: translateX(-50%) scaleX(0.7);
    background: radial-gradient(ellipse at 50% 50%, rgb(var(--light) / 0.34), transparent 68%);
    opacity: 0;
    transition:
      opacity 0.6s var(--ease-out),
      transform 0.8s var(--ease-out);
  }
  [data-state='on'] .pool {
    opacity: calc(0.25 + 0.75 * var(--level, 1));
    transform: translateX(-50%) scaleX(1);
  }

  .core {
    stop-color: var(--core, #ffdca8);
  }
  .edge {
    stop-color: var(--edge, #e8a35a);
  }

  .glass.lit,
  .spec,
  .fil {
    transition: opacity 0.35s var(--ease-out);
  }
  .glass.lit {
    opacity: 0;
  }
  .spec {
    stroke-opacity: 1;
    opacity: 0.2;
  }
  .fil {
    opacity: 0.16;
  }
  [data-state='on'] .glass.lit {
    opacity: calc(0.3 + 0.7 * var(--level, 1));
  }
  [data-state='on'] svg {
    filter: drop-shadow(0 0 calc(30px * var(--level, 1)) rgb(var(--light) / calc(0.55 * var(--level, 1))));
  }
  [data-state='on'] .spec {
    opacity: calc(0.2 + 0.35 * var(--level, 1));
  }
  [data-state='on'] .fil {
    opacity: calc(0.3 + 0.55 * var(--level, 1));
  }
  .metal {
    transition: opacity 0.55s var(--ease-out);
    opacity: 0.55;
  }
  [data-state='on'] .metal {
    opacity: 1;
  }
</style>
