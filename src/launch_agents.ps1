# Multi-Agent Terminal Launcher (Grok only)
param([string]$Task = "Analysiere online-lernen.live und gib Verbesserungsvorschlaege")

$claudeDir = "C:\Users\cbarton\.claude"
$resultsDir = "$claudeDir\task_results"
if (!(Test-Path $resultsDir)) { New-Item -ItemType Directory -Path $resultsDir | Out-Null }

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$grokOut = "$resultsDir\grok_$ts.txt"

Write-Host ""
Write-Host "MULTI-AGENT SYSTEM STARTET" -ForegroundColor Cyan
Write-Host "Task: $Task" -ForegroundColor Yellow
Write-Host ""

Start-Process "wt.exe" -ArgumentList @(
    "new-tab", "--title", "GROK",
    "--", "cmd", "/k", """$claudeDir\run_grok.bat"" ""$Task"" ""$grokOut"""
    ";", "split-pane", "-H",
    "--title", "CLAUDE Collector",
    "--", "cmd", "/k", """$claudeDir\run_collector_grok.bat"" ""$grokOut"" ""$Task"""
)

Write-Host "Terminals gestartet!" -ForegroundColor Green
