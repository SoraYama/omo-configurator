use std::fs;
use std::path::PathBuf;

fn config_dir() -> PathBuf {
    let home = dirs::home_dir().expect("无法获取 home 目录");
    home.join(".config").join("opencode")
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
