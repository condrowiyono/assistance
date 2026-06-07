import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import "@/lib/monaco";
import { readFile } from "@/lib/workspace";
import { readMonacoTheme, watchMonacoTheme, type MonacoTheme } from "@/lib/monacoTheme";

interface FilePreviewProps {
  path: string;
  title: string;
}

export function FilePreview({ path, title }: FilePreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<MonacoTheme>(() => readMonacoTheme());

  useEffect(() => watchMonacoTheme(setTheme), []);

  useEffect(() => {
    let cancelled = false;
    setContent(null);
    setError(null);
    setLoading(true);

    void (async () => {
      try {
        const text = await readFile(path);
        if (!cancelled) setContent(text);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">Loading {title}…</p>
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
      <Editor
        path={path}
        value={content ?? ""}
        theme={theme}
        options={{
          readOnly: true,
          domReadOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
