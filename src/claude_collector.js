// Claude Collector — wartet auf Grok & ChatGPT, kombiniert Ergebnisse
const fs = require('fs');

const grokFile   = process.argv[2];
const chatgptFile = process.argv[3];
const task       = process.argv[4] || '';

console.log('\n╔════════════════════════════════╗');
console.log('║    CLAUDE — Ergebnis-Collector  ║');
console.log('╚════════════════════════════════╝');
console.log(`\nTask: "${task}"`);
console.log('\n⏳ Warte auf Grok & ChatGPT...\n');

function waitForFile(filepath, maxWait = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
        resolve(fs.readFileSync(filepath, 'utf8'));
      } else if (Date.now() - start > maxWait) {
        reject(`Timeout: ${filepath}`);
      } else {
        setTimeout(check, 1000);
      }
    };
    check();
  });
}

async function collect() {
  try {
    console.log('Warte auf Grok...');
    const grokResult = await waitForFile(grokFile);
    console.log('✓ Grok fertig!\n');

    console.log('Warte auf ChatGPT...');
    const chatgptResult = await waitForFile(chatgptFile);
    console.log('✓ ChatGPT fertig!\n');

    console.log('═══════════════════════════════════════════');
    console.log('  KOMBINIERTES ERGEBNIS (alle 3 LLMs)');
    console.log('═══════════════════════════════════════════\n');

    console.log('── GROK ──────────────────────────────────');
    console.log(grokResult);
    console.log('\n── CHATGPT ───────────────────────────────');
    console.log(chatgptResult);
    console.log('\n═══════════════════════════════════════════');
    console.log('  → Ergebnisse jetzt in Claude Terminal');
    console.log('     verfügbar für finale Analyse!');
    console.log('═══════════════════════════════════════════');

    // Aufräumen
    fs.unlinkSync(grokFile);
    fs.unlinkSync(chatgptFile);
  } catch(e) {
    console.log('Fehler:', e);
  }
}

collect();
