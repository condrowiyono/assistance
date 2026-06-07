import { invoke } from "@tauri-apps/api/core";

export interface DirEntry {
  name: string;
  path: string;
  isDir: boolean;
}

export interface GitStatusEntry {
  path: string;
  indexStatus: string;
  worktreeStatus: string;
}

export async function listDirectory(path: string): Promise<DirEntry[]> {
  return invoke<DirEntry[]>("list_directory", { path });
}

export async function gitStatus(path: string): Promise<GitStatusEntry[]> {
  return invoke<GitStatusEntry[]>("git_status", { path });
}

export async function gitBranch(path: string): Promise<string> {
  return invoke<string>("git_branch", { path });
}

export async function readFile(path: string): Promise<string> {
  return invoke<string>("read_file", { path });
}

export interface GitDiffContent {
  original: string;
  modified: string;
}

export async function gitDiffContent(projectPath: string, filePath: string): Promise<GitDiffContent> {
  return invoke<GitDiffContent>("git_diff_content", { projectPath, filePath });
}
