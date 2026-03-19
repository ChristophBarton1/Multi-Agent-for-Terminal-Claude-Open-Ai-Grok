// Dispatcher: ruft alle aktivierten AI-Agents PARALLEL auf und kombiniert die Antworten
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CLAUDE_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude');

const AGENTS = [
  { name: 'grok',   script: 'grok_hook.js',   label: 'Grok' },
  { name: 'openai', script: 'openai_hook.js',  label: 'ChatGPT' },
];

function runAgent(scriptPath, input) {
  return new Promise((resolve) => {
    const proc = spawn('node', [scriptPath], { env: process.env });
    let stdout = '';
    proc.stdout.on('data', d => stdout += d);
    proc.on('close', () => {
      try {
        const out = JSON.parse(stdout.trim());
        resolve(out.systemMessage || null);
      } catch {
        resolve(null);
      }
    });
    proc.on('error', () => resolve(null));
    setTimeout(() => { proc.kill(); resolve(null); }, 25000);
    proc.stdin.write(input);
    proc.stdin.end();
  });
}

let input = '';
process.stdin.on('data', c => input += c);
process.stdin.on('end', async () => {
  const activeAgents = AGENTS.filter(agent => {
    return fs.existsSync(path.join(CLAUDE_DIR, `.${agent.name}-enabled`)) &&
           fs.existsSync(path.join(CLAUDE_DIR, agent.script));
  });

  const results = await Promise.all(
    activeAgents.map(agent => runAgent(path.join(CLAUDE_DIR, agent.script), input))
  );

  const messages = results.filter(Boolean);
  if (messages.length > 0) {
    console.log(JSON.stringify({ systemMessage: messages.join('\n\n') }));
  }
});
