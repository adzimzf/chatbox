#[tauri::command]
fn is_mobile_platform() -> bool {
    let platform = tauri_plugin_os::platform();
    platform == "ios" || platform == "android"
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![is_mobile_platform])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
