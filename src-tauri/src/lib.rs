use tauri::path::BaseDirectory;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
async fn load_text(app: AppHandle) -> Result<String, String> {
    let file_path = app.dialog().file().blocking_pick_file();

    match file_path {
        Some(path) => {
            let content =
                std::fs::read_to_string(path.as_path().unwrap()).map_err(|e| e.to_string())?;
            Ok(content)
        }
        None => Err("Aucun fichier sélectionné".into()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![load_text])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
