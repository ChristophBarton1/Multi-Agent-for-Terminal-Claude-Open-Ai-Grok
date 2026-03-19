# Multi-Agent Terminal System — Claude + OpenAI + Grok

Ein Terminal-System das **Claude, ChatGPT und Grok gleichzeitig** auf eine Aufgabe ansetzt und die Ergebnisse kombiniert. Claude fungiert dabei als zentraler Orchestrator, während Grok und ChatGPT parallel als Kontext-Lieferanten arbeiten.

---

## Wie es funktioniert

```
User-Prompt (in Claude Terminal)
        │
        ▼
   agents_hook.js  ←── UserPromptSubmit Hook
        │
   ┌────┴────┐
   ▼         ▼
grok_hook  openai_hook   (parallel)
   │         │
   └────┬────┘
        ▼
 systemMessage an Claude
        │
        ▼
  Claude antwortet (mit Kontext aller 3 LLMs)
```

Bei jedem Prompt in Claude werden Grok und ChatGPT automatisch im Hintergrund gefragt. Ihre Antworten werden als `systemMessage` an Claude übergeben — Claude sieht also, was die anderen sagen, und kann darauf aufbauen.

**Alternativ: Split-Terminal Modus**
Öffnet 3 separate Terminals (Windows Terminal Panes) mit Grok, ChatGPT und Claude als Collector — gut für Aufgaben die länger dauern.

---

## Setup

### 1. Repository klonen

```bash
git clone https://github.com/ChristophBarton1/Multi-Agent-for-Terminal-Claude-Open-Ai-Grok.git
```

### 2. Dateien in Claude-Verzeichnis kopieren

```bash
copy *.js %USERPROFILE%\.claude\
copy *.py %USERPROFILE%\.claude\
copy *.bat %USERPROFILE%\.claude\
copy *.ps1 %USERPROFILE%\.claude\
```

### 3. settings.json konfigurieren

Kopiere `settings.template.json` nach `%USERPROFILE%\.claude\settings.json` und trage deine API Keys ein:

```json
{
  "env": {
    "XAI_API_KEY": "xai-...",
    "OPENAI_API_KEY": "sk-..."
  },
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node C:/Users/DEIN_USERNAME/.claude/agents_hook.js",
            "timeout": 35,
            "statusMessage": "Grok & ChatGPT denken nach..."
          }
        ]
      }
    ]
  }
}
```

> **Wichtig:** Ersetze `DEIN_USERNAME` mit deinem Windows-Benutzernamen.

### 4. Dependencies installieren

```bash
npm install
```

### 5. Agents aktivieren

```bash
node ~/.claude/agents.js              # Status anzeigen
node ~/.claude/agents.js grok on      # Grok aktivieren
node ~/.claude/agents.js chatgpt on   # ChatGPT aktivieren
```

---

## Nutzung

### Modus 1: Hook (automatisch im Hintergrund)

Einfach Claude Code normal nutzen — bei jedem Prompt werden Grok & ChatGPT automatisch gefragt und ihre Antworten als Kontext an Claude weitergegeben.

```
Status: "Grok & ChatGPT denken nach..."  ← erscheint unten in Claude
```

### Modus 2: Multi-Agent Task (Split-Terminals)

```bash
node multi_agent_task.js "Analysiere meine Website und gib Verbesserungsvorschläge"
```

Öffnet automatisch 3 Terminals in Windows Terminal:
- Links: Grok
- Rechts oben: ChatGPT
- Rechts unten: Claude Collector (wartet, kombiniert, präsentiert)

### Modus 3: PowerShell Launcher (Grok + Claude)

```powershell
.\launch_agents.ps1 -Task "Deine Aufgabe hier"
```

### Agents einzeln testen

```bash
node ~/.claude/grok_task_runner.js "Was ist der beste Tech Stack 2025?"
node ~/.claude/chatgpt_task_runner.js "Was ist der beste Tech Stack 2025?"
```

---

## Agents verwalten

```bash
node ~/.claude/agents.js              # Status aller Agents
node ~/.claude/agents.js grok on      # Grok aktivieren
node ~/.claude/agents.js grok off     # Grok deaktivieren
node ~/.claude/agents.js chatgpt on   # ChatGPT aktivieren
node ~/.claude/agents.js chatgpt off  # ChatGPT deaktivieren
```

---

## Voraussetzungen

- [Claude Code](https://claude.ai/code) installiert
- [Node.js](https://nodejs.org/) ≥ 18
- [Windows Terminal](https://aka.ms/terminal) (für Split-Terminal Modus)
- API Keys: [xAI (Grok)](https://console.x.ai/) und/oder [OpenAI](https://platform.openai.com/)

---

## Dateistruktur

| Datei | Beschreibung |
|-------|-------------|
| `agents_hook.js` | Hook-Dispatcher — ruft alle aktiven Agents parallel auf |
| `agents.js` | CLI zum Aktivieren/Deaktivieren von Agents |
| `grok_hook.js` | Grok-Integration für den Hook-Modus |
| `grok_hook.py` | Python-Version der Grok-Integration |
| `openai_hook.js` | ChatGPT-Integration für den Hook-Modus |
| `grok_task_runner.js` | Grok im Task/Split-Terminal Modus |
| `chatgpt_task_runner.js` | ChatGPT im Task/Split-Terminal Modus |
| `claude_collector.js` | Wartet auf alle Agents, kombiniert Ergebnisse |
| `claude_collector_grok.js` | Collector nur für Grok |
| `multi_agent_task.js` | Startet 3-Split-Terminal Session |
| `launch_agents.ps1` | PowerShell Launcher (Grok + Claude) |
| `start_task.js` | Einzelner Task-Starter |
| `run_full_task.js` | Vollständiger Task-Runner |
| `auto_excel.js` | Excel-Output für Ergebnisse |
| `settings.template.json` | Konfigurationsvorlage |
| `task_hook.js` | Task-Hook Hilfsfunktionen |

---

## Lizenz

MIT
