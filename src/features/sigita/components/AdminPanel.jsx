import AdminDocList from "./admin/AdminDocList";
import AdminGuide from "./admin/AdminGuide";
import AdminHeader from "./admin/AdminHeader";
import AdminStats from "./admin/AdminStats";
import AdminUploadZone from "./admin/AdminUploadZone";
import { useAdminDocs } from "../hooks/useAdminDocs";

export default function AdminPanel({ adminUser, docs, onDocsChange, onLogout }) {
  const { uploading, uploadErr, drag, toast, fileRef, setDrag, handleFile, removeDoc } = useAdminDocs({
    adminUser,
    docs,
    onDocsChange,
  });

  return (
    <div className="admin-panel">
      {toast && <div className={`toast ${toast.type}`}>{toast.type === "ok" ? "✅" : "🗑️"} {toast.msg}</div>}

      <AdminHeader adminUser={adminUser} onLogout={onLogout} />

      <div className="admin-body">
        <AdminStats docs={docs} />

        <AdminUploadZone
          drag={drag}
          uploading={uploading}
          fileRef={fileRef}
          onFile={handleFile}
          setDrag={setDrag}
        />

        {uploadErr && <div className="admin-err">⚠️ {uploadErr}</div>}

        <AdminDocList docs={docs} onRemoveDoc={removeDoc} />
        <AdminGuide />
      </div>
    </div>
  );
}
