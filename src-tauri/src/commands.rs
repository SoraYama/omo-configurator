use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

pub(crate) fn config_dir() -> PathBuf {
    let home = dirs::home_dir().expect("无法获取 home 目录");
    home.join(".config").join("opencode")
}

/// 插件 5.x 的统一配置目录 ~/.omo
pub(crate) fn omo_dir() -> PathBuf {
    let home = dirs::home_dir().expect("无法获取 home 目录");
    home.join(".omo")
}

/// 插件从该主版本起只读取 ~/.omo/omo.jsonc，旧文件仅供一次性迁移
const UNIFIED_CONFIG_MAJOR: u32 = 5;

/// unified 布局候选文件，按插件读取优先级排列
pub(crate) fn unified_config_candidates() -> Vec<PathBuf> {
    let dir = omo_dir();
    vec![dir.join("omo.jsonc"), dir.join("omo.json")]
}

/// legacy 布局候选文件，按插件 3.x/4.x 读取优先级排列（旧名优先，jsonc 优先）
pub(crate) fn legacy_config_candidates() -> Vec<PathBuf> {
    let dir = config_dir();
    ["oh-my-opencode", "oh-my-openagent"]
        .iter()
        .flat_map(|base| [format!("{}.jsonc", base), format!("{}.json", base)])
        .map(|name| dir.join(name))
        .collect()
}

#[derive(serde::Serialize)]
pub struct PluginConfigLocation {
    path: String,
    layout: &'static str,
    exists: bool,
}

fn location(path: &Path, layout: &'static str) -> PluginConfigLocation {
    PluginConfigLocation {
        path: path.to_string_lossy().into_owned(),
        layout,
        exists: path.exists(),
    }
}

/// 根据 opencode.json 中固定的插件主版本，定位插件实际读取的配置文件
/// plugin_major 为 None（未固定版本，即 latest）时按最新版处理
#[tauri::command]
pub fn resolve_plugin_config(plugin_major: Option<u32>) -> PluginConfigLocation {
    resolve_among(
        plugin_major,
        &legacy_config_candidates(),
        &unified_config_candidates(),
    )
}

fn resolve_among(
    plugin_major: Option<u32>,
    legacy: &[PathBuf],
    unified: &[PathBuf],
) -> PluginConfigLocation {
    // legacy 默认新建 oh-my-opencode.json（候选第 2 项），unified 默认新建 omo.jsonc
    let (candidates, default, layout) = if plugin_major.is_some_and(|m| m < UNIFIED_CONFIG_MAJOR) {
        (legacy, &legacy[1], "legacy")
    } else {
        (unified, &unified[0], "unified")
    };
    let path = candidates.iter().find(|p| p.exists()).unwrap_or(default);
    location(path, layout)
}

/// 只允许读写插件配置候选路径，避免前端传入任意路径
fn check_plugin_config_path(path: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(path);
    let allowed = unified_config_candidates()
        .into_iter()
        .chain(legacy_config_candidates())
        .any(|p| p == path);
    if allowed {
        Ok(path)
    } else {
        Err(format!("不允许访问的插件配置路径: {}", path.display()))
    }
}

#[tauri::command]
pub fn read_plugin_config(path: &str) -> Result<String, String> {
    let path = check_plugin_config_path(path)?;
    if !path.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(&path).map_err(|e| format!("读取 {} 失败: {}", path.display(), e))
}

#[tauri::command]
pub fn write_plugin_config(path: &str, content: &str) -> Result<(), String> {
    let path = check_plugin_config_path(path)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建 {} 失败: {}", parent.display(), e))?;
    }
    fs::write(&path, content).map_err(|e| format!("写入 {} 失败: {}", path.display(), e))
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
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建配置目录失败: {}", e))?;
    }
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

#[cfg(test)]
mod tests {
    use super::*;

    struct Fixture {
        root: PathBuf,
        legacy: Vec<PathBuf>,
        unified: Vec<PathBuf>,
    }

    impl Fixture {
        fn new(name: &str) -> Self {
            let root = std::env::temp_dir().join(format!("omo-cfg-test-{}-{}", name, std::process::id()));
            let _ = fs::remove_dir_all(&root);
            fs::create_dir_all(&root).unwrap();
            let legacy = ["oh-my-opencode.jsonc", "oh-my-opencode.json", "oh-my-openagent.jsonc", "oh-my-openagent.json"]
                .iter()
                .map(|n| root.join(n))
                .collect();
            let unified = vec![root.join("omo.jsonc"), root.join("omo.json")];
            Fixture { root, legacy, unified }
        }

        fn touch(&self, name: &str) {
            fs::write(self.root.join(name), "{}").unwrap();
        }

        fn resolve(&self, major: Option<u32>) -> PluginConfigLocation {
            resolve_among(major, &self.legacy, &self.unified)
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.root);
        }
    }

    #[test]
    fn legacy_plugin_prefers_old_basename_like_plugin_3x() {
        let f = Fixture::new("legacy-order");
        f.touch("oh-my-opencode.json");
        f.touch("oh-my-openagent.jsonc");
        let loc = f.resolve(Some(3));
        assert_eq!(loc.layout, "legacy");
        assert!(loc.path.ends_with("oh-my-opencode.json"));
        assert!(loc.exists);
    }

    #[test]
    fn unified_plugin_ignores_legacy_files() {
        let f = Fixture::new("unified-new");
        f.touch("oh-my-opencode.json");
        let loc = f.resolve(Some(5));
        assert_eq!(loc.layout, "unified");
        assert!(loc.path.ends_with("omo.jsonc"));
        assert!(!loc.exists);
    }

    #[test]
    fn unpinned_plugin_uses_existing_omo_json() {
        let f = Fixture::new("unified-json");
        f.touch("omo.json");
        let loc = f.resolve(None);
        assert_eq!(loc.layout, "unified");
        assert!(loc.path.ends_with("omo.json"));
        assert!(loc.exists);
    }
}
