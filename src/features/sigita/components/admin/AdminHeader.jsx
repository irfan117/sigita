export default function AdminHeader({ adminUser, onLogout }) {
  return (
    <div className="admin-hdr">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="lring sm">
          <div className="lring-spin" />
          <div className="lring-in">S</div>
        </div>
        <div>
          <h1 className="admin-title">SIGITA Admin</h1>
          <p className="admin-sub">BPT Komdigi · Panel Manajemen Dokumen</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="admin-user-badge">
          <span className="admin-dot" />
          {adminUser}
        </div>
        <button className="logout-btn" onClick={onLogout}>Keluar</button>
      </div>
    </div>
  );
}
