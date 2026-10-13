import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import type { Look } from './light';

const nums = (look: Look) => [look.core, look.edge, look.rgb].join(' ').match(/\d+/g)!.map(Number);

/** The lamp's look, eased towards each new value so colour and temperature changes fade instead of snapping. */
export function tweenedLook(get: () => Look | undefined, fallback: Look, duration = 450) {
  const initial = get() ?? fallback;
  const tween = new Tween(nums(initial), { duration, easing: cubicOut });
  $effect(() => {
    tween.set(nums(get() ?? fallback));
  });
  return {
    get current(): Look {
      const v = tween.current.map(Math.round);
      return {
        core: `rgb(${v[0]} ${v[1]} ${v[2]})`,
        edge: `rgb(${v[3]} ${v[4]} ${v[5]})`,
        rgb: `${v[6]} ${v[7]} ${v[8]}`
      };
    }
  };
}
