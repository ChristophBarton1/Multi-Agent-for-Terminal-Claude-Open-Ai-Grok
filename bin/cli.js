#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLAUDE_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude');
const SRC_DIR = path.join(__dirname, '..', 'src');

const HOOK_FILES = [
  'agents_hook.js',
  'grok_hook.js',
  'openai_hook.js',
  'task_hook.js',
  'agents.js',
  'grok_hook.py',
];

const TASK_FILES = [
  'grok_task_runner.js',
  'chatgpt_task_runner.js',
  'claude_collector.js',
  'claude_collector_grok.js',
  'multi_agent_task.js',
  'start_task.js',
  'run_full_task.js',
  'auto_excel.js',
];

const ALL_FILES = [...HOOK_FILES, ...TASK_FILES];

const [,, command, ...args] = process.argv;

function printHelp() {
  console.log(`
claude-multi-agent — Run Claude, ChatGPT & Grok in parallel

Usage:
  npx claude-multi-agent install          Install hooks into ~/.claude/
  npx claude-multi-agent uninstall        Remove hooks from ~/.claude/
  npx claude-multi-agent agents           Show agent status
  npx claude-multi-agent agents grok on   Enable Grok
  npx claude-multi-agent agents grok off  Disable Grok
  npx claude-multi-agent agents chatgpt on
  npx claude-multi-agent task "..."       Run a multi-agent task (split terminals)
  `);
}

function install() {
  console.log('\n  Installing claude-multi-agent...\n');

  if (!fs.existsSync(CLAUDE_DIR)) {
    fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  }

  // Copy source files
  let copied = 0;
  for (const file of ALL_FILES) {
    const src = path.join(SRC_DIR, file);
    const dest = path.join(CLAUDE_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ ${file}`);
      copied++;
    }
  }

  // Copy bat files
  const batFiles = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.bat') || f.endsWith('.ps1'));
  for (const file of batFiles) {
    fs.copyFileSync(path.join(SRC_DIR, file), path.join(CLAUDE_DIR, file));
    console.log(`  ✓ ${file}`);
    copied++;
  }

  // Patch settings.json
  const settingsPath = path.join(CLAUDE_DIR, 'settings.json');
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch {}
  }

  const hookCommand = `node ${path.join(CLAUDE_DIR, 'agents_hook.js').replace(/\\/g, '/')}`;

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.UserPromptSubmit) settings.hooks.UserPromptSubmit = [];

  const alreadyInstalled = settings.hooks.UserPromptSubmit.some(h =>
    h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('agents_hook.js'))
  );

  if (!alreadyInstalled) {
    settings.hooks.UserPromptSubmit.push({
      hooks: [{
        type: 'command',
        command: hookCommand,
        timeout: 35,
        statusMessage: 'Grok & ChatGPT thinking...'
      }]
    });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log('\n  ✓ Hook added to ~/.claude/settings.json');
  } else {
    console.log('\n  ✓ Hook already present in settings.json');
  }

  // Check for API keys
  const hasXai = settings.env && settings.env.XAI_API_KEY && !settings.env.XAI_API_KEY.includes('HIER');
  const hasOpenAi = settings.env && settings.env.OPENAI_API_KEY && !settings.env.OPENAI_API_KEY.includes('HIER');

  console.log('\n  ─────────────────────────────────────────');
  console.log(`  Grok API Key:   ${hasXai ? '✓ found' : '✗ missing — add XAI_API_KEY to ~/.claude/settings.json'}`);
  console.log(`  OpenAI API Key: ${hasOpenAi ? '✓ found' : '✗ missing — add OPENAI_API_KEY to ~/.claude/settings.json'}`);
  console.log('  ─────────────────────────────────────────');

  if (!hasXai || !hasOpenAi) {
    console.log(`
  Add your keys to ~/.claude/settings.json:
  {
    "env": {
      "XAI_API_KEY": "xai-...",
      "OPENAI_API_KEY": "sk-..."
    }
  }
`);
  }

  console.log('  Then activate agents:');
  console.log('    node ~/.claude/agents.js grok on');
  console.log('    node ~/.claude/agents.js chatgpt on\n');
  console.log(`  Done! ${copied} files installed.\n`);
}

function uninstall() {
  console.log('\n  Uninstalling claude-multi-agent...\n');

  for (const file of ALL_FILES) {
    const dest = path.join(CLAUDE_DIR, file);
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
      console.log(`  ✓ removed ${file}`);
    }
  }

  // Remove hook from settings.json
  const settingsPath = path.join(CLAUDE_DIR, 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (settings.hooks && settings.hooks.UserPromptSubmit) {
        settings.hooks.UserPromptSubmit = settings.hooks.UserPromptSubmit.filter(h =>
          !(h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('agents_hook.js')))
        );
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        console.log('  ✓ Hook removed from settings.json');
      }
    } catch {}
  }

  console.log('\n  Done.\n');
}

function runAgents() {
  const agentsScript = path.join(CLAUDE_DIR, 'agents.js');
  if (!fs.existsSync(agentsScript)) {
    console.error('  Not installed. Run: npx claude-multi-agent install');
    process.exit(1);
  }
  try {
    execSync(`node "${agentsScript}" ${args.join(' ')}`, { stdio: 'inherit' });
  } catch {}
}

function runTask() {
  const task = args.join(' ');
  if (!task) {
    console.error('  Usage: npx claude-multi-agent task "Your task here"');
    process.exit(1);
  }
  const taskScript = path.join(CLAUDE_DIR, 'start_task.js');
  if (!fs.existsSync(taskScript)) {
    console.error('  Not installed. Run: npx claude-multi-agent install');
    process.exit(1);
  }
  execSync(`node "${taskScript}" "${task}"`, { stdio: 'inherit' });
}

switch (command) {
  case 'install':    install();   break;
  case 'uninstall':  uninstall(); break;
  case 'agents':     runAgents(); break;
  case 'task':       runTask();   break;
  default:           printHelp(); break;
}
