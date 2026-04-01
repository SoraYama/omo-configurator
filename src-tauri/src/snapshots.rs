use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

fn snapshots_dir() -> PathBuf {
    let home = dirs::home_dir().expect("无法获取 home 目录");
    home.join(".config").join("opencode").join(".snapshots")
}

#[derive(Serialize, Deserialize)]
pub struct SnapshotInfo {
    pub name: String,
    pub timestamp: u64,
}

#[tauri::command]
pub fn list_snapshots() -> Result<Vec<SnapshotInfo>, String> {
    let dir = snapshots_dir();
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut snapshots = Vec::new();
    let entries = fs::read_dir(&dir).map_err(|e| format!("读取快照目录失败: {}", e))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                let metadata = fs::metadata(&path).ok();
                let timestamp = metadata
                    .and_then(|m| m.modified().ok())
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                snapshots.push(SnapshotInfo {
                    name: name.to_string(),
                    timestamp,
                });
            }
        }
    }
    snapshots.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(snapshots)
}

#[tauri::command]
pub fn save_snapshot(name: &str) -> Result<(), String> {
    let config_dir = dirs::home_dir()
        .expect("无法获取 home 目录")
        .join(".config")
        .join("opencode");
    let snap_dir = snapshots_dir().join(name);
    fs::create_dir_all(&snap_dir).map_err(|e| format!("创建快照目录失败: {}", e))?;

    for filename in &["opencode.json", "oh-my-opencode.json"] {
        let src = config_dir.join(filename);
        if src.exists() {
            let dst = snap_dir.join(filename);
            fs::copy(&src, &dst).map_err(|e| format!("复制 {} 失败: {}", filename, e))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn restore_snapshot(name: &str) -> Result<(), String> {
    let config_dir = dirs::home_dir()
        .expect("无法获取 home 目录")
        .join(".config")
        .join("opencode");
    let snap_dir = snapshots_dir().join(name);
    if !snap_dir.exists() {
        return Err(format!("快照 {} 不存在", name));
    }
    for filename in &["opencode.json", "oh-my-opencode.json"] {
        let src = snap_dir.join(filename);
        if src.exists() {
            let dst = config_dir.join(filename);
            fs::copy(&src, &dst).map_err(|e| format!("恢复 {} 失败: {}", filename, e))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn delete_snapshot(name: &str) -> Result<(), String> {
    let snap_dir = snapshots_dir().join(name);
    if snap_dir.exists() {
        fs::remove_dir_all(&snap_dir).map_err(|e| format!("删除快照失败: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn export_snapshot(name: &str) -> Result<String, String> {
    let snap_dir = snapshots_dir().join(name);
    if !snap_dir.exists() {
        return Err(format!("快照 {} 不存在", name));
    }
    let mut export_data = serde_json::Map::new();
    for filename in &["opencode.json", "oh-my-opencode.json"] {
        let path = snap_dir.join(filename);
        if path.exists() {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("读取 {} 失败: {}", filename, e))?;
            export_data.insert(
                filename.to_string(),
                serde_json::Value::String(content),
            );
        }
    }
    serde_json::to_string_pretty(&export_data).map_err(|e| format!("序列化失败: {}", e))
}
