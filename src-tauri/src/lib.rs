mod terminal;
mod workspace;

use terminal::{kill_terminal, resize_terminal, spawn_terminal, write_to_terminal, PtyState};
use workspace::{git_diff_content, git_status, list_directory, read_file};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(PtyState::default())
        .invoke_handler(tauri::generate_handler![
            spawn_terminal,
            write_to_terminal,
            resize_terminal,
            kill_terminal,
            list_directory,
            git_status,
            read_file,
            git_diff_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
