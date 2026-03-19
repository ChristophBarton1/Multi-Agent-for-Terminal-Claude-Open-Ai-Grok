// Claude Collector — wartet auf Grok Ergebnis
const fs = require('fs');

const grokFile = process.argv[2];
const task     = process.argv[3] || '';

console.log('\n╔════════════════════════════════╗');
console.log('║    CLAUDE — Collector          ║');
console.log('╚════════════════════════════════╝');
console.log(`\nTask: "${task}"`);
console.log('\n⏳ Warte auf Grok...\n');

function waitForFile(filepath, maxWait = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
        resolve(fs.readFileSync(filepath, 'utf8'));
      } else if (Date.now() - start > maxWait) {
        reject('Timeout');
      } else {
        setTimeout(check, 1000);
      }
    };
    check();
  });
}

async function collect() {
  try {
    const grokResult = await waitForFile(grokFile);
    console.log('✓ Grok fertig!\n');
    console.log('═══════════════════════════════════════');
    console.log('  GROK ERGEBNIS:');
    console.log('═══════════════════════════════════════');
    console.log(grokResult);
    console.log('\n═══════════════════════════════════════');
    console.log('  ✓ Bereit für Claude finale Analyse!');
    console.log('═══════════════════════════════════════');
    fs.unlinkSync(grokFile);
  } catch(e) {
    console.log('Fehler:', e);
  }
}

collect();
