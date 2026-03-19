// Task Hook — erkennt "start task ..." und startet automatisch die Agents
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', c => input += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || '').toLowerCase().trim();

    // Erkennt: "start task", "starte task", "start analyse", etc.
    const isTaskCommand = /^(start|starte)\s+(task|analyse|aufgabe)\s+/i.test(data.prompt || '');
    if (!isTaskCommand) return process.exit(0);

    // Task extrahieren (alles nach "start task ")
    const task = (data.prompt || '').replace(/^(start|starte)\s+(task|analyse|aufgabe)\s+/i, '').trim();
    if (!task) return process.exit(0);

    const CLAUDE_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude');

    // Agents starten
    execSync(`node "${path.join(CLAUDE_DIR, 'start_task.js')}" "${task}"`, { shell: true });

    console.log(JSON.stringify({
      systemMessage: `🚀 Multi-Agent Task gestartet!\n📋 Task: "${task}"\n\n✓ GROK Terminal läuft\n✓ CLAUDE Collector wartet auf Ergebnisse\n\nSchau in die geöffneten Fenster!`
    }));
  } catch(e) {
    process.exit(0);
  }
});
