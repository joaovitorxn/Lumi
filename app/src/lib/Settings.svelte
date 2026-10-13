<script lang="ts">
  import { toAppError } from './api';
  import type { Region } from './types';

  let {
    onsave,
    oncancel
  }: {
    onsave: (accessId: string, accessSecret: string, region: Region) => Promise<void>;
    oncancel?: () => void;
  } = $props();

  let accessId = $state('');
  let accessSecret = $state('');
  let region = $state<Region>('us');
  let message = $state('');
  let saving = $state(false);

  async function submit(e: Event) {
    e.preventDefault();
    if (!accessId.trim() || !accessSecret.trim()) {
      message = 'Preencha o Access ID e o Access Secret.';
      return;
    }
    saving = true;
    message = '';
    try {
      await onsave(accessId, accessSecret, region);
    } catch (err) {
      message = toAppError(err).message;
    } finally {
      saving = false;
    }
  }
</script>

<form onsubmit={submit}>
  <header>
    <h2>Credenciais Tuya</h2>
    <p class="hint">
      Copie do projeto em iot.tuya.com (aba Overview). Ficam guardadas no Gerenciador de Credenciais do Windows.
    </p>
  </header>

  <label>
    Access ID
    <input bind:value={accessId} autocomplete="off" spellcheck="false" />
  </label>
  <label>
    Access Secret
    <input type="password" bind:value={accessSecret} autocomplete="off" />
  </label>
  <label>
    Região
    <select bind:value={region}>
      <option value="us">Western America (us)</option>
      <option value="eu">Central Europe (eu)</option>
      <option value="cn">China (cn)</option>
      <option value="in">India (in)</option>
    </select>
  </label>

  {#if message}<p class="error" role="alert">{message}</p>{/if}

  <div class="actions">
    {#if oncancel}<button type="button" class="ghost" onclick={oncancel}>Cancelar</button>{/if}
    <button type="submit" class="primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
  </div>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    animation: rise 0.4s var(--ease-out) both;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
  h2 {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .hint {
    margin: 0;
    font-size: 12px;
    color: var(--muted);
    max-width: 38ch;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: var(--muted);
  }
  input,
  select {
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-strong);
    background: var(--surface);
    color: var(--text);
    font: inherit;
    transition: border-color 0.2s;
  }
  input:hover,
  select:hover {
    border-color: rgb(255 255 255 / 0.22);
  }
  input:focus-visible,
  select:focus-visible {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
  }
  .error {
    margin: 0;
    color: var(--danger);
    font-size: 13px;
  }
  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  .actions button {
    padding: 10px 18px;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    cursor: pointer;
    transition:
      transform 0.15s var(--ease-out),
      background 0.2s;
  }
  .actions button:active {
    transform: scale(0.97);
  }
  .primary {
    background: var(--accent);
    color: #16130f;
    font-weight: 600;
  }
  .primary:hover {
    background: color-mix(in srgb, var(--accent) 88%, #fff);
  }
  .ghost {
    background: none;
    border-color: var(--border-strong);
    color: var(--text);
  }
  .ghost:hover {
    background: var(--surface-hi);
  }
  button:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>
