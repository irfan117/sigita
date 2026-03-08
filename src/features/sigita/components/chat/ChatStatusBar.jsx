export default function ChatStatusBar({ busy, hasDoc, docsCount }) {
  return (
    <div className="status-bar">
      <div className={`sd ${busy ? "think" : hasDoc ? "on" : "warn"}`} />
      <span className="slbl">
        {busy
          ? "SIGITA sedang memproses…"
          : hasDoc
            ? `Siap membantu · ${docsCount} sumber pengetahuan aktif`
            : "Sistem sedang dipersiapkan"}
      </span>
    </div>
  );
}
