use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::Mutex;

use tauri::{AppHandle, Emitter, State};

use crate::terminal::login_shell;

struct ClaudeChatSession {
    stdin: ChildStdin,
    child: Child,
}

#[derive(Default)]
pub struct ClaudeChatState(Mutex<HashMap<String, ClaudeChatSession>>);

fn line_event(session_id: &str) -> String {
    format!("claude-chat://line:{session_id}")
}

fn exit_event(session_id: &str) -> String {
    format!("claude-chat://exit:{session_id}")
}

fn error_event(session_id: &str) -> String {
    format!("claude-chat://error:{session_id}")
}

fn resolve_claude_binary() -> Result<String, String> {
    let output = Command::new(login_shell())
        .args(["-lc", "command -v claude"])
        .output()
        .map_err(|e| e.to_string())?;

    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if path.is_empty() {
        return Err("claude CLI not found in PATH (checked via login shell)".to_string());
    }
    Ok(path)
}

#[tauri::command]
pub fn spawn_claude_chat(app: AppHandle, state: State<ClaudeChatState>, cwd: String) -> Result<String, String> {
    let claude_path = resolve_claude_binary()?;

    let mut child = Command::new(&claude_path)
        .args([
            "-p",
            "--input-format",
            "stream-json",
            "--output-format",
            "stream-json",
            "--verbose",
            "--dangerously-skip-permissions",
        ])
        .current_dir(&cwd)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdout = child.stdout.take().ok_or("failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("failed to capture stderr")?;
    let stdin = child.stdin.take().ok_or("failed to capture stdin")?;

    let session_id = uuid::Uuid::new_v4().to_string();

    {
        let mut sessions = state.0.lock().map_err(|e| e.to_string())?;
        sessions.insert(session_id.clone(), ClaudeChatSession { stdin, child });
    }

    let stdout_handle = app.clone();
    let stdout_session_id = session_id.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            match line {
                Ok(text) => {
                    if stdout_handle.emit(&line_event(&stdout_session_id), text).is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
        let _ = stdout_handle.emit(&exit_event(&stdout_session_id), ());
    });

    let stderr_handle = app.clone();
    let stderr_session_id = session_id.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            match line {
                Ok(text) => {
                    if stderr_handle.emit(&error_event(&stderr_session_id), text).is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
    });

    Ok(session_id)
}

#[tauri::command]
pub fn send_claude_chat_message(state: State<ClaudeChatState>, session_id: String, text: String) -> Result<(), String> {
    let envelope = serde_json::json!({
        "type": "user",
        "message": {
            "role": "user",
            "content": [{ "type": "text", "text": text }]
        }
    });
    let mut line = serde_json::to_string(&envelope).map_err(|e| e.to_string())?;
    line.push('\n');

    let mut sessions = state.0.lock().map_err(|e| e.to_string())?;
    let session = sessions
        .get_mut(&session_id)
        .ok_or_else(|| "claude chat session not found".to_string())?;
    session.stdin.write_all(line.as_bytes()).map_err(|e| e.to_string())?;
    session.stdin.flush().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn kill_claude_chat(state: State<ClaudeChatState>, session_id: String) -> Result<(), String> {
    let mut sessions = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(mut session) = sessions.remove(&session_id) {
        let _ = session.child.kill();
        let _ = session.child.wait();
    }
    Ok(())
}
