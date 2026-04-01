mod commands;
mod snapshots;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            commands::read_config,
            commands::write_config,
            commands::config_file_exists,
            snapshots::list_snapshots,
            snapshots::save_snapshot,
            snapshots::restore_snapshot,
            snapshots::delete_snapshot,
            snapshots::export_snapshot,
        ])
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用失败");
}
