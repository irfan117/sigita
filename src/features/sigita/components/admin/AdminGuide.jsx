export default function AdminGuide() {
  return (
    <div className="admin-guide">
      <div className="guide-title">📋 Panduan Admin</div>
      <div className="guide-body">
        • Dokumen yang diunggah <strong>langsung aktif</strong> — SIGITA akan menjawab berdasarkan dokumen tersebut
        <br />
        • Bisa unggah <strong>beberapa dokumen</strong> sekaligus — semua akan dijadikan sumber pengetahuan
        <br />
        • Pengguna <strong>tidak bisa melihat</strong> panel ini atau mengubah dokumen
        <br />
        • Hapus dokumen jika sudah tidak relevan atau perlu diperbarui
        <br />
        • <strong>Format didukung:</strong> PDF, TXT, Markdown (.md)
      </div>
    </div>
  );
}
