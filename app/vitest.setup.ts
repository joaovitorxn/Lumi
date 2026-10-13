// jsdom has no matchMedia; svelte/motion reads prefers-reduced-motion through it.
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
  onchange: null
})) as unknown as typeof window.matchMedia;

// Tests assert on the Portuguese copy; jsdom reports en-US, so pin the stored language.
localStorage.setItem('lumi.locale', 'pt');
