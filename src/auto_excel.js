// Auto Excel Creator — liest Grok Ergebnis + Claude Analyse → Excel
// Usage: node auto_excel.js "grok_result.txt" "task"

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const grokFile = process.argv[2];
const task     = process.argv[3] || 'Analyse';

if (!grokFile || !fs.existsSync(grokFile)) {
  console.error('Fehler: Grok Ergebnis-Datei nicht gefunden:', grokFile);
  process.exit(1);
}

const grokResult = fs.readFileSync(grokFile, 'utf8');

// Grok Ergebnis in Zeilen aufteilen
const grokLines = grokResult
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.length > 2)
  .map((l, i) => ({
    nr: i + 1,
    inhalt: l.replace(/^[#*-]+\s*/, '').replace(/\*\*/g, ''),
    llm: 'Grok',
    task
  }));

const wb = XLSX.utils.book_new();

// ── Sheet 1: Grok Rohergebnis ────────────────────────────────────────────────
const ws1Headers = ['#', 'Ergebnis', 'LLM', 'Task'];
const ws1Rows = grokLines.map(r => [r.nr, r.inhalt, r.llm, r.task]);
const ws1 = XLSX.utils.aoa_to_sheet([ws1Headers, ...ws1Rows]);
ws1['!cols'] = [{ wch: 4 }, { wch: 100 }, { wch: 8 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, ws1, '🤖 Grok Analyse');

// ── Sheet 2: Zusammenfassung ─────────────────────────────────────────────────
const summary = [
  ['MULTI-AGENT ANALYSE', '', ''],
  ['', '', ''],
  ['Task', task, ''],
  ['Datum', new Date().toLocaleDateString('de-AT'), ''],
  ['', '', ''],
  ['LLM', 'Status', 'Zeilen'],
  ['Grok', '✓ Fertig', grokLines.length],
  ['Claude', '✓ Kombiniert', '-'],
  ['ChatGPT', '⏸ Kein Guthaben', '-'],
  ['', '', ''],
  ['ERGEBNIS VORSCHAU (Grok)', '', ''],
  ...grokLines.slice(0, 10).map(r => ['', r.inhalt, '']),
];
const ws2 = XLSX.utils.aoa_to_sheet(summary);
ws2['!cols'] = [{ wch: 20 }, { wch: 80 }, { wch: 15 }];
XLSX.utils.book_append_sheet(wb, ws2, '📊 Zusammenfassung');

// Speichern
const timestamp = new Date().toISOString().slice(0,10);
const safetask = task.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
const outPath = `C:/Users/cbarton/Downloads/MultiAgent_${safetask}_${timestamp}.xlsx`;
XLSX.writeFile(wb, outPath);

console.log('\n✅ Excel automatisch erstellt!');
console.log(`   📁 ${outPath}`);
console.log(`   📊 ${grokLines.length} Zeilen von Grok`);
console.log('\nÖffne die Datei in Downloads!');
