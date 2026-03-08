export default function AdminStats({ docs }) {
  const totalChars = docs.reduce((a, d) => a + d.content.length, 0);

  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-num">{docs.length}</div>
        <div className="stat-lbl">Dokumen Aktif</div>
      </div>
      <div className="stat-card">
        <div className="stat-num">{totalChars > 0 ? `${(totalChars / 1000).toFixed(0)}k` : "0"}</div>
        <div className="stat-lbl">Total Karakter</div>
      </div>
      <div className="stat-card">
        <div className="stat-num" style={{ color: docs.length > 0 ? "#4ADE80" : "#FBBF24" }}>
          {docs.length > 0 ? "Aktif" : "Standby"}
        </div>
        <div className="stat-lbl">Status SIGITA</div>
      </div>
    </div>
  );
}
