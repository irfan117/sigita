export default function AdminUploadZone({ drag, uploading, fileRef, onFile, setDrag }) {
  return (
    <div
      className={`admin-up-zone ${drag ? "drag" : ""} ${uploading ? "busy" : ""}`}
      onClick={() => !uploading && fileRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.txt,.md"
        style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files[0])}
      />
      <div style={{ fontSize: 32, marginBottom: 8 }}>{uploading ? "⚙️" : "📤"}</div>
      <div className="up-main-txt">{uploading ? "Memproses dokumen…" : "Upload Dokumen Baru"}</div>
      <div className="up-sub-txt">{uploading ? "Mohon tunggu…" : "PDF · TXT · MD — drag & drop atau klik"}</div>
      {uploading && <div className="proc-bar" style={{ marginTop: 12 }} />}
    </div>
  );
}
