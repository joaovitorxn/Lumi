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
  <h2>Credenciais Tuya</h2>
  <p class="hint">Copie do projeto em iot.tuya.com (aba Overview). Ficam guardadas no Gerenciador de Credenciais do Windows.</p>

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
    <button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
  </div>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: 16px;
  }
  .hint {
    margin: 0;
    font-size: 12px;
    color: var(--muted);
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--muted);
  }
  input,
  select {
    padding: 8px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
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
  button {
    padding: 8px 14px;
    border-radius: 8px;
    border: none;
    background: var(--accent);
    color: #fff;
    cursor: pointer;
  }
  button.ghost {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text);
  }
  button:disabled {
    opacity: 0.6;
  }
</style>
