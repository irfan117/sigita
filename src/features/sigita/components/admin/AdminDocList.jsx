import { fmtDate, formatBytes } from "../../lib/utils";

export default function AdminDocList({ docs, onRemoveDoc }) {
  if (docs.length === 0) {
    return (
      <div className="info-banner">
        <span style={{ fontSize: 18 }}>💡</span>
        <span>Belum ada dokumen. Upload dokumen agar SIGITA dapat menjawab pertanyaan pengguna.</span>
      </div>
    );
  }

  return (
    <div className="doc-list">
      <div className="doc-list-hdr">
        <span>Dokumen Terdaftar</span>
        <span className="doc-count">{docs.length} file</span>
      </div>
      {docs.map((d) => (
        <div key={d.id} className="admin-doc-item">
          <div className="doc-icon-wrap">
            <span style={{ fontSize: 20 }}>{d.name.endsWith(".pdf") ? "📕" : "📄"}</span>
          </div>
          <div className="doc-detail">
            <div className="doc-item-name">{d.name}</div>
            <div className="doc-item-meta">
              {formatBytes(d.size)} · {(d.content.length / 1000).toFixed(1)}k karakter · {fmtDate(d.uploadedAt)}
              <span className="doc-uploader"> · oleh {d.uploadedBy}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="doc-active-badge">Aktif</span>
            <button className="doc-rm-btn" onClick={() => onRemoveDoc(d.id)}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}
