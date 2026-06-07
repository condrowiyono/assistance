export type MonacoTheme = "vs-dark" | "light";

export function readMonacoTheme(): MonacoTheme {
  return document.documentElement.classList.contains("dark") ? "vs-dark" : "light";
}

export function watchMonacoTheme(onChange: (theme: MonacoTheme) => void): () => void {
  const observer = new MutationObserver(() => onChange(readMonacoTheme()));
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
