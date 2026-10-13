<script lang="ts">
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let { value, duration = 450 }: { value: number; duration?: number } = $props();

  const columns = [1, 10, 100];
  /** One cumulative position per column, so a digit always rolls the short way (49 to 50 turns the 9 up to 0). */
  const pos = columns.map((unit) => new Tween(Math.floor(value / unit), { duration, easing: cubicOut }));
  $effect(() => {
    columns.forEach((unit, i) => pos[i].set(Math.floor(value / unit)));
  });

  /** Height of one digit cell in em. The window shows 0.95em, so neighbours sit well outside it. */
  const CELL = 1.6;
  const strip = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  /** Position inside the strip, 0..10; the extra 0 at the end makes the 9-to-0 turn seamless. */
  const offset = (i: number) => {
    const p = pos[i].current;
    return ((p % 10) + 10) % 10;
  };
  /** Blur follows how far the column still has to travel, so it clears as the digit settles. */
  const blur = (i: number) => Math.min(3, Math.abs(pos[i].target - pos[i].current) * 0.9);
  const shown = (i: number) => value >= columns[i] || i === 0;
</script>

<span class="roll" role="img" aria-label={String(value)}>
  <!-- Highest column first; a column collapses while its digit would be a leading zero. -->
  {#each [2, 1, 0] as i (i)}
    <span class="col" class:gone={!shown(i)} aria-hidden="true">
      <span class="sizer">0</span>
      <span class="strip" style:--cell={`${CELL}em`} style:transform={`translateY(${-offset(i) * CELL}em)`} style:filter={`blur(${blur(i)}px)`}>
        {#each strip as d}<span>{d}</span>{/each}
      </span>
    </span>
  {/each}
</span>

<style>
  .roll {
    display: inline-flex;
    font-variant-numeric: tabular-nums;
  }
  /* The window reaches 0.12em past the digit on both sides and its edges fade out, so a rolling digit
     dissolves instead of being cut by a hard line. Neighbouring digits are a full cell apart, far outside
     the window, so none shows at rest. The negative margin keeps the line height unchanged. */
  .col {
    position: relative;
    display: inline-block;
    height: 1.19em;
    margin-block: -0.12em;
    max-width: 1.2em;
    overflow: hidden;
    mask-image: linear-gradient(to bottom, transparent, #000 0.24em, #000 calc(100% - 0.3em), transparent);
    transition:
      max-width 0.35s var(--ease-out),
      opacity 0.35s var(--ease-out);
  }
  .col.gone {
    max-width: 0;
    opacity: 0;
  }
  .sizer {
    visibility: hidden;
  }
  .strip {
    position: absolute;
    left: 0;
    /* Centres the cell in the window: 0.12em of reach, minus half of what the cell has beyond the 0.95em. */
    top: calc(0.12em - (var(--cell) - 0.95em) / 2);
    display: flex;
    flex-direction: column;
  }
  .strip span {
    height: var(--cell);
    line-height: var(--cell);
  }
</style>
