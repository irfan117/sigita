import { buildSystemPrompt } from "./prompt";

export async function callAPI(userMessage, docs, history) {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userMessage,
      docs,
      history: history.slice(-8),
      systemPrompt: buildSystemPrompt(docs),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || `Error ${response.status}`);
  }

  const data = await response.json();
  return data?.text || "Maaf, tidak ada respons.";
}

export async function extractText(file) {
  return new Promise((resolve, reject) => {
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          if (!window.pdfjsLib) {
            await new Promise((res, rej) => {
              const s = document.createElement("script");
              s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
              s.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
                res();
              };
              s.onerror = () => rej(new Error("Gagal memuat PDF.js"));
              document.head.appendChild(s);
            });
          }

          const pdf = await window.pdfjsLib.getDocument({
            data: new Uint8Array(e.target.result),
          }).promise;

          let text = "";
          for (let i = 1; i <= pdf.numPages; i += 1) {
            const page = await pdf.getPage(i);
            const c = await page.getTextContent();
            text += `${c.items.map((x) => x.str).join(" ")}\n`;
          }

          if (text.trim().length < 20) {
            throw new Error("Dokumen kosong atau tidak terbaca.");
          }
          resolve(text.trim());
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
      return;
    }

    if (
      ["text/plain", "text/markdown"].includes(file.type) ||
      file.name.match(/\.(txt|md)$/)
    ) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file, "UTF-8");
      return;
    }

    reject(new Error("Format tidak didukung. Gunakan PDF, TXT, atau MD."));
  });
}
