// VOLLSTÄNDIGER AUTO-FLOW:
// 1. Grok Fenster öffnen
// 2. Auf Ergebnis warten
// 3. Excel automatisch erstellen
// Usage: node run_full_task.js "Dein Task"

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude');
const RESULTS_DIR = path.join(CLAUDE_DIR, 'task_results');
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

const task = process.argv.slice(2).join(' ') || 'Analysiere online-lernen.live';
const ts = Date.now();
const grokOut = path.join(RESULTS_DIR, `grok_${ts}.txt`);

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║         AUTO MULTI-AGENT FLOW                ║');
console.log('╠══════════════════════════════════════════════╣');
console.log(`║ Task: ${task.substring(0, 40).padEnd(40)} ║`);
console.log('╚══════════════════════════════════════════════╝\n');

// SCHRITT 1: Grok starten
console.log('⏳ [1/3] Starte GROK in eigenem Fenster...');
execSync(`powershell -Command "Start-Process cmd -ArgumentList '/k node \\"${path.join(CLAUDE_DIR, 'grok_task_runner.js')}\\" \\"${task}\\" \\"${grokOut}\\""'`, { shell: true });
console.log('   ✓ GROK läuft!\n');

// SCHRITT 2: Warten bis Grok fertig ist
console.log('⏳ [2/3] Warte auf Grok-Ergebnis...');
const maxWait = 90;
let waited = 0;
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
while (waited < maxWait) {
  if (fs.existsSync(grokOut) && fs.statSync(grokOut).size > 10) break;
  process.stdout.write(`\r   ⏳ ${waited}s gewartet...`);
  sleep(1000);
  waited++;
}

if (!fs.existsSync(grokOut) || fs.statSync(grokOut).size < 10) {
  console.log('\n   ✗ Timeout — Grok hat nicht geantwortet');
  process.exit(1);
}

console.log(`\n   ✓ Grok fertig nach ${waited}s!\n`);

// SCHRITT 3: Excel erstellen
console.log('⏳ [3/3] Erstelle Excel automatisch...');
execSync(`node "${path.join(CLAUDE_DIR, 'auto_excel.js')}" "${grokOut}" "${task}"`, { shell: true, stdio: 'inherit' });
console.log('\n🎉 FERTIG! Alles automatisch erledigt.');
