<script lang="ts">
  import type { DeviceView } from './types';

  let { device }: { device: DeviceView } = $props();

  const reason = $derived(
    device.category !== 'dj' ? 'Ainda não suportado' : !device.online ? 'Offline' : 'Sem resposta'
  );
</script>

<article class="card">
  <div class="dot"></div>
  <div class="name">
    <strong>{device.name}</strong>
    <span>{reason}</span>
  </div>
</article>

<style>
  .card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
    opacity: 0.55;
  }
  .dot {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #3b4050;
    flex: none;
  }
  .name {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .name span {
    font-size: 12px;
    color: var(--muted);
  }
</style>
