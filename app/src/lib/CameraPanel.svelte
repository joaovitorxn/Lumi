<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import Hls from 'hls.js';
  import { tauriApi, toAppError } from './api';
  import Icon from './Icon.svelte';
  import { t } from './i18n.svelte';
  import type { CameraAction, CameraState, DeviceView, Direction } from './types';

  let {
    device,
    camera,
    onaction
  }: { device: DeviceView; camera: CameraState; onaction: (a: CameraAction) => void } = $props();

  const directions: Direction[] = ['up', 'left', 'right', 'down'];
  /** The camera keeps moving until told to stop, so a held button must always end with a stop. */
  let moving = $state<Direction | null>(null);
  let movedAt = 0;
  let stopTimer: ReturnType<typeof setTimeout> | undefined;
  /** Tuya takes a moment to deliver each command; a stop sent right after a move would cancel it unseen. */
  const MIN_MOVE_MS = 700;

  function start(direction: Direction) {
    clearTimeout(stopTimer);
    moving = direction;
    movedAt = Date.now();
    onaction({ type: 'ptz_move', direction });
  }
  function stop(now = false) {
    if (!moving) return;
    moving = null;
    const wait = now ? 0 : Math.max(0, MIN_MOVE_MS - (Date.now() - movedAt));
    stopTimer = setTimeout(() => onaction({ type: 'ptz_stop' }), wait);
  }
  function press(direction: Direction, e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start(direction);
  }
  const release = () => stop();

  let video: HTMLVideoElement;
  /** Starts muted: the player may not make sound before the person asks for it. */
  let muted = $state(true);
  let inPip = $state(false);
  const canPip = typeof document !== 'undefined' && document.pictureInPictureEnabled;

  async function togglePip() {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      // The picture may not be ready yet; the button simply does nothing.
    }
  }
  let status = $state<'connecting' | 'live' | 'error' | 'private'>('connecting');
  let detail = $state('');
  let hls: Hls | undefined;

  async function connect() {
    hls?.destroy();
    status = 'connecting';
    detail = '';
    try {
      const url = await tauriApi.cameraStream(device.id);
      // Stay close to the live edge and catch up gently after a stall.
      hls = new Hls({
        lowLatencyMode: true,
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 3,
        maxLiveSyncPlaybackRate: 1.5
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hls.on(Hls.Events.FRAG_LOADED, () => (status = 'live'));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        detail = `${data.type}: ${data.details}`;
        status = 'error';
        hls?.destroy();
      });
      hls.loadSource(url);
      hls.attachMedia(video);
    } catch (e) {
      detail = toAppError(e).message;
      status = 'error';
    }
  }

  /** A stream opened before privacy mode went on keeps playing, so close it and reopen when it ends. */
  function applyPrivacy(isPrivate: boolean) {
    if (isPrivate) {
      hls?.destroy();
      hls = undefined;
      status = 'private';
    } else if (status === 'private') {
      connect();
    }
  }

  let privacySeen: boolean | undefined;
  $effect(() => {
    const now = camera.private;
    const first = privacySeen === undefined;
    if (first || now === privacySeen) {
      privacySeen = now;
      return;
    }
    privacySeen = now;
    untrack(() => applyPrivacy(now));
  });

  onMount(() => {
    const enter = () => (inPip = true);
    const leave = () => (inPip = false);
    video.addEventListener('enterpictureinpicture', enter);
    video.addEventListener('leavepictureinpicture', leave);
    untrack(() => (camera.private ? applyPrivacy(true) : connect()));
    return () => {
      video.removeEventListener('enterpictureinpicture', enter);
      video.removeEventListener('leavepictureinpicture', leave);
      hls?.destroy();
      stop(true);
    };
  });
</script>

