<script lang="ts">
  import DeviceIcon from './DeviceIcon.svelte';
  import type { DeviceView } from './types';

  let { device }: { device: DeviceView } = $props();

  const reason = $derived(
    device.category !== 'dj' ? 'Ainda não suportado' : !device.online ? 'Offline' : 'Sem resposta'
  );
</script>

<article class="card">
  <DeviceIcon category={device.category} />
  <span class="name">
    <strong>{device.name}</strong>
    <span>{reason}</span>
  </span>
</article>

<style>
  .card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius);
  }
  .name {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
    font-size: 15px;
    color: #c3c8d4;
  }
  .name span {
    font-size: 12px;
    color: var(--muted);
  }
</style>
