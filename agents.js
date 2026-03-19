#!/usr/bin/env node
// Steuerung der AI-Agents: node agents.js [agent] [on|off]
// Beispiele:
//   node agents.js              -> Status anzeigen
//   node agents.js grok off     -> Grok deaktivieren
//   node agents.js grok on      -> Grok aktivieren
//   node agents.js chatgpt on   -> ChatGPT aktivieren (braucht OPENAI_API_KEY in settings.json)

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude');

const AGENTS = {
  grok:    { label: 'Grok (xAI)',     envKey: 'XAI_API_KEY',    script: 'grok_hook.js' },
  openai: { label: 'ChatGPT (OpenAI)', envKey: 'OPENAI_API_KEY', script: 'openai_hook.js' },
};

const [,, agentArg, actionArg] = process.argv;

function flagPath(name) {
  return path.join(CLAUDE_DIR, `.${name}-enabled`);
}

function isEnabled(name) {
  return fs.existsSync(flagPath(name));
}

function hasKey(envKey) {
  // Check settings.json for the env key
  try {
    const settings = JSON.parse(fs.readFileSync(path.join(CLAUDE_DIR, 'settings.json'), 'utf8'));
    return !!(settings.env && settings.env[envKey]);
  } catch { return false; }
}

if (!agentArg) {
  console.log('\nAI Agents Status:');
  console.log('─────────────────────────────────────');
  for (const [name, info] of Object.entries(AGENTS)) {
    const status  = isEnabled(name) ? '✓ aktiv  ' : '✗ inaktiv';
    const keyInfo = hasKey(info.envKey) ? '(API Key vorhanden)' : '(kein API Key)';
    console.log(`  ${status}  ${info.label.padEnd(20)} ${keyInfo}`);
  }
  console.log('─────────────────────────────────────');
  console.log('\nBefehle:');
  console.log('  node ~/.claude/agents.js <agent> on   -> aktivieren');
  console.log('  node ~/.claude/agents.js <agent> off  -> deaktivieren');
  console.log('\nVerfügbare Agents:', Object.keys(AGENTS).join(', '));
  process.exit(0);
}

// Normalize: chatgpt = openai
const name = agentArg === 'chatgpt' ? 'openai' : agentArg;

if (!AGENTS[name]) {
  console.error(`Unbekannter Agent: ${agentArg}`);
  console.error('Verfügbar:', Object.keys(AGENTS).join(', '));
  process.exit(1);
}

const action = (actionArg || '').toLowerCase();

if (action === 'on') {
  fs.writeFileSync(flagPath(name), '');
  console.log(`✓ ${AGENTS[name].label} aktiviert`);
  if (!hasKey(AGENTS[name].envKey)) {
    console.log(`  Tipp: Füge ${AGENTS[name].envKey} in ~/.claude/settings.json unter "env" hinzu`);
  }
} else if (action === 'off') {
  if (fs.existsSync(flagPath(name))) {
    fs.unlinkSync(flagPath(name));
    console.log(`✗ ${AGENTS[name].label} deaktiviert`);
  } else {
    console.log(`${AGENTS[name].label} war bereits inaktiv`);
  }
} else {
  console.log(`Aktuell: ${AGENTS[name].label} ist ${isEnabled(name) ? 'aktiv' : 'inaktiv'}`);
  console.log(`Nutze: node ~/.claude/agents.js ${name} on|off`);
}
