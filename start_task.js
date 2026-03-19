// Multi-Agent Launcher — öffnet echte parallele CMD Fenster
// Usage: node start_task.js "Dein Task hier"

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = 'C:\\Users\\cbarton\\.claude';
const RESULTS_DIR = path.join(CLAUDE_DIR, 'task_results');
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

const task = process.argv.slice(2).join(' ') || 'Keine Aufgabe';
const ts = Date.now();
const grokOut = path.join(RESULTS_DIR, `grok_${ts}.txt`);

// Task in Datei speichern damit Collector ihn findet
fs.writeFileSync(path.join(RESULTS_DIR, 'current_task.txt'), task);
fs.writeFileSync(path.join(RESULTS_DIR, 'grok_outpath.txt'), grokOut);

console.log('\n╔══════════════════════════════════════════╗');
console.log('║        MULTI-AGENT SYSTEM START          ║');
console.log('╠══════════════════════════════════════════╣');
console.log(`║  Task: ${task.substring(0, 36).padEnd(36)} ║`);
console.log('╚══════════════════════════════════════════╝\n');

// GROK Fenster öffnen
console.log('  [1/2] Öffne GROK Terminal...');
execSync(`powershell -Command "Start-Process cmd -ArgumentList '/k node ${CLAUDE_DIR}\\grok_task_runner.js \\"${task.replace(/"/g, '\\"')}\\" \\"${grokOut}\\""'`);

// COLLECTOR Fenster öffnen
console.log('  [2/2] Öffne CLAUDE Collector Terminal...');
execSync(`powershell -Command "Start-Process cmd -ArgumentList '/k node ${CLAUDE_DIR}\\claude_collector_grok.js \\"${grokOut}\\" \\"${task.replace(/"/g, '\\"')}\\""'`);

console.log('\n  ✓ Beide Terminals geöffnet!');
console.log('  ✓ GROK läuft parallel');
console.log('  ✓ Collector wartet automatisch auf Grok\n');
