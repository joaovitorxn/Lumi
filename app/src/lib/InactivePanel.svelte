<script lang="ts">
  import DeviceHero from './DeviceHero.svelte';
  import type { DeviceView } from './types';

  let { device }: { device: DeviceView } = $props();

  const reason = $derived(
    device.category !== 'dj' ? 'Ainda não suportado' : !device.online ? 'Offline' : 'Sem resposta'
  );
</script>

<section class="panel" aria-label={device.name}>
  <div class="hero"><DeviceHero category={device.category} /></div>
  <div class="text">
    <strong>{device.name}</strong>
    <span>{reason}</span>
  </div>
</section>

<style>
  .panel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0 16px 24px;
  }
  .hero {
    flex: 1 1 auto;
    min-height: 120px;
    padding-top: 6px;
    opacity: 0.8;
  }
  .text {
    flex: none;
    padding: 0 6px;
  }
  strong {
    display: block;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  span {
    color: var(--muted);
    font-size: 13px;
  }
</style>
