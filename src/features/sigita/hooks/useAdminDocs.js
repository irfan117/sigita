import { useRef, useState } from "react";
import { DocStore } from "../lib/docStore";
import { extractText } from "../lib/services";
import { trunc, uid } from "../lib/utils";

export function useAdminDocs({ adminUser, docs, onDocsChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [drag, setDrag] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadErr("");

    try {
      const content = await extractText(file);
      const newDoc = {
        id: uid(),
        name: file.name,
        content,
        size: file.size,
        uploadedAt: new Date(),
        uploadedBy: adminUser,
        pages: Math.ceil(content.length / 2000),
      };

      const updated = [...docs, newDoc];
      DocStore.set(updated);
      onDocsChange(updated);
      showToast(`"${trunc(file.name, 28)}" berhasil diunggah`);
    } catch (e) {
      setUploadErr(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeDoc = (id) => {
    const updated = docs.filter((d) => d.id !== id);
    DocStore.set(updated);
    onDocsChange(updated);
    showToast("Dokumen dihapus", "warn");
  };

  return {
    uploading,
    uploadErr,
    drag,
    toast,
    fileRef,
    setDrag,
    handleFile,
    removeDoc,
  };
}
