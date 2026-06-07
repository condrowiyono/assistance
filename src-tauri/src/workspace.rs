use std::process::Command;

use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirEntry {
    name: String,
    path: String,
    is_dir: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatusEntry {
    path: String,
    index_status: String,
    worktree_status: String,
}

#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<DirEntry>, String> {
    let read_dir = std::fs::read_dir(&path).map_err(|e| e.to_string())?;

    let mut entries = Vec::new();
    for entry in read_dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_type = entry.file_type().map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().into_owned();
        let path = entry.path().to_string_lossy().into_owned();
        entries.push(DirEntry {
            name,
            path,
            is_dir: file_type.is_dir(),
        });
    }

    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(entries)
}

const MAX_PREVIEW_BYTES: u64 = 4 * 1024 * 1024;

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    let metadata = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    if metadata.len() > MAX_PREVIEW_BYTES {
        return Err("File is too large to preview".to_string());
    }

    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    String::from_utf8(bytes).map_err(|_| "Cannot preview binary file".to_string())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitDiffContent {
    original: String,
    modified: String,
}

#[tauri::command]
pub fn git_diff_content(project_path: String, file_path: String) -> Result<GitDiffContent, String> {
    let original = Command::new("git")
        .arg("show")
        .arg(format!("HEAD:{file_path}"))
        .current_dir(&project_path)
        .output()
        .ok()
        .filter(|out| out.status.success())
        .map(|out| String::from_utf8_lossy(&out.stdout).into_owned())
        .unwrap_or_default();

    let absolute_path = format!("{}/{}", project_path.trim_end_matches('/'), file_path);
    let modified = match std::fs::metadata(&absolute_path) {
        Ok(metadata) => {
            if metadata.len() > MAX_PREVIEW_BYTES {
                return Err("File is too large to preview".to_string());
            }
            let bytes = std::fs::read(&absolute_path).map_err(|e| e.to_string())?;
            String::from_utf8(bytes).map_err(|_| "Cannot preview binary file".to_string())?
        }
        Err(_) => String::new(),
    };

    Ok(GitDiffContent { original, modified })
}

#[tauri::command]
pub fn git_branch(path: String) -> Result<String, String> {
    let output = Command::new("git")
        .arg("rev-parse")
        .arg("--abbrev-ref")
        .arg("HEAD")
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err("not a git repository".to_string());
    }

    let branch = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if branch.is_empty() {
        return Err("not a git repository".to_string());
    }

    Ok(branch)
}

#[tauri::command]
pub fn git_status(path: String) -> Result<Vec<GitStatusEntry>, String> {
    let output = Command::new("git")
        .arg("status")
        .arg("--porcelain=v1")
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).into_owned();
        return Err(if stderr.trim().is_empty() {
            "not a git repository".to_string()
        } else {
            stderr.trim().to_string()
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut entries = Vec::new();
    for line in stdout.lines() {
        if line.len() < 3 {
            continue;
        }
        let index_status = line[0..1].to_string();
        let worktree_status = line[1..2].to_string();
        let rest = line[3..].trim();
        // Renames are reported as "old -> new"; surface the new path.
        let path = rest.split(" -> ").last().unwrap_or(rest).to_string();

        entries.push(GitStatusEntry {
            path,
            index_status,
            worktree_status,
        });
    }

    Ok(entries)
}
