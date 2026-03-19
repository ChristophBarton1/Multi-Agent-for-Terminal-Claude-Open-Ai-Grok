// Task Hook — erkennt "start task", startet Grok, gibt Dateipfad zurück
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', c => input += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const isTaskCommand = /^(start|starte)\s+(task|analyse|aufgabe)\s+/i.test(data.prompt || '');
    if (!isTaskCommand) return process.exit(0);

    const task = (data.prompt || '').replace(/^(start|starte)\s+(task|analyse|aufgabe)\s+/i, '').trim();
    if (!task) return process.exit(0);

    const CLAUDE_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude');
    const RESULTS_DIR = path.join(CLAUDE_DIR, 'task_results');
    if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

    const ts = Date.now();
    const grokOut = path.join(RESULTS_DIR, `grok_${ts}.txt`);

    // Task & Pfad speichern damit Claude sie findet
    fs.writeFileSync(path.join(RESULTS_DIR, 'latest_task.txt'), task);
    fs.writeFileSync(path.join(RESULTS_DIR, 'latest_grok_path.txt'), grokOut);

    // Grok Fenster öffnen
    const grokCmd = `powershell -Command "Start-Process cmd -ArgumentList '/k node \\"${path.join(CLAUDE_DIR, 'grok_task_runner.js')}\\" \\"${task}\\" \\"${grokOut}\\""'`;
    execSync(grokCmd, { shell: true });

    console.log(JSON.stringify({
      systemMessage: `🚀 MULTI-AGENT TASK GESTARTET\n📋 Task: "${task}"\n🤖 GROK läuft in eigenem Fenster\n📁 Ergebnis-Pfad: ${grokOut}\n\n→ Claude liest Ergebnis automatisch ein wenn Grok fertig ist!`
    }));

  } catch(e) {
    process.exit(0);
  }
});
