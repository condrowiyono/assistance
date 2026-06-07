use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Mutex;

use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use tauri::{AppHandle, Emitter, State};

struct PtySession {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    child: Box<dyn Child + Send + Sync>,
}

#[derive(Default)]
pub struct PtyState(Mutex<HashMap<String, PtySession>>);

fn data_event(session_id: &str) -> String {
    format!("pty://data:{session_id}")
}

fn exit_event(session_id: &str) -> String {
    format!("pty://exit:{session_id}")
}

fn login_shell() -> String {
    std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string())
}

#[tauri::command]
pub fn spawn_terminal(app: AppHandle, state: State<PtyState>, cwd: String) -> Result<String, String> {
    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let mut cmd = CommandBuilder::new(login_shell());
    cmd.cwd(&cwd);
    cmd.env("TERM", "xterm-256color");

    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    drop(pair.slave);

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    let session_id = uuid::Uuid::new_v4().to_string();

    {
        let mut sessions = state.0.lock().map_err(|e| e.to_string())?;
        sessions.insert(
            session_id.clone(),
            PtySession {
                master: pair.master,
                writer,
                child,
            },
        );
    }

    let emit_handle = app.clone();
    let reader_session_id = session_id.clone();
    std::thread::spawn(move || {
        let mut buf = [0u8; 8192];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let chunk = String::from_utf8_lossy(&buf[..n]).into_owned();
                    if emit_handle.emit(&data_event(&reader_session_id), chunk).is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
        let _ = emit_handle.emit(&exit_event(&reader_session_id), ());
    });

    Ok(session_id)
}

#[tauri::command]
pub fn write_to_terminal(state: State<PtyState>, session_id: String, data: String) -> Result<(), String> {
    let mut sessions = state.0.lock().map_err(|e| e.to_string())?;
    let session = sessions
        .get_mut(&session_id)
        .ok_or_else(|| "terminal session not found".to_string())?;
    session
        .writer
        .write_all(data.as_bytes())
        .map_err(|e| e.to_string())?;
    session.writer.flush().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn resize_terminal(state: State<PtyState>, session_id: String, rows: u16, cols: u16) -> Result<(), String> {
    let sessions = state.0.lock().map_err(|e| e.to_string())?;
    let session = sessions
        .get(&session_id)
        .ok_or_else(|| "terminal session not found".to_string())?;
    session
        .master
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn kill_terminal(state: State<PtyState>, session_id: String) -> Result<(), String> {
    let mut sessions = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(mut session) = sessions.remove(&session_id) {
        let _ = session.child.kill();
    }
    Ok(())
}
