export default function ChatHeader() {
  return (
    <div className="hdr">
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div className="lring">
          <div className="lring-spin" />
          <div className="lring-in">S</div>
        </div>
        <div>
          <h1 className="hdr-title">SIGITA</h1>
          <p className="hdr-sub">Asisten Digital Talenta · BPT Komdigi</p>
        </div>
      </div>
      <div className="hdr-right">
        <div className="hdr-badge">🇮🇩 Komdigi</div>
      </div>
    </div>
  );
}
