use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

fn config_dir() -> PathBuf {
    let home = dirs::home_dir().expect("无法获取 home 目录");
    home.join(".config").join("opencode")
}

fn auth_file() -> PathBuf {
    let home = dirs::home_dir().expect("无法获取 home 目录");
    home.join(".local")
        .join("share")
        .join("opencode")
        .join("auth.json")
}

#[tauri::command]
pub fn read_auth() -> Result<String, String> {
    let path = auth_file();
    if !path.exists() {
        return Ok("{}".to_string());
    }
    fs::read_to_string(&path).map_err(|e| format!("读取 auth.json 失败: {}", e))
}

#[tauri::command]
pub fn read_config(filename: &str) -> Result<String, String> {
    let path = config_dir().join(filename);
    fs::read_to_string(&path).map_err(|e| format!("读取 {} 失败: {}", filename, e))
}

#[tauri::command]
pub fn write_config(filename: &str, content: &str) -> Result<(), String> {
    let path = config_dir().join(filename);
    fs::write(&path, content).map_err(|e| format!("写入 {} 失败: {}", filename, e))
}

#[tauri::command]
pub fn config_file_exists(filename: &str) -> bool {
    config_dir().join(filename).exists()
}

/// 从 opencode zen 的 /models 端点获取模型列表（Rust 侧发起，绕过 CORS）
/// 返回 ["opencode/gpt-5.4", "opencode/claude-opus-4-6", ...] 格式的 JSON 字符串
#[tauri::command]
pub async fn fetch_zen_models(api_key: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get("https://opencode.ai/zen/v1/models")
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| format!("请求 zen models 失败: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("zen models 返回 HTTP {}", resp.status()));
    }

    #[derive(serde::Deserialize)]
    struct ModelItem {
        id: String,
    }
    #[derive(serde::Deserialize)]
    struct ModelsResponse {
        data: Vec<ModelItem>,
    }

    let data: ModelsResponse = resp
        .json()
        .await
        .map_err(|e| format!("解析 zen models 响应失败: {}", e))?;

    let models: Vec<String> = data.data.iter().map(|m| format!("opencode/{}", m.id)).collect();
    serde_json::to_string(&models).map_err(|e| e.to_string())
}

/// 从 models.dev/api.json 获取指定 provider 的模型列表
/// 返回 ["providerName/modelId", ...] 格式的 JSON 字符串
#[tauri::command]
pub async fn fetch_models_dev(provider_ids: Vec<String>) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get("https://models.dev/api.json")
        .send()
        .await
        .map_err(|e| format!("请求 models.dev 失败: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("models.dev 返回 HTTP {}", resp.status()));
    }

    // models.dev 返回 { providerKey: { models: { modelId: { id, name, ... } } } }
    let full: HashMap<String, serde_json::Value> = resp
        .json()
        .await
        .map_err(|e| format!("解析 models.dev 响应失败: {}", e))?;

    let mut result: Vec<String> = Vec::new();
    for provider_id in &provider_ids {
        if let Some(provider) = full.get(provider_id) {
            if let Some(models) = provider.get("models").and_then(|m| m.as_object()) {
                for model_id in models.keys() {
                    result.push(format!("{}/{}", provider_id, model_id));
                }
            }
        }
    }

    serde_json::to_string(&result).map_err(|e| e.to_string())
}
