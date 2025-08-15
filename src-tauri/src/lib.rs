// mod hook;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                // use tauri::Manager;
                
                // let main_window = app.get_webview_window("main").unwrap();
                // main_window.open_devtools();
                // TODO: finish front-end implementing of https://github.com/Xinyu-Li-123/tauri-clickthrough-demo to allow drag/resizing captions window
                // hook::start_global_mouse_stream(main_window);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
