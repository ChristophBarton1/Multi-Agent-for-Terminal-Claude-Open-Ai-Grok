// GROK Task Runner — läuft in eigenem Terminal
const https = require('https');
const fs = require('fs');

const task = process.argv[2] || '';
const outputFile = process.argv[3] || '';

console.log('\n╔════════════════════════════════╗');
console.log('║         GROK  (xAI)            ║');
console.log('╚════════════════════════════════╝');
console.log(`\nTask: "${task}"`);
console.log('\n⏳ Grok denkt nach...\n');

const apiKey = process.env.XAI_API_KEY || '';
const body = JSON.stringify({
  model: 'grok-3-mini-fast',
  messages: [
    { role: 'system', content: 'Du bist ein präziser Analyst. Antworte strukturiert und prägnant auf Deutsch.' },
    { role: 'user', content: task }
  ],
  max_tokens: 800
});

const req = https.request({
  hostname: 'api.x.ai',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, res => {
  let raw = '';
  res.on('data', d => raw += d);
  res.on('end', () => {
    try {
      const result = JSON.parse(raw);
      const response = result.choices[0].message.content;
      console.log('═══════════════════════════════');
      console.log('GROK ANTWORT:');
      console.log('═══════════════════════════════');
      console.log(response);
      if (outputFile) {
        fs.writeFileSync(outputFile, response);
        console.log(`\n✓ Ergebnis gespeichert → ${outputFile}`);
      }
    } catch(e) {
      console.log('Fehler:', e.message, raw);
    }
  });
});

req.on('error', e => console.log('Fehler:', e.message));
req.setTimeout(60000, () => { req.destroy(); console.log('Timeout!'); });
req.write(body);
req.end();
