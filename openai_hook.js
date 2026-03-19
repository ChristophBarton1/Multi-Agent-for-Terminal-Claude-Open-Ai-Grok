const https = require('https');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  let data;
  try { data = JSON.parse(input); } catch { process.exit(0); }

  const prompt = data.prompt || data.message || data.content || '';
  if (!prompt) process.exit(0);

  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) process.exit(0);

  const body = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 400
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const req = https.request(options, res => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(raw);
        const response = result.choices[0].message.content;
        console.log(JSON.stringify({ systemMessage: `=== ChatGPT ===\n${response}\n===============` }));
      } catch (e) {
        console.log(JSON.stringify({ systemMessage: `ChatGPT Fehler: ${e.message}` }));
      }
    });
  });

  req.on('error', e => console.log(JSON.stringify({ systemMessage: `ChatGPT Fehler: ${e.message}` })));
  req.setTimeout(30000, () => { req.destroy(); console.log(JSON.stringify({ systemMessage: 'ChatGPT Timeout' })); });
  req.write(body);
  req.end();
});
