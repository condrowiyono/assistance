import { useEffect, useState } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { monaco } from "@/lib/monaco";
import { gitDiffContent, type GitDiffContent } from "@/lib/workspace";
import { readMonacoTheme, watchMonacoTheme, type MonacoTheme } from "@/lib/monacoTheme";

interface DiffPreviewProps {
  projectPath: string;
  filePath: string;
  title: string;
}

function guessLanguage(path: string): string | undefined {
  const dot = path.lastIndexOf(".");
  if (dot === -1) return undefined;
  const ext = path.slice(dot).toLowerCase();
  return monaco.languages.getLanguages().find((lang) => lang.extensions?.includes(ext))?.id;
}

export function DiffPreview({ projectPath, filePath, title }: DiffPreviewProps) {
  const [diff, setDiff] = useState<GitDiffContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<MonacoTheme>(() => readMonacoTheme());

  useEffect(() => watchMonacoTheme(setTheme), []);

  useEffect(() => {
    let cancelled = false;
    setDiff(null);
    setError(null);
    setLoading(true);

    void (async () => {
      try {
        const result = await gitDiffContent(projectPath, filePath);
        if (!cancelled) setDiff(result);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectPath, filePath]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">Loading diff for {title}…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DiffEditor
        original={diff?.original ?? ""}
        modified={diff?.modified ?? ""}
        language={guessLanguage(filePath)}
        theme={theme}
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          fontSize: 13,
          scrollBeyondLastLine: false,
          hideUnchangedRegions: { enabled: true },
        }}
      />
    </div>
  );
}