<section class="panel" aria-label={device.name}>
  <div class="view">
    <!-- svelte-ignore a11y_media_has_caption -->
    <video bind:this={video} bind:muted playsinline></video>
    {#if status !== 'live'}
      <div class="overlay">
        {#if status === 'private'}
          <span>{t('camera.privacyOn')}</span>
        {:else if status === 'connecting'}
          <span>{t('camera.connecting')}</span>
        {:else}
          <span>{t('camera.error')}</span>
          {#if detail}<small>{detail}</small>{/if}
          <button type="button" class="retry" onclick={connect}>{t('camera.retry')}</button>
        {/if}
      </div>
    {/if}
    {#if status === 'live'}
      <div class="tools">
        {#if canPip}
          <button
            type="button"
            class="tool"
            aria-pressed={inPip}
            aria-label={inPip ? t('camera.pipOff') : t('camera.pipOn')}
            onclick={togglePip}
          >
            <Icon name="pip" size={18} />
          </button>
        {/if}
        <button
          type="button"
          class="tool"
          aria-pressed={!muted}
          aria-label={muted ? t('camera.soundOn') : t('camera.soundOff')}
          onclick={() => (muted = !muted)}
        >
          <Icon name={muted ? 'volume-off' : 'volume'} size={18} />
        </button>
      </div>
    {/if}
  </div>

  <div class="readout">
    <strong>{device.name}</strong>
    <span class:live={status === 'live'}>{status === 'live' ? t('camera.live') : ''}</span>
  </div>

  <div class="controls">
    <div class="pad" role="group" aria-label={t('camera.pad')}>
    {#each directions as d (d)}
      <button
        type="button"
        class="step"
        data-dir={d}
        data-held={moving === d ? 'true' : undefined}
        aria-label={t(`camera.${d}`)}
        onpointerdown={(e) => press(d, e)}
        onpointerup={release}
        onpointercancel={release}
        onlostpointercapture={release}
        onkeydown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && start(d)}
        onkeyup={(e) => (e.key === ' ' || e.key === 'Enter') && release()}
      >
        <Icon name="chevron" size={20} />
      </button>
    {/each}
  </div>
  <div class="tiles">
      <button
        class="tile"
        class:sel={camera.private}
        aria-pressed={camera.private}
        onclick={() => onaction({ type: 'set_private', on: !camera.private })}
      >
        <span class="head"><span class="ic"><Icon name="eye-off" size={18} /></span><small>{t('camera.private')}</small></span>
        <b>{camera.private ? t('camera.on') : t('camera.off')}</b>
      </button>
      <button
        class="tile"
        class:sel={camera.motion_tracking}
        aria-pressed={camera.motion_tracking}
        onclick={() => onaction({ type: 'set_motion_tracking', on: !camera.motion_tracking })}
      >
        <span class="head"><span class="ic"><Icon name="target" size={18} /></span><small>{t('camera.tracking')}</small></span>
        <b>{camera.motion_tracking ? t('camera.on') : t('camera.off')}</b>
      </button>
    </div>
  </div>
</section>

<style>
  .panel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 14px 16px 20px;
  }
  .view {
    position: relative;
    flex: none;
    aspect-ratio: 16 / 9;
    border-radius: var(--radius);
    overflow: hidden;
    background: #000;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.07);
  }
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    text-align: center;
    color: var(--muted);
    font-size: 13px;
  }
  small {
    font-size: 11px;
    opacity: 0.7;
    word-break: break-word;
  }
  .retry {
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: linear-gradient(var(--raise-top), var(--raise-bot));
    cursor: pointer;
  }

  .tools {
    position: absolute;
    right: 8px;
    bottom: 8px;
    display: flex;
    gap: 6px;
  }
  .tool {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 50%;
    background: rgb(13 13 15 / 0.55);
    border: 1px solid rgb(255 255 255 / 0.12);
    backdrop-filter: blur(6px);
    color: var(--text);
    cursor: pointer;
    transition:
      background 0.2s var(--ease-out),
      transform 0.15s var(--ease-out);
  }
  .tool:hover {
    background: rgb(13 13 15 / 0.75);
  }
  .tool:active {
    transform: scale(0.92);
  }
  .tool[aria-pressed='true'] {
    background: rgb(var(--light) / 0.4);
  }

  .controls {
    flex: none;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 16px;
  }

  /* An inset well with four raised cream caps, the way the brightness slider's thumb sits in its track. */
  .pad {
    position: relative;
    flex: none;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: var(--track);
    box-shadow:
      inset 0 3px 8px rgb(0 0 0 / 0.9),
      inset 0 -1px 0 rgb(255 255 255 / 0.05),
      0 1px 0 rgb(255 255 255 / 0.04);
  }
  .pad::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 8px;
    height: 8px;
    margin: -4px 0 0 -4px;
    border-radius: 50%;
    background: #17171a;
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.8);
  }
  .step {
    position: absolute;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: linear-gradient(#f1ede6, #cfcac1);
    color: #2a2a2e;
    box-shadow:
      0 2px 6px rgb(0 0 0 / 0.6),
      inset 0 1px 0 #fff,
      inset 0 -2px 0 rgb(0 0 0 / 0.12);
    cursor: pointer;
    touch-action: none;
    transition:
      transform 0.12s var(--ease-out),
      box-shadow 0.12s var(--ease-out),
      filter 0.2s var(--ease-out);
  }
  .step :global(svg) {
    pointer-events: none;
  }
  .step:hover {
    filter: brightness(1.06);
  }
  .step[data-held] {
    transform: translateY(2px);
    background: linear-gradient(#cfcac1, #e3dfd6);
    box-shadow:
      0 0 0 rgb(0 0 0 / 0),
      inset 0 2px 4px rgb(0 0 0 / 0.35);
  }
  .step[data-dir='up'] {
    top: 8px;
    left: 40px;
  }
  .step[data-dir='down'] {
    bottom: 8px;
    left: 40px;
  }
  .step[data-dir='left'] {
    left: 8px;
    top: 40px;
  }
  .step[data-dir='right'] {
    right: 8px;
    top: 40px;
  }
  /* The chevron icon points right. */
  .step[data-dir='up'] :global(svg) {
    transform: rotate(-90deg);
  }
  .step[data-dir='left'] :global(svg) {
    transform: rotate(180deg);
  }
  .step[data-dir='down'] :global(svg) {
    transform: rotate(90deg);
  }

  .readout {
    flex: none;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin-top: 16px;
    padding: 0 6px;
  }
  strong {
    min-width: 0;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .readout span {
    flex: none;
    color: var(--muted);
    font-size: 13px;
  }
  .readout .live {
    color: var(--danger);
  }

  .tiles {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .tile {
    height: 55px;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: left;
    border-radius: 16px;
    background: linear-gradient(#1b1b1f, #151518);
    border: 1px solid var(--border);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.07),
      0 2px 4px rgb(0 0 0 / 0.5);
    cursor: pointer;
    transition:
      border-color 0.25s var(--ease-out),
      background 0.25s var(--ease-out),
      box-shadow 0.25s var(--ease-out),
      transform 0.15s var(--ease-out);
  }
  .tile:hover:not(.sel) {
    border-color: var(--border-strong);
    background: linear-gradient(#202024, #18181b);
  }
  .tile:active {
    transform: scale(0.98);
  }
  .tile.sel {
    border-color: #3a3a40;
    background: linear-gradient(#202025, #18181b);
    box-shadow:
      inset 0 2px 0 rgb(var(--light) / 0.9),
      inset 0 1px 0 rgb(255 255 255 / 0.06),
      0 2px 4px rgb(0 0 0 / 0.5);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
  }
  .head small {
    font-size: 12px;
    line-height: 1.2;
    opacity: 1;
  }
  .ic {
    display: flex;
  }
  .tile b {
    display: block;
    color: var(--muted);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    transition: color 0.25s var(--ease-out);
  }
  .tile.sel b {
    color: var(--text);
  }
</style>
