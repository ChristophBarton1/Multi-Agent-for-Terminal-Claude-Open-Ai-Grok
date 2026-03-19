use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

fn claude_dir() -> PathBuf {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_default();
    PathBuf::from(home).join(".claude")
}

fn settings_path() -> PathBuf {
    claude_dir().join("settings.json")
}

fn flag_path(agent: &str) -> PathBuf {
    claude_dir().join(format!(".{}-enabled", agent))
}

#[derive(Serialize, Deserialize, Clone)]
pub struct AgentStatus {
    name: String,
    label: String,
    enabled: bool,
    has_key: bool,
}

#[derive(Serialize, Deserialize)]
pub struct Settings {
    env: Option<HashMap<String, String>>,
}

#[derive(Serialize, Deserialize)]
pub struct AiResponse {
    agent: String,
    content: String,
    error: Option<String>,
}

#[tauri::command]
fn get_agents() -> Vec<AgentStatus> {
    let settings: Option<Settings> = fs::read_to_string(settings_path())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok());

    let env = settings.and_then(|s| s.env).unwrap_or_default();

    vec![
        AgentStatus {
            name: "grok".into(),
            label: "Grok (xAI)".into(),
            enabled: flag_path("grok").exists(),
            has_key: env.get("XAI_API_KEY").map(|k| !k.is_empty() && !k.contains("HIER")).unwrap_or(false),
        },
        AgentStatus {
            name: "openai".into(),
            label: "ChatGPT (OpenAI)".into(),
            enabled: flag_path("openai").exists(),
            has_key: env.get("OPENAI_API_KEY").map(|k| !k.is_empty() && !k.contains("HIER")).unwrap_or(false),
        },
    ]
}

#[tauri::command]
fn toggle_agent(name: String, enabled: bool) -> Result<(), String> {
    let path = flag_path(&name);
    if enabled {
        fs::write(&path, "").map_err(|e| e.to_string())?;
    } else if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn get_api_keys() -> HashMap<String, String> {
    let mut keys = HashMap::new();
    keys.insert("XAI_API_KEY".into(), String::new());
    keys.insert("OPENAI_API_KEY".into(), String::new());

    if let Ok(content) = fs::read_to_string(settings_path()) {
        if let Ok(settings) = serde_json::from_str::<Settings>(&content) {
            if let Some(env) = settings.env {
                for (k, v) in env {
                    if k == "XAI_API_KEY" || k == "OPENAI_API_KEY" {
                        keys.insert(k, v);
                    }
                }
            }
        }
    }
    keys
}

#[tauri::command]
fn save_api_keys(xai_key: String, openai_key: String) -> Result<(), String> {
    let path = settings_path();
    let mut json: serde_json::Value = if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    if json.get("env").is_none() {
        json["env"] = serde_json::json!({});
    }
    if !xai_key.is_empty() {
        json["env"]["XAI_API_KEY"] = serde_json::Value::String(xai_key);
    }
    if !openai_key.is_empty() {
        json["env"]["OPENAI_API_KEY"] = serde_json::Value::String(openai_key);
    }

    let dir = claude_dir();
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    fs::write(&path, serde_json::to_string_pretty(&json).unwrap()).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_hook_status() -> bool {
    if let Ok(content) = fs::read_to_string(settings_path()) {
        content.contains("agents_hook.js")
    } else {
        false
    }
}

#[tauri::command]
async fn ask_grok(prompt: String, api_key: String) -> AiResponse {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model": "grok-3-mini-fast",
        "messages": [{ "role": "user", "content": prompt }],
        "max_tokens": 600
    });

    match client
        .post("https://api.x.ai/v1/chat/completions")
        .bearer_auth(&api_key)
        .json(&body)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
    {
        Ok(res) => match res.json::<serde_json::Value>().await {
            Ok(json) => {
                let content = json["choices"][0]["message"]["content"]
                    .as_str()
                    .unwrap_or("No response")
                    .to_string();
                AiResponse { agent: "grok".into(), content, error: None }
            }
            Err(e) => AiResponse { agent: "grok".into(), content: String::new(), error: Some(e.to_string()) },
        },
        Err(e) => AiResponse { agent: "grok".into(), content: String::new(), error: Some(e.to_string()) },
    }
}

#[tauri::command]
async fn ask_openai(prompt: String, api_key: String) -> AiResponse {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model": "gpt-4o-mini",
        "messages": [{ "role": "user", "content": prompt }],
        "max_tokens": 600
    });

    match client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(&api_key)
        .json(&body)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
    {
        Ok(res) => match res.json::<serde_json::Value>().await {
            Ok(json) => {
                let content = json["choices"][0]["message"]["content"]
                    .as_str()
                    .unwrap_or("No response")
                    .to_string();
                AiResponse { agent: "openai".into(), content, error: None }
            }
            Err(e) => AiResponse { agent: "openai".into(), content: String::new(), error: Some(e.to_string()) },
        },
        Err(e) => AiResponse { agent: "openai".into(), content: String::new(), error: Some(e.to_string()) },
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_agents,
            toggle_agent,
            get_api_keys,
            save_api_keys,
            get_hook_status,
            ask_grok,
            ask_openai,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
