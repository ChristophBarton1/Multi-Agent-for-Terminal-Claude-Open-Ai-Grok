#!/usr/bin/env python3
import json
import sys
import urllib.request
import os

try:
    data = json.loads(sys.stdin.read())
except Exception:
    sys.exit(0)

prompt = data.get('prompt') or data.get('message') or data.get('content') or ''
if not prompt:
    sys.exit(0)

api_key = os.environ.get('XAI_API_KEY', '')
if not api_key:
    sys.exit(0)

payload = json.dumps({
    "model": "grok-4-0709",
    "messages": [{"role": "user", "content": prompt}]
}).encode()

req = urllib.request.Request(
    "https://api.x.ai/v1/chat/completions",
    data=payload,
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
)

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
        grok_response = result['choices'][0]['message']['content']
        print(json.dumps({"systemMessage": f"=== Grok ===\n{grok_response}\n============"}))
except Exception as e:
    print(json.dumps({"systemMessage": f"Grok Fehler: {str(e)}"}))
