// Multi-Agent Task Runner
// Usage: node multi_agent_task.js "Analysiere online-lernen.live"
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude');
const RESULTS_DIR = path.join(CLAUDE_DIR, 'task_results');
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR);

const task = process.argv[2] || 'Keine Aufgabe angegeben';
const timestamp = Date.now();

// Ergebnis-Dateien
const grokResult   = path.join(RESULTS_DIR, `grok_${timestamp}.txt`);
const chatgptResult = path.join(RESULTS_DIR, `chatgpt_${timestamp}.txt`);

// Task-Skripte für jeden Agent
const grokScript = path.join(CLAUDE_DIR, 'grok_task_runner.js');
const chatgptScript = path.join(CLAUDE_DIR, 'chatgpt_task_runner.js');

console.log('\n╔════════════════════════════════════════╗');
console.log('║     MULTI-AGENT TERMINAL SYSTEM        ║');
console.log('╚════════════════════════════════════════╝');
console.log(`\nTask: "${task}"`);
console.log('\nÖffne Split-Terminals...\n');

// Windows Terminal mit 3 Split-Panes öffnen
// Pane 1 (links): Grok
// Pane 2 (rechts oben): ChatGPT
// Pane 3 (rechts unten): Claude Ergebnis
const wtCommand = [
  'new-tab',
  '--title', 'GROK',
  'cmd', '/k', `node "${grokScript}" "${task}" "${grokResult}" & pause`,
  ';', 'split-pane', '-H',
  '--title', 'CHATGPT',
  'cmd', '/k', `node "${chatgptScript}" "${task}" "${chatgptResult}" & pause`,
  ';', 'split-pane', '-V',
  '--title', 'CLAUDE RESULTS',
  'cmd', '/k', `node "${path.join(CLAUDE_DIR, 'claude_collector.js')}" "${grokResult}" "${chatgptResult}" "${task}" & pause`
].join(' ');

spawn('wt', wtCommand.split(' '), { shell: true, detached: true });
console.log('✓ Terminals geöffnet!');
