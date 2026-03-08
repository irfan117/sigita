export const fmtTime = (d) =>
  d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export const fmtDate = (d) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export const trunc = (s, n) => (s.length > n ? `${s.slice(0, n)}…` : s);

export const renderMd = (t) =>
  t
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");

export const uid = () => Math.random().toString(36).slice(2, 9);

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
