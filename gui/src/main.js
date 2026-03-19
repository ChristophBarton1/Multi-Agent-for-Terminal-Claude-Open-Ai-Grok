const { invoke } = window.__TAURI__.core;

let apiKeys = { XAI_API_KEY: '', OPENAI_API_KEY: '' };

async function loadAgents() {
  const list = document.getElementById('agents-list');
  try {
    const agents = await invoke('get_agents');
    list.innerHTML = '';
    for (const agent of agents) {
      const item = document.createElement('div');
      item.className = 'agent-item';
      item.innerHTML = `
        <div>
          <div class="agent-name">${agent.label}</div>
          <div class="agent-key-hint">${agent.has_key ? '✓ API Key set' : '✗ No API Key'}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${agent.enabled ? 'checked' : ''} ${!agent.has_key ? 'disabled' : ''} data-agent="${agent.name}" />
          <span class="toggle-slider"></span>
        </label>
      `;
      item.querySelector('input').addEventListener('change', async (e) => {
        await invoke('toggle_agent', { name: e.target.dataset.agent, enabled: e.target.checked });
      });
      list.appendChild(item);
    }
  } catch (e) {
    list.innerHTML = `<div class="agent-item loading">Error: ${e}</div>`;
  }
}

async function loadKeys() {
  try {
    apiKeys = await invoke('get_api_keys');
    const xaiInput = document.getElementById('xai-key');
    const openaiInput = document.getElementById('openai-key');
    if (apiKeys.XAI_API_KEY && !apiKeys.XAI_API_KEY.includes('HIER')) {
      xaiInput.value = apiKeys.XAI_API_KEY;
    }
    if (apiKeys.OPENAI_API_KEY && !apiKeys.OPENAI_API_KEY.includes('HIER')) {
      openaiInput.value = apiKeys.OPENAI_API_KEY;
    }
  } catch {}
}

async function loadHookStatus() {
  try {
    const active = await invoke('get_hook_status');
    const el = document.getElementById('hook-status');
    el.innerHTML = `
      <span class="dot ${active ? 'dot-on' : 'dot-off'}"></span>
      <span>${active ? 'Active' : 'Not installed'}</span>
    `;
  } catch {}
}

async function saveKeys() {
  const xai = document.getElementById('xai-key').value.trim();
  const openai = document.getElementById('openai-key').value.trim();
  const msg = document.getElementById('save-msg');
  try {
    await invoke('save_api_keys', { xaiKey: xai, openaiKey: openai });
    apiKeys.XAI_API_KEY = xai;
    apiKeys.OPENAI_API_KEY = openai;
    msg.textContent = 'Saved!';
    setTimeout(() => { msg.textContent = ''; }, 2000);
    await loadAgents();
  } catch (e) {
    msg.style.color = 'var(--error)';
    msg.textContent = 'Error: ' + e;
  }
}

function setLoading(agent, loading) {
  const el = document.getElementById(`result-${agent}`);
  if (loading) {
    el.innerHTML = '<span class="loading-pulse">Thinking</span>';
  }
}

function setResult(agent, content, error) {
  const el = document.getElementById(`result-${agent}`);
  if (error) {
    el.innerHTML = `<span class="error-text">Error: ${error}</span>`;
  } else {
    el.textContent = content;
  }
}

async function sendPrompt() {
  const prompt = document.getElementById('prompt').value.trim();
  if (!prompt) return;

  const btn = document.getElementById('send-btn');
  const label = document.getElementById('send-label');
  const spinner = document.getElementById('send-spinner');

  btn.disabled = true;
  label.classList.add('hidden');
  spinner.classList.remove('hidden');

  setLoading('grok', true);
  setLoading('openai', true);

  const xaiKey = apiKeys.XAI_API_KEY || document.getElementById('xai-key').value.trim();
  const openaiKey = apiKeys.OPENAI_API_KEY || document.getElementById('openai-key').value.trim();

  const [grokRes, openaiRes] = await Promise.allSettled([
    invoke('ask_grok', { prompt, apiKey: xaiKey }),
    invoke('ask_openai', { prompt, apiKey: openaiKey }),
  ]);

  if (grokRes.status === 'fulfilled') {
    setResult('grok', grokRes.value.content, grokRes.value.error);
  } else {
    setResult('grok', '', grokRes.reason);
  }

  if (openaiRes.status === 'fulfilled') {
    setResult('openai', openaiRes.value.content, openaiRes.value.error);
  } else {
    setResult('openai', '', openaiRes.reason);
  }

  btn.disabled = false;
  label.classList.remove('hidden');
  spinner.classList.add('hidden');
}

window.addEventListener('DOMContentLoaded', () => {
  loadAgents();
  loadKeys();
  loadHookStatus();

  document.getElementById('save-keys').addEventListener('click', saveKeys);

  document.getElementById('send-btn').addEventListener('click', sendPrompt);

  document.getElementById('prompt').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendPrompt();
  });
});
