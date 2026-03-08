"use client";
import { useState, useRef, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  SIGITA — BPT Komdigi
//  Role-based: Admin (upload dokumen) | User (chat only)
//  Dokumen yang diupload admin → otomatis digunakan untuk menjawab user
// ─────────────────────────────────────────────────────────────────────────────

// ─── ADMIN CREDENTIALS (ganti sesuai kebutuhan) ──────────────────────────────
const ADMIN_CREDENTIALS = [
  { username: "admin.bpt", password: "Komdigi2025!" },
  { username: "admin.sigita", password: "BPT@Sigita!" },
];

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
const buildSystemPrompt = (docs) => {
  if (!docs || docs.length === 0) {
    return `Kamu adalah SIGITA (Sistem Informasi & Asisten Digital Talenta), asisten resmi BPT Komdigi.
Saat ini belum ada dokumen internal yang diunggah oleh admin.
Beritahu pengguna bahwa sistem sedang dalam persiapan dan minta mereka menghubungi tim BPT Komdigi di digitalent@kominfo.go.id.
Tetap ramah dan profesional.`;
  }

  const combinedDocs = docs
    .map((d, i) => `--- DOKUMEN ${i + 1}: ${d.name} ---\n${d.content}`)
    .join("\n\n");

  return `Kamu adalah SIGITA (Sistem Informasi & Asisten Digital Talenta), asisten resmi BPT Komdigi (Badan Pengembangan Talenta — Kementerian Komunikasi dan Digital RI).

ATURAN MUTLAK — WAJIB DIPATUHI:
1. HANYA jawab berdasarkan dokumen internal di bawah ini. Dilarang keras menggunakan pengetahuan di luar dokumen.
2. Jika informasi TIDAK ADA dalam dokumen, balas: "Maaf, informasi tersebut tidak tersedia dalam sistem kami. Untuk bantuan lebih lanjut, silakan hubungi tim BPT Komdigi di digitalent@kominfo.go.id."
3. DILARANG mengarang, menebak, atau mengisi informasi yang tidak ada di dokumen.
4. Jawab dalam Bahasa Indonesia yang ramah, jelas, dan profesional.
5. Format rapi: bold untuk poin penting, bullet untuk daftar.
6. Identitasmu adalah SIGITA — asisten resmi BPT Komdigi, bukan asisten umum.

═══════════════════════════════════════════
DOKUMEN INTERNAL BPT KOMDIGI (${docs.length} dokumen):
═══════════════════════════════════════════
${combinedDocs}
═══════════════════════════════════════════`;
};

// ─── API CALL ─────────────────────────────────────────────────────────────────
async function callAPI(userMessage, docs, history) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: buildSystemPrompt(docs),
      messages: [
        ...history.slice(-8).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
        { role: "user", content: userMessage },
      ],
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error ${response.status}`);
  }
  const data = await response.json();
  return data.content?.[0]?.text || "Maaf, tidak ada respons.";
}

// ─── PDF EXTRACTOR ────────────────────────────────────────────────────────────
async function extractText(file) {
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
          const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const c = await page.getTextContent();
            text += c.items.map((x) => x.str).join(" ") + "\n";
          }
          if (text.trim().length < 20) throw new Error("Dokumen kosong atau tidak terbaca.");
          resolve(text.trim());
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } else if (["text/plain", "text/markdown"].includes(file.type) || file.name.match(/\.(txt|md)$/)) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file, "UTF-8");
    } else {
      reject(new Error("Format tidak didukung. Gunakan PDF, TXT, atau MD."));
    }
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtTime = (d) => d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (d) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
const trunc = (s, n) => (s.length > n ? s.slice(0, n) + "…" : s);
const renderMd = (t) =>
  t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
   .replace(/\*(.*?)\*/g, "<em>$1</em>")
   .replace(/\n/g, "<br/>");
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── DOKUMEN DUMMY BPT KOMDIGI ────────────────────────────────────────────────
const DUMMY_DOCS = [
  {
    id: "dummy-001",
    name: "Panduan_Program_DTS_2025.txt",
    uploadedBy: "admin.bpt",
    uploadedAt: new Date("2025-01-15"),
    size: 4200,
    pages: 6,
    content: `
PANDUAN PROGRAM DIGITAL TALENT SCHOLARSHIP (DTS) 2025
Badan Pengembangan Talenta — Kementerian Komunikasi dan Digital RI
================================================================

1. TENTANG PROGRAM DTS
Digital Talent Scholarship (DTS) adalah program beasiswa pelatihan dan pengembangan talenta digital yang diselenggarakan oleh Badan Pengembangan Talenta (BPT), Kementerian Komunikasi dan Digital Republik Indonesia. Program ini bertujuan untuk meningkatkan kompetensi digital masyarakat Indonesia secara masif, merata, dan berkelanjutan guna mendukung transformasi digital nasional.

Program DTS diluncurkan pertama kali pada tahun 2018 dan telah melatih lebih dari 600.000 peserta hingga tahun 2024. Pada tahun 2025, target peserta DTS adalah 200.000 orang dari seluruh Indonesia.

2. AKADEMI DALAM PROGRAM DTS 2025
Program DTS 2025 terdiri dari 6 akademi utama:

a) Fresh Graduate Academy (FGA)
   - Sasaran: Lulusan D3/D4/S1/S2 dari semua jurusan, lulus maksimal 2 tahun terakhir (2023–2025)
   - Durasi: 3–6 bulan (online/hybrid)
   - Kuota: 25.000 peserta
   - Bidang: Cloud Computing, Full-Stack Web Development, Data Science & Analytics, UI/UX Design, Cybersecurity, Artificial Intelligence & Machine Learning, Digital Marketing

b) Vocational School Graduate Academy (VSGA)
   - Sasaran: Lulusan SMK bidang Teknologi Informasi dan Komunikasi (TIK), lulus tahun 2023–2025
   - Durasi: 2–3 bulan (online)
   - Kuota: 20.000 peserta
   - Bidang: Teknik Komputer dan Jaringan, Rekayasa Perangkat Lunak, Animasi, Multimedia

c) Thematic Academy (TA)
   - Sasaran: Masyarakat umum usia 18–45 tahun, ASN, dan profesional
   - Durasi: 1–2 bulan (online, bisa part-time)
   - Kuota: 80.000 peserta
   - Bidang: Generative AI untuk Produktivitas, Keamanan Siber Dasar, Digital Entrepreneurship, Smart City & IoT, Literasi Data, Cloud Practitioner

d) Professional Academy (ProA)
   - Sasaran: Profesional aktif di bidang TIK atau yang ingin beralih ke bidang digital, usia 25–50 tahun
   - Durasi: 2–4 bulan (online/hybrid)
   - Kuota: 15.000 peserta
   - Bidang: AWS Cloud Solutions Architect, Google Cloud Professional, Microsoft Azure Administrator, Certified Ethical Hacker (CEH), Google Data Analytics, Meta Social Media Marketing

e) Digital Leadership Academy (DLA)
   - Sasaran: Pejabat pemerintah (eselon II–IV), pemimpin BUMN/BUMD, dan eksekutif perusahaan swasta
   - Durasi: 2–3 minggu intensif (hybrid)
   - Kuota: 2.000 peserta
   - Bidang: Digital Transformation Strategy, AI Governance & Policy, Cybersecurity for Leaders, Digital Economy & Innovation, Data-Driven Decision Making

f) Government Transformation Academy (GTA) — BARU 2025
   - Sasaran: ASN dari seluruh kementerian/lembaga dan pemerintah daerah
   - Durasi: 1–2 bulan (online)
   - Kuota: 58.000 peserta
   - Bidang: SPBE (Sistem Pemerintahan Berbasis Elektronik), Transformasi Digital Birokrasi, Pengelolaan Data Pemerintah, Keamanan Informasi Pemerintah

3. PERSYARATAN UMUM PENDAFTARAN
- Warga Negara Indonesia (WNI), dibuktikan dengan KTP/Kartu Keluarga
- Usia sesuai ketentuan masing-masing akademi
- Pendidikan sesuai ketentuan akademi yang dipilih
- Memiliki akses internet dan perangkat komputer/laptop
- Bersedia mengikuti seluruh rangkaian kegiatan pelatihan
- Tidak sedang mengikuti program DTS lain di batch yang sama
- Tidak pernah menerima beasiswa DTS di bidang yang sama dalam 3 tahun terakhir

4. CARA MENDAFTAR
Langkah 1: Kunjungi website resmi digitalent.kominfo.go.id
Langkah 2: Klik "Daftar Sekarang" dan buat akun baru dengan email aktif
Langkah 3: Verifikasi email dan lengkapi profil (data diri, pendidikan, pengalaman)
Langkah 4: Pilih akademi dan bidang pelatihan yang sesuai
Langkah 5: Upload dokumen persyaratan (KTP, ijazah/transkrip, foto 3x4)
Langkah 6: Ikuti tes seleksi online (tes kemampuan dasar digital + motivasi)
Langkah 7: Tunggu pengumuman hasil seleksi via email dan dashboard akun
Langkah 8: Peserta yang lolos wajib mengisi surat pernyataan komitmen digital

5. JADWAL PROGRAM DTS 2025
- Batch 1: Pendaftaran 15 Januari – 15 Februari 2025 | Pelatihan Maret – Agustus 2025
- Batch 2: Pendaftaran 1 Juni – 30 Juni 2025 | Pelatihan Agustus – Desember 2025
- Pengumuman hasil seleksi: 2 minggu setelah penutupan pendaftaran

6. BIAYA
Seluruh program DTS 2025 GRATIS 100% untuk peserta yang lolos seleksi:
- Tidak ada biaya pendaftaran
- Tidak ada biaya pelatihan
- Tidak ada biaya ujian sertifikasi (untuk program yang menyertakan sertifikasi industri)
- Modul dan materi pembelajaran disediakan secara gratis

7. SERTIFIKASI
- Sertifikat Penyelesaian dari Kementerian Komunikasi dan Digital RI (untuk semua peserta yang menyelesaikan program)
- Sertifikasi Industri dari mitra global (tergantung program): AWS Certified, Google Professional Certificate, Microsoft Certified, Cisco Certification, Meta Blueprint Certificate
- Sertifikat dapat diunduh secara digital melalui akun peserta di portal resmi

8. KEWAJIBAN PESERTA
- Menghadiri minimal 80% sesi pelatihan (online maupun offline)
- Mengerjakan semua tugas dan proyek akhir
- Mengikuti ujian akhir pelatihan
- Memberikan umpan balik (feedback) setelah program selesai
- Peserta yang tidak memenuhi kehadiran 80% dinyatakan gugur dan tidak mendapat sertifikat

9. KONTAK DAN INFORMASI LEBIH LANJUT
- Website Resmi: digitalent.kominfo.go.id
- Email: digitalent@kominfo.go.id
- Call Center: 159 (Senin–Jumat, 08.00–17.00 WIB)
- Instagram: @komdigi.ri
- Twitter/X: @KemKomdigi
- Facebook: Kementerian Komunikasi dan Digital RI
- Kantor: Jl. Medan Merdeka Barat No.9, Jakarta Pusat 10110
    `.trim(),
  },
  {
    id: "dummy-002",
    name: "FAQ_BPT_Komdigi_2025.txt",
    uploadedBy: "admin.bpt",
    uploadedAt: new Date("2025-01-20"),
    size: 3800,
    pages: 5,
    content: `
FREQUENTLY ASKED QUESTIONS (FAQ) — BPT KOMDIGI 2025
Badan Pengembangan Talenta — Kementerian Komunikasi dan Digital RI
================================================================

BAGIAN A: PERTANYAAN UMUM

Q: Apa itu BPT Komdigi?
A: BPT (Badan Pengembangan Talenta) adalah unit kerja di bawah Kementerian Komunikasi dan Digital RI yang memiliki tugas dan fungsi merancang, mengelola, serta mengimplementasikan program pengembangan talenta digital Indonesia. BPT bertanggung jawab atas program Digital Talent Scholarship (DTS) yang merupakan program beasiswa pelatihan digital terbesar di Indonesia.

Q: Apa visi dan misi BPT Komdigi?
A: Visi: Menjadi pusat pengembangan talenta digital terkemuka yang menghasilkan SDM digital berdaya saing global untuk mendukung Indonesia sebagai kekuatan digital dunia pada 2045.
Misi:
1. Menyelenggarakan program pelatihan digital yang berkualitas, inklusif, dan relevan dengan kebutuhan industri
2. Membangun ekosistem kolaborasi antara pemerintah, industri, dan akademisi
3. Menghasilkan sertifikasi yang diakui secara nasional dan internasional
4. Mendorong pemerataan akses pengembangan talenta digital ke seluruh pelosok Indonesia

Q: Berapa orang yang sudah mengikuti program BPT Komdigi?
A: Sejak tahun 2018 hingga 2024, program DTS telah melatih lebih dari 600.000 peserta dari seluruh provinsi di Indonesia. Target tahun 2025 adalah 200.000 peserta baru.

BAGIAN B: PERTANYAAN SEPUTAR PENDAFTARAN

Q: Apakah program DTS benar-benar gratis?
A: Ya, 100% GRATIS. Tidak ada biaya pendaftaran, biaya pelatihan, biaya ujian, maupun biaya sertifikasi yang dibebankan kepada peserta. Semua biaya ditanggung sepenuhnya oleh Kementerian Komunikasi dan Digital RI.

Q: Apakah bisa mendaftar lebih dari satu program sekaligus?
A: Tidak. Setiap peserta hanya diperbolehkan mengikuti satu program/akademi dalam satu batch. Jika ingin mengikuti program lain, bisa mendaftar di batch berikutnya.

Q: Apakah yang sudah pernah ikut DTS boleh daftar lagi?
A: Boleh, selama bukan di bidang yang sama dalam 3 tahun terakhir dan memenuhi syarat akademi yang dipilih.

Q: Dokumen apa saja yang diperlukan untuk mendaftar?
A: Dokumen yang diperlukan:
- KTP (Kartu Tanda Penduduk) yang masih berlaku
- Ijazah atau Surat Keterangan Lulus (SKL)
- Transkrip nilai (untuk FGA dan ProA)
- Pas foto terbaru ukuran 3x4 (latar belakang merah)
- Surat rekomendasi dari instansi/kampus (khusus DLA dan GTA)
- CV/Riwayat Hidup (khusus ProA dan DLA)

Q: Apakah ada batas usia untuk mendaftar?
A: Ya, setiap akademi memiliki batas usia berbeda:
- FGA: 21–30 tahun
- VSGA: 17–25 tahun
- TA: 18–45 tahun
- ProA: 25–50 tahun
- DLA: Tidak ada batas usia, disesuaikan dengan jabatan
- GTA: Sesuai ketentuan ASN yang berlaku

Q: Kapan pengumuman hasil seleksi?
A: Pengumuman hasil seleksi akan disampaikan melalui email terdaftar dan dashboard akun peserta di digitalent.kominfo.go.id, paling lambat 2 minggu setelah periode pendaftaran ditutup.

BAGIAN C: PERTANYAAN SEPUTAR PELATIHAN

Q: Apakah pelatihan dilakukan secara online atau offline?
A: Tergantung akademinya:
- FGA: Online dan Hybrid (ada sesi tatap muka di kota-kota tertentu)
- VSGA: Online penuh
- TA: Online penuh (bisa diikuti sambil bekerja)
- ProA: Online dan Hybrid
- DLA: Hybrid intensif (ada sesi residensial)
- GTA: Online penuh

Q: Platform apa yang digunakan untuk pelatihan online?
A: Pelatihan online menggunakan Learning Management System (LMS) resmi BPT Komdigi di lms.digitalent.kominfo.go.id. Beberapa program juga menggunakan platform mitra seperti Coursera, Google Classroom, AWS Academy, atau Microsoft Learn.

Q: Apakah ada kuota peserta per daerah?
A: Ya, BPT Komdigi menerapkan kuota regional untuk memastikan pemerataan akses. Sebesar 40% kuota dialokasikan untuk peserta dari luar Pulau Jawa (termasuk wilayah 3T: Terdepan, Terluar, Tertinggal).

Q: Apa yang terjadi jika peserta tidak aktif atau absen lebih dari 20%?
A: Peserta yang kehadirannya kurang dari 80% akan dinyatakan gugur dari program dan tidak akan mendapatkan sertifikat. Mereka juga tidak dapat mendaftar program DTS selama 1 tahun ke depan.

BAGIAN D: PERTANYAAN SEPUTAR SERTIFIKASI DAN KARIER

Q: Apakah sertifikat DTS diakui oleh perusahaan?
A: Ya. Sertifikat DTS dari Kementerian Komunikasi dan Digital RI diakui oleh lebih dari 500 perusahaan mitra di Indonesia. Selain itu, sertifikasi industri dari mitra global (AWS, Google, Microsoft, Cisco, Meta) memiliki pengakuan internasional.

Q: Apakah ada program penempatan kerja setelah lulus?
A: BPT Komdigi bekerja sama dengan lebih dari 200 perusahaan teknologi dan digital di Indonesia untuk program job fair dan talent matching. Peserta DTS mendapatkan akses ke portal karier eksklusif di talentdigital.kominfo.go.id.

Q: Apakah ada program lanjutan setelah DTS?
A: Ya. Alumni DTS mendapatkan akses ke:
- Komunitas Alumni Digital Talent Indonesia (ADTI)
- Program mentoring dengan praktisi industri
- Akses ke program DTS lanjutan (level lebih tinggi)
- Networking event dan hackathon tahunan

BAGIAN E: MITRA DAN KOLABORASI

Q: Siapa saja mitra BPT Komdigi?
A: BPT Komdigi bermitra dengan:
Mitra Teknologi Global: Amazon Web Services (AWS), Google, Microsoft, Cisco, Oracle, IBM, Meta, Huawei
Mitra Industri Nasional: Telkom Indonesia, Gojek, Tokopedia, Traveloka, BCA, Bank Mandiri, Pertamina Digital, PLN, Bukalapak
Mitra Akademik: 150+ universitas terkemuka di seluruh Indonesia
Mitra Internasional: KOICA (Korea), JICA (Jepang), GIZ (Jerman), ADB

Q: Bagaimana cara perusahaan atau institusi bermitra dengan BPT Komdigi?
A: Perusahaan atau institusi yang ingin bermitra dapat menghubungi:
- Email kemitraan: partnership.bpt@kominfo.go.id
- Telepon: (021) 3452877
- Atau mengajukan proposal kemitraan melalui website resmi

BAGIAN F: INFORMASI KONTAK

Alamat Kantor BPT Komdigi:
Badan Pengembangan Talenta
Kementerian Komunikasi dan Digital RI
Jl. Medan Merdeka Barat No.9, Jakarta Pusat 10110

Kontak:
- Website: digitalent.kominfo.go.id
- Email Umum: digitalent@kominfo.go.id
- Email Kemitraan: partnership.bpt@kominfo.go.id
- Call Center: 159 (Senin–Jumat, 08.00–17.00 WIB)
- WhatsApp Helpdesk: 0811-1000-159
- Instagram: @komdigi.ri
- Twitter/X: @KemKomdigi
- YouTube: Kementerian Kominfo RI
    `.trim(),
  },
  {
    id: "dummy-003",
    name: "SOP_Seleksi_Peserta_DTS_2025.txt",
    uploadedBy: "admin.sigita",
    uploadedAt: new Date("2025-02-01"),
    size: 2900,
    pages: 4,
    content: `
STANDAR OPERASIONAL PROSEDUR (SOP)
SELEKSI PESERTA PROGRAM DIGITAL TALENT SCHOLARSHIP (DTS) 2025
Badan Pengembangan Talenta — Kementerian Komunikasi dan Digital RI
Nomor Dokumen: BPT-SOP-SEL-001/2025
================================================================

1. TUJUAN
SOP ini bertujuan untuk mengatur dan menstandardisasi proses seleksi peserta program DTS 2025 agar berjalan secara transparan, objektif, dan akuntabel.

2. RUANG LINGKUP
SOP ini berlaku untuk seluruh proses seleksi program DTS 2025 meliputi: Fresh Graduate Academy (FGA), Vocational School Graduate Academy (VSGA), Thematic Academy (TA), Professional Academy (ProA), Digital Leadership Academy (DLA), dan Government Transformation Academy (GTA).

3. TAHAPAN SELEKSI

TAHAP 1 — PENDAFTARAN ONLINE (Durasi: 30 hari)
3.1.1 Calon peserta mendaftar melalui digitalent.kominfo.go.id
3.1.2 Sistem akan melakukan verifikasi kelengkapan dokumen secara otomatis
3.1.3 Calon peserta yang dokumennya tidak lengkap akan mendapat notifikasi untuk melengkapi dalam waktu 3 hari kerja
3.1.4 Setelah dokumen lengkap, calon peserta mendapat konfirmasi via email

TAHAP 2 — VERIFIKASI ADMINISTRASI (Durasi: 7 hari kerja)
3.2.1 Tim administrasi BPT melakukan verifikasi manual terhadap:
      - Keaslian dokumen yang diunggah
      - Kesesuaian data dengan persyaratan akademi
      - Status kependudukan (WNI aktif)
3.2.2 Calon peserta yang tidak lolos verifikasi administrasi akan mendapat notifikasi disertai alasan penolakan
3.2.3 Calon peserta dapat mengajukan banding dalam 3 hari kerja setelah notifikasi

TAHAP 3 — TES KEMAMPUAN DIGITAL DASAR (Durasi: 90 menit, online)
3.3.1 Tes dilaksanakan melalui platform LMS resmi BPT Komdigi
3.3.2 Materi tes meliputi:
      - Literasi digital dasar (25 soal)
      - Logika dan pemecahan masalah (20 soal)
      - Bahasa Inggris teknis (15 soal, khusus FGA dan ProA)
      - Pengetahuan bidang yang dipilih (20 soal)
3.3.3 Passing grade: minimal 60 dari 100 poin
3.3.4 Tes hanya dapat dilakukan 1 kali. Tidak ada kesempatan mengulang pada batch yang sama.

TAHAP 4 — TES MOTIVASI DAN ESAI (Durasi: 60 menit, online)
3.4.1 Calon peserta mengisi formulir motivasi (500–700 kata)
3.4.2 Pertanyaan meliputi: alasan mengikuti program, rencana penerapan ilmu, dan kontribusi untuk Indonesia
3.4.3 Khusus DLA: wajib menyertakan proposal transformasi digital instansi (1.000–1.500 kata)
3.4.4 Tim penilai akan mengevaluasi berdasarkan rubrik standar BPT

TAHAP 5 — WAWANCARA ONLINE (Khusus FGA, ProA, DLA)
3.5.1 Dilaksanakan via Zoom/Google Meet
3.5.2 Durasi: 20–30 menit per peserta
3.5.3 Panel pewawancara: 2 orang (1 dari BPT, 1 dari mitra industri)
3.5.4 Aspek yang dinilai: motivasi, kemampuan komunikasi, kesiapan belajar, relevansi latar belakang

4. SISTEM PENILAIAN DAN PEMBOBOTAN
Komponen penilaian dan bobotnya:
- Verifikasi Administrasi: Lulus/Tidak Lulus (syarat mutlak)
- Tes Kemampuan Digital: 40%
- Tes Motivasi & Esai: 30%
- Wawancara (FGA/ProA/DLA): 30%
- Untuk TA dan VSGA (tanpa wawancara): Tes Kemampuan 50%, Motivasi 50%

5. PENGUMUMAN HASIL SELEKSI
5.1 Hasil seleksi diumumkan melalui:
    - Email kepada masing-masing calon peserta
    - Dashboard akun di digitalent.kominfo.go.id
    - Pengumuman resmi di website BPT Komdigi
5.2 Pengumuman dilakukan paling lambat 14 hari kerja setelah periode tes berakhir
5.3 Hasil seleksi bersifat final dan tidak dapat diganggu gugat
5.4 Peserta yang lolos wajib melakukan konfirmasi keikutsertaan dalam 5 hari kerja

6. KETENTUAN CADANGAN (WAITING LIST)
6.1 BPT menyiapkan daftar cadangan sebesar 20% dari kuota per akademi
6.2 Peserta cadangan akan dipanggil jika ada peserta yang mengundurkan diri
6.3 Peserta cadangan mendapat notifikasi minimal 7 hari sebelum pelatihan dimulai

7. KODE ETIK SELEKSI
7.1 Seluruh proses seleksi bebas dari segala bentuk KKN (Korupsi, Kolusi, Nepotisme)
7.2 Dilarang memberikan imbalan dalam bentuk apapun kepada panitia seleksi
7.3 Pelanggaran terhadap kode etik akan mengakibatkan diskualifikasi permanen dari program DTS
7.4 Pelaporan pelanggaran dapat dilakukan melalui: whistleblower.kominfo.go.id

8. KONTAK PANITIA SELEKSI
- Email: seleksi.dts@kominfo.go.id
- Call Center: 159 ext. 2 (khusus pertanyaan seleksi)
- Jam operasional: Senin–Jumat, 08.00–16.00 WIB

Dokumen ini ditetapkan di Jakarta pada 2 Januari 2025
Kepala Badan Pengembangan Talenta
Kementerian Komunikasi dan Digital RI
    `.trim(),
  },
];

// ─── STORAGE HELPERS (simulate persistent doc store via window global) ────────
// In production: replace with Firebase Firestore / Storage
const DocStore = {
  get: () => {
    if (typeof window === "undefined") {
      return [];
    }
    if (!window.__sigitaDocs) {
      // Preload dummy docs on first load
      window.__sigitaDocs = DUMMY_DOCS.map((d) => ({
        ...d,
        uploadedAt: new Date(d.uploadedAt),
      }));
    }
    return window.__sigitaDocs;
  },
  set: (docs) => {
    if (typeof window === "undefined") return;
    window.__sigitaDocs = docs;
  },
};

// ═════════════════════════════════════════════════════════════════════════════
//  LOGIN SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function AdminLogin({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async () => {
    if (!u.trim() || !p.trim()) { setErr("Isi username dan password."); return; }
    setLoading(true); setErr("");
    await new Promise((r) => setTimeout(r, 700));
    const match = ADMIN_CREDENTIALS.find((c) => c.username === u && c.password === p);
    if (match) { onLogin(u); }
    else { setErr("Username atau password salah."); setLoading(false); }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-top">
          <div className="lring sm"><div className="lring-spin" /><div className="lring-in">S</div></div>
          <div>
            <h2 className="login-title">Admin Panel</h2>
            <p className="login-sub">BPT Komdigi · SIGITA</p>
          </div>
        </div>
        <p className="login-desc">Masuk untuk mengelola dokumen pengetahuan SIGITA</p>

        <div className="lfield">
          <label className="llabel">Username</label>
          <input className="linput" placeholder="admin.bpt" value={u}
            onChange={(e) => setU(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        <div className="lfield">
          <label className="llabel">Password</label>
          <div style={{ position: "relative" }}>
            <input className="linput" type={showPass ? "text" : "password"} placeholder="••••••••"
              value={p} onChange={(e) => setP(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()} />
            <button className="show-pass" onClick={() => setShowPass(!showPass)}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {err && <div className="lerr">⚠️ {err}</div>}

        <button className="lbtn" onClick={submit} disabled={loading}>
          {loading ? <span className="lspinner" /> : "Masuk ke Admin Panel"}
        </button>

        <p className="lhint">Akses terbatas — hanya untuk staf internal BPT Komdigi</p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  ADMIN PANEL
// ═════════════════════════════════════════════════════════════════════════════
function AdminPanel({ adminUser, docs, onDocsChange, onLogout }) {
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
    setUploading(true); setUploadErr("");
    try {
      const content = await extractText(file);
      const newDoc = {
        id: uid(), name: file.name,
        content, size: file.size,
        uploadedAt: new Date(), uploadedBy: adminUser,
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

  const fmtSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="admin-panel">
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "ok" ? "✅" : "🗑️"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="admin-hdr">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="lring sm"><div className="lring-spin" /><div className="lring-in">S</div></div>
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

      <div className="admin-body">
        {/* Stats bar */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{docs.length}</div>
            <div className="stat-lbl">Dokumen Aktif</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{docs.reduce((a, d) => a + d.content.length, 0) > 0
              ? (docs.reduce((a, d) => a + d.content.length, 0) / 1000).toFixed(0) + "k"
              : "0"}</div>
            <div className="stat-lbl">Total Karakter</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: docs.length > 0 ? "#4ADE80" : "#FBBF24" }}>
              {docs.length > 0 ? "Aktif" : "Standby"}
            </div>
            <div className="stat-lbl">Status SIGITA</div>
          </div>
        </div>

        {/* Upload zone */}
        <div
          className={`admin-up-zone ${drag ? "drag" : ""} ${uploading ? "busy" : ""}`}
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <input ref={fileRef} type="file" accept=".pdf,.txt,.md"
            style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
          <div style={{ fontSize: 32, marginBottom: 8 }}>{uploading ? "⚙️" : "📤"}</div>
          <div className="up-main-txt">
            {uploading ? "Memproses dokumen…" : "Upload Dokumen Baru"}
          </div>
          <div className="up-sub-txt">
            {uploading ? "Mohon tunggu…" : "PDF · TXT · MD — drag & drop atau klik"}
          </div>
          {uploading && <div className="proc-bar" style={{ marginTop: 12 }} />}
        </div>

        {uploadErr && <div className="admin-err">⚠️ {uploadErr}</div>}

        {/* Info banner */}
        {docs.length === 0 && (
          <div className="info-banner">
            <span style={{ fontSize: 18 }}>💡</span>
            <span>Belum ada dokumen. Upload dokumen agar SIGITA dapat menjawab pertanyaan pengguna.</span>
          </div>
        )}

        {/* Document list */}
        {docs.length > 0 && (
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
                    {fmtSize(d.size)} · {(d.content.length / 1000).toFixed(1)}k karakter · {fmtDate(d.uploadedAt)}
                    <span className="doc-uploader"> · oleh {d.uploadedBy}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="doc-active-badge">Aktif</span>
                  <button className="doc-rm-btn" onClick={() => removeDoc(d.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Guide */}
        <div className="admin-guide">
          <div className="guide-title">📋 Panduan Admin</div>
          <div className="guide-body">
            • Dokumen yang diunggah <strong>langsung aktif</strong> — SIGITA akan menjawab berdasarkan dokumen tersebut<br />
            • Bisa unggah <strong>beberapa dokumen</strong> sekaligus — semua akan dijadikan sumber pengetahuan<br />
            • Pengguna <strong>tidak bisa melihat</strong> panel ini atau mengubah dokumen<br />
            • Hapus dokumen jika sudah tidak relevan atau perlu diperbarui<br />
            • <strong>Format didukung:</strong> PDF, TXT, Markdown (.md)
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  USER CHAT
// ═════════════════════════════════════════════════════════════════════════════
function UserChat({ docs }) {
  const hasDoc = docs.length > 0;
  const [msgs, setMsgs] = useState([{
    id: "0", role: "assistant", ts: new Date(),
    content: hasDoc
      ? `Halo! Selamat datang di layanan **SIGITA** 🇮🇩\n\n*Sistem Informasi & Asisten Digital Talenta — BPT Komdigi*\n\nSaya siap membantu Anda dengan informasi seputar:\n• Program Digital Talent Scholarship (DTS) 2025\n• Cara pendaftaran & persyaratan\n• Jadwal & tahapan seleksi\n• Sertifikasi & mitra industri\n\nSilakan ajukan pertanyaan Anda!`
      : `Halo! Saya **SIGITA** 🇮🇩\n\nSistem kami sedang dalam persiapan. Untuk informasi lebih lanjut, silakan hubungi tim BPT Komdigi di **digitalent@kominfo.go.id**.`,
  }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = useCallback(async () => {
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "22px";
    const userMsg = { id: uid(), role: "user", ts: new Date(), content: t };
    setMsgs((p) => [...p, userMsg]);
    setBusy(true);
    try {
      const currentDocs = DocStore.get();
      const history = msgs.filter((m) => m.id !== "0").slice(-10);
      const res = await callAPI(t, currentDocs, history);
      setMsgs((p) => [...p, { id: uid(), role: "assistant", ts: new Date(), content: res }]);
    } catch (e) {
      setMsgs((p) => [...p, { id: uid(), role: "assistant", ts: new Date(), content: `⚠️ Terjadi kesalahan: ${e.message}` }]);
    } finally {
      setBusy(false);
      setTimeout(() => taRef.current?.focus(), 80);
    }
  }, [input, busy, msgs]);

  const QUICK = hasDoc
    ? ["Apa itu BPT Komdigi?", "Program DTS 2025 apa saja?", "Cara daftar & syaratnya?", "Apakah program ini gratis?"]
    : [];

  return (
    <div className="user-chat">
      {/* Header */}
      <div className="hdr">
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div className="lring"><div className="lring-spin" /><div className="lring-in">S</div></div>
          <div>
            <h1 className="hdr-title">SIGITA</h1>
            <p className="hdr-sub">Asisten Digital Talenta · BPT Komdigi</p>
          </div>
        </div>
        <div className="hdr-right">
          <div className="hdr-badge">🇮🇩 Komdigi</div>
        </div>
      </div>

      {/* Status bar */}
      <div className="status-bar">
        <div className={`sd ${busy ? "think" : hasDoc ? "on" : "warn"}`} />
        <span className="slbl">
          {busy ? "SIGITA sedang memproses…"
            : hasDoc ? `Siap membantu · ${docs.length} sumber pengetahuan aktif`
            : "Sistem sedang dipersiapkan"}
        </span>
      </div>

      {/* Messages */}
      <div className="msgs">
        {msgs.map((m) => (
          <div key={m.id} className={`bbl ${m.role === "user" ? "usr" : ""}`}>
            <div className={`av ${m.role === "user" ? "usr" : "bot"}`}>
              <span>{m.role === "user" ? "U" : "S"}</span>
            </div>
            <div className="bbl-wrap">
              <div className={`bubble ${m.role === "user" ? "usr" : "bot"}`}
                dangerouslySetInnerHTML={{ __html: renderMd(m.content) }} />
              <span className="bts">{fmtTime(m.ts)}</span>
            </div>
          </div>
        ))}
        {busy && (
          <div className="bbl">
            <div className="av bot"><span>S</span></div>
            <div className="bbl-wrap">
              <div className="bubble bot" style={{ padding: "13px 18px" }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="tdot"
                      style={{ animation: `bounce 1.1s ${i * 0.18}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick chips */}
      {QUICK.length > 0 && msgs.length <= 1 && !busy && (
        <div className="chips">
          {QUICK.map((q, i) => (
            <button key={q} className="chip"
              style={{ animationDelay: `${i * 0.07}s` }}
              onClick={() => { setInput(q); taRef.current?.focus(); }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="inp-wrap">
        <div className="ibox">
          <textarea ref={taRef} className="ita"
            placeholder="Ketik pertanyaan Anda…"
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1} style={{ height: "22px" }}
            onInput={(e) => { e.target.style.height = "22px"; e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px"; }}
          />
          <button className="sbtn" onClick={send} disabled={!input.trim() || busy}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="foot">SIGITA · BPT Komdigi RI 🇮🇩 · Dijawab berdasarkan dokumen resmi</p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  ROOT APP
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [mode, setMode] = useState("user"); // "user" | "admin-login" | "admin"
  const [adminUser, setAdminUser] = useState(null);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    setDocs(DocStore.get());
  }, []);

  const handleLogin = (username) => {
    setAdminUser(username);
    setMode("admin");
  };

  const handleLogout = () => {
    setAdminUser(null);
    setMode("user");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#060D1F;font-family:'Plus Jakarta Sans',sans-serif;}

        @keyframes msgIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:.3}30%{transform:translateY(-8px);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spinSlow{to{transform:rotate(360deg)}}
        @keyframes sPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.55);opacity:.55}}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes chipIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

        /* ─ LAYOUT ─ */
        .root{min-height:100vh;display:flex;align-items:center;justify-content:center;
          background:#060D1F;
          background-image:radial-gradient(ellipse 80% 55% at 50% -5%,rgba(0,87,200,.22) 0%,transparent 70%),
            radial-gradient(ellipse 40% 30% at 88% 88%,rgba(230,57,70,.07) 0%,transparent 60%);
          padding:20px;position:relative;}
        .grid{position:fixed;inset:0;pointer-events:none;
          background-image:linear-gradient(rgba(0,87,200,.04) 1px,transparent 1px),
            linear-gradient(90deg,rgba(0,87,200,.04) 1px,transparent 1px);
          background-size:52px 52px;
          mask-image:radial-gradient(ellipse 100% 75% at 50% 0%,black 0%,transparent 80%);}

        /* ─ MODE SWITCHER ─ */
        .mode-sw{position:fixed;bottom:20px;right:20px;z-index:100;
          background:rgba(7,15,37,.92);border:1px solid rgba(0,87,200,.3);
          border-radius:14px;padding:6px;display:flex;gap:5px;
          box-shadow:0 8px 30px rgba(0,0,0,.4);backdrop-filter:blur(16px);}
        .sw-btn{padding:7px 14px;border-radius:10px;border:none;cursor:pointer;
          font-size:11px;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;
          transition:all .2s;letter-spacing:.02em;}
        .sw-btn.user{background:rgba(0,87,200,.12);color:rgba(148,163,184,.7);}
        .sw-btn.user.act{background:rgba(0,87,200,.25);color:#93C5FD;border:1px solid rgba(0,140,255,.35);}
        .sw-btn.adm{background:rgba(230,57,70,.1);color:rgba(255,107,117,.6);}
        .sw-btn.adm.act{background:rgba(230,57,70,.2);color:#FF6B75;border:1px solid rgba(230,57,70,.35);}

        /* ─ LOGO RING (shared) ─ */
        .lring{position:relative;width:42px;height:42px;flex-shrink:0;}
        .lring.sm{width:36px;height:36px;}
        .lring-spin{position:absolute;inset:0;border:2px solid rgba(255,255,255,.1);border-top-color:#E63946;border-radius:50%;animation:spinSlow 3.5s linear infinite;}
        .lring.sm .lring-spin{inset:0;}
        .lring-in{position:absolute;inset:5px;background:linear-gradient(135deg,#0057C8,#003580);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:#fff;letter-spacing:-.03em;}
        .lring.sm .lring-in{inset:4px;font-size:11px;}

        /* ─ USER CHAT CARD ─ */
        .user-chat{width:100%;max-width:460px;height:700px;
          background:rgba(7,15,37,.9);backdrop-filter:blur(32px);
          border:1px solid rgba(0,87,200,.2);border-radius:24px;
          display:flex;flex-direction:column;overflow:hidden;
          box-shadow:0 0 0 1px rgba(255,255,255,.04) inset,0 28px 90px rgba(0,0,0,.65);
          animation:fadeUp .45s ease-out;position:relative;}
        .user-chat::before{content:'';position:absolute;top:0;left:10%;right:10%;height:1px;
          background:linear-gradient(90deg,transparent,rgba(0,140,255,.4),rgba(230,57,70,.2),transparent);}

        /* ─ CHAT HEADER ─ */
        .hdr{padding:14px 18px;flex-shrink:0;
          background:linear-gradient(180deg,rgba(0,48,115,.93) 0%,rgba(0,34,88,.75) 100%);
          border-bottom:1px solid rgba(0,87,200,.17);position:relative;overflow:hidden;
          display:flex;align-items:center;justify-content:space-between;}
        .hdr::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.07;
          background:repeating-linear-gradient(45deg,rgba(255,255,255,.2) 0,rgba(255,255,255,.2) 1px,transparent 1px,transparent 10px);}
        .hdr-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:#fff;letter-spacing:.04em;line-height:1;position:relative;}
        .hdr-sub{font-size:10px;color:rgba(255,255,255,.48);margin-top:3px;letter-spacing:.05em;text-transform:uppercase;position:relative;}
        .hdr-right{display:flex;align-items:center;gap:8px;position:relative;}
        .hdr-badge{background:rgba(230,57,70,.13);border:1px solid rgba(230,57,70,.3);border-radius:20px;padding:4px 9px;font-size:10px;font-weight:600;color:#FF6B75;letter-spacing:.04em;text-transform:uppercase;}

        /* ─ STATUS BAR ─ */
        .status-bar{display:flex;align-items:center;gap:8px;padding:8px 18px;background:rgba(0,0,0,.2);border-bottom:1px solid rgba(0,87,200,.1);flex-shrink:0;}
        .sd{width:7px;height:7px;border-radius:50%;flex-shrink:0;animation:sPulse 2s ease-in-out infinite;}
        .sd.on{background:#4ADE80;} .sd.think{background:#FBBF24;} .sd.warn{background:#F97316;}
        .slbl{font-size:11px;color:rgba(148,163,184,.5);font-weight:500;}

        /* ─ MESSAGES ─ */
        .msgs{flex:1;overflow-y:auto;padding:14px 14px 6px;
          scrollbar-width:thin;scrollbar-color:rgba(0,87,200,.2) transparent;}
        .msgs::-webkit-scrollbar{width:3px;}
        .msgs::-webkit-scrollbar-thumb{background:rgba(0,87,200,.22);border-radius:4px;}
        .bbl{display:flex;align-items:flex-end;gap:9px;margin-bottom:16px;animation:msgIn .35s cubic-bezier(.34,1.56,.64,1);}
        .bbl.usr{flex-direction:row-reverse;}
        .av{width:30px;height:30px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
        .av.bot{background:linear-gradient(135deg,#003580,#0057C8);box-shadow:0 3px 10px rgba(0,53,128,.38);}
        .av.usr{background:linear-gradient(135deg,#E63946,#C1121F);box-shadow:0 3px 10px rgba(230,57,70,.35);}
        .av span{font-size:10px;font-weight:700;color:#fff;}
        .bbl-wrap{display:flex;flex-direction:column;max-width:76%;}
        .bbl.usr .bbl-wrap{align-items:flex-end;}
        .bubble{font-family:'Plus Jakarta Sans',sans-serif;font-size:13.5px;line-height:1.68;padding:11px 15px;}
        .bubble.bot{background:rgba(255,255,255,.055);backdrop-filter:blur(10px);border:1px solid rgba(0,87,200,.15);border-radius:3px 15px 15px 15px;color:#CBD5E1;box-shadow:0 2px 12px rgba(0,0,0,.18);}
        .bubble.bot strong{color:#93C5FD;}
        .bubble.usr{background:linear-gradient(135deg,#0057C8,#003580);border-radius:15px 3px 15px 15px;color:#fff;box-shadow:0 4px 14px rgba(0,53,128,.35);}
        .bts{font-size:10px;color:rgba(148,163,184,.35);margin-top:4px;}
        .tdot{width:6px;height:6px;border-radius:50%;background:#0057C8;display:inline-block;}

        /* ─ CHIPS ─ */
        .chips{display:flex;flex-wrap:wrap;gap:7px;padding:6px 14px 12px;flex-shrink:0;}
        .chip{background:rgba(0,87,200,.1);border:1px solid rgba(0,87,200,.28);color:#93C5FD;
          border-radius:20px;padding:6px 13px;font-size:12px;font-weight:500;cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;
          animation:chipIn .3s ease-out both;}
        .chip:hover{background:rgba(0,87,200,.22);border-color:rgba(0,140,255,.45);color:#BFDBFE;transform:translateY(-1px);}

        /* ─ INPUT ─ */
        .inp-wrap{padding:10px 14px 14px;border-top:1px solid rgba(0,87,200,.12);flex-shrink:0;}
        .ibox{display:flex;align-items:flex-end;gap:9px;background:rgba(255,255,255,.045);
          border:1.5px solid rgba(0,87,200,.18);border-radius:15px;padding:9px 9px 9px 14px;
          transition:border-color .2s,box-shadow .2s;}
        .ibox:focus-within{border-color:rgba(0,140,255,.42);box-shadow:0 0 0 3px rgba(0,87,200,.09);}
        .ita{flex:1;border:none;outline:none;background:transparent;font-family:'Plus Jakarta Sans',sans-serif;
          font-size:14px;color:#E2E8F0;resize:none;min-height:22px;max-height:90px;line-height:1.5;}
        .ita::placeholder{color:rgba(148,163,184,.38);}
        .sbtn{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#E63946,#C1121F);
          border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;
          transition:transform .15s,box-shadow .2s;box-shadow:0 3px 12px rgba(230,57,70,.3);}
        .sbtn:hover:not(:disabled){transform:scale(1.07);box-shadow:0 4px 18px rgba(230,57,70,.46);}
        .sbtn:active:not(:disabled){transform:scale(.93);}
        .sbtn:disabled{background:rgba(255,255,255,.06);box-shadow:none;cursor:not-allowed;}
        .foot{text-align:center;font-size:10px;color:rgba(148,163,184,.28);margin-top:7px;letter-spacing:.03em;}

        /* ─ ADMIN PANEL ─ */
        .admin-panel{width:100%;max-width:640px;min-height:700px;max-height:90vh;
          background:rgba(7,15,37,.92);backdrop-filter:blur(32px);
          border:1px solid rgba(0,87,200,.2);border-radius:24px;
          display:flex;flex-direction:column;overflow:hidden;
          box-shadow:0 0 0 1px rgba(255,255,255,.04) inset,0 28px 90px rgba(0,0,0,.65);
          animation:fadeUp .4s ease-out;position:relative;}
        .admin-panel::before{content:'';position:absolute;top:0;left:8%;right:8%;height:1px;
          background:linear-gradient(90deg,transparent,rgba(230,57,70,.5),rgba(0,140,255,.3),transparent);}

        .admin-hdr{padding:16px 22px;background:linear-gradient(180deg,rgba(100,20,20,.85) 0%,rgba(60,10,10,.7) 100%);
          border-bottom:1px solid rgba(230,57,70,.18);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;position:relative;overflow:hidden;}
        .admin-hdr::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.06;
          background:repeating-linear-gradient(45deg,rgba(255,255,255,.3) 0,rgba(255,255,255,.3) 1px,transparent 1px,transparent 10px);}
        .admin-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:#fff;letter-spacing:.04em;position:relative;}
        .admin-sub{font-size:10px;color:rgba(255,255,255,.45);margin-top:3px;letter-spacing:.05em;text-transform:uppercase;position:relative;}
        .admin-user-badge{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:5px 12px;font-size:11px;color:rgba(255,255,255,.6);font-weight:500;}
        .admin-dot{width:6px;height:6px;border-radius:50%;background:#4ADE80;animation:sPulse 2s ease-in-out infinite;}
        .logout-btn{background:rgba(230,57,70,.15);border:1px solid rgba(230,57,70,.28);border-radius:9px;
          color:#FF6B75;font-size:11px;padding:6px 12px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:600;transition:background .2s;}
        .logout-btn:hover{background:rgba(230,57,70,.28);}

        .admin-body{flex:1;overflow-y:auto;padding:18px 22px;display:flex;flex-direction:column;gap:14px;
          scrollbar-width:thin;scrollbar-color:rgba(230,57,70,.2) transparent;}

        .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
        .stat-card{background:rgba(255,255,255,.04);border:1px solid rgba(0,87,200,.15);border-radius:12px;padding:14px;text-align:center;}
        .stat-num{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#93C5FD;}
        .stat-lbl{font-size:10px;color:rgba(148,163,184,.5);margin-top:3px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;}

        .admin-up-zone{border:2px dashed rgba(230,57,70,.25);border-radius:14px;padding:26px 16px;text-align:center;
          cursor:pointer;background:rgba(230,57,70,.03);transition:all .2s;}
        .admin-up-zone:hover,.admin-up-zone.drag{border-color:rgba(230,57,70,.5);background:rgba(230,57,70,.08);}
        .admin-up-zone.busy{cursor:wait;opacity:.8;}
        .up-main-txt{color:#FF6B75;font-size:13px;font-weight:600;margin-bottom:3px;}
        .up-sub-txt{color:rgba(148,163,184,.42);font-size:11px;}
        .proc-bar{height:3px;border-radius:2px;
          background:linear-gradient(90deg,rgba(230,57,70,.1),rgba(230,57,70,.5),rgba(0,140,255,.4),rgba(230,57,70,.1));
          background-size:400px 3px;animation:shimmer 1.4s linear infinite;}

        .admin-err{background:rgba(230,57,70,.08);border:1px solid rgba(230,57,70,.22);border-radius:10px;padding:11px 14px;font-size:12px;color:#FF6B75;}
        .info-banner{background:rgba(0,87,200,.07);border:1px solid rgba(0,87,200,.18);border-radius:11px;padding:13px;font-size:12px;color:rgba(148,163,184,.6);display:flex;align-items:flex-start;gap:9px;line-height:1.6;}

        .doc-list{border:1px solid rgba(0,87,200,.15);border-radius:14px;overflow:hidden;}
        .doc-list-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(0,87,200,.1);border-bottom:1px solid rgba(0,87,200,.15);font-size:12px;font-weight:600;color:#93C5FD;}
        .doc-count{background:rgba(0,87,200,.2);border-radius:10px;padding:2px 8px;font-size:11px;color:#60A5FA;}
        .admin-doc-item{display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid rgba(0,87,200,.08);transition:background .2s;}
        .admin-doc-item:last-child{border-bottom:none;}
        .admin-doc-item:hover{background:rgba(0,87,200,.06);}
        .doc-icon-wrap{width:36px;height:36px;background:rgba(0,87,200,.12);border:1px solid rgba(0,87,200,.2);border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .doc-detail{flex:1;min-width:0;}
        .doc-item-name{color:#CBD5E1;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .doc-item-meta{color:rgba(148,163,184,.42);font-size:11px;margin-top:2px;}
        .doc-uploader{color:rgba(148,163,184,.3);}
        .doc-active-badge{background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);color:#4ADE80;border-radius:8px;padding:3px 8px;font-size:10px;font-weight:600;white-space:nowrap;}
        .doc-rm-btn{background:rgba(230,57,70,.1);border:1px solid rgba(230,57,70,.2);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;transition:background .2s;}
        .doc-rm-btn:hover{background:rgba(230,57,70,.25);}

        .admin-guide{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:14px;}
        .guide-title{font-size:12px;font-weight:700;color:#93C5FD;margin-bottom:8px;}
        .guide-body{font-size:12px;color:rgba(148,163,184,.55);line-height:1.8;}
        .guide-body strong{color:rgba(148,163,184,.8);}

        /* ─ LOGIN ─ */
        .login-overlay{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;
          background:rgba(0,0,0,.75);backdrop-filter:blur(10px);padding:20px;}
        .login-card{width:100%;max-width:380px;background:rgba(8,16,38,.96);
          border:1px solid rgba(230,57,70,.25);border-radius:20px;padding:28px 24px;
          box-shadow:0 0 0 1px rgba(255,255,255,.04) inset,0 24px 80px rgba(0,0,0,.7);
          animation:fadeUp .35s ease-out;position:relative;}
        .login-card::before{content:'';position:absolute;top:0;left:15%;right:15%;height:1px;
          background:linear-gradient(90deg,transparent,rgba(230,57,70,.5),transparent);}
        .login-top{display:flex;align-items:center;gap:12px;margin-bottom:6px;}
        .login-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#fff;letter-spacing:.03em;}
        .login-sub{font-size:11px;color:rgba(255,255,255,.4);margin-top:2px;text-transform:uppercase;letter-spacing:.05em;}
        .login-desc{font-size:12px;color:rgba(148,163,184,.5);margin-bottom:18px;line-height:1.6;}
        .lfield{margin-bottom:14px;}
        .llabel{display:block;font-size:11px;font-weight:600;color:rgba(148,163,184,.6);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;}
        .linput{width:100%;background:rgba(255,255,255,.05);border:1.5px solid rgba(230,57,70,.2);border-radius:10px;
          padding:10px 14px;font-size:14px;color:#E2E8F0;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:border-color .2s;}
        .linput:focus{border-color:rgba(230,57,70,.5);}
        .show-pass{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:14px;opacity:.5;}
        .lerr{background:rgba(230,57,70,.1);border:1px solid rgba(230,57,70,.25);border-radius:9px;padding:9px 12px;font-size:12px;color:#FF6B75;margin-bottom:12px;}
        .lbtn{width:100%;padding:12px;background:linear-gradient(135deg,#E63946,#C1121F);border:none;border-radius:11px;
          color:#fff;font-size:14px;font-weight:700;font-family:'Syne',sans-serif;cursor:pointer;letter-spacing:.04em;
          transition:transform .15s,box-shadow .2s;box-shadow:0 4px 16px rgba(230,57,70,.3);}
        .lbtn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 22px rgba(230,57,70,.45);}
        .lbtn:disabled{opacity:.6;cursor:wait;}
        .lspinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spinSlow .7s linear infinite;display:inline-block;}
        .lhint{font-size:10.5px;color:rgba(148,163,184,.3);text-align:center;margin-top:14px;}

        /* ─ TOAST ─ */
        .toast{position:absolute;top:72px;left:50%;transform:translateX(-50%);
          background:rgba(7,15,37,.95);border:1px solid rgba(0,87,200,.3);border-radius:10px;
          padding:9px 16px;font-size:12px;font-weight:600;color:#93C5FD;
          box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:50;white-space:nowrap;
          animation:toastIn .3s ease-out;}
        .toast.warn{border-color:rgba(230,57,70,.3);color:#FF6B75;}
      `}</style>

      {/* Login modal */}
      {mode === "admin-login" && (
        <AdminLogin onLogin={handleLogin} />
      )}

      <div style={{ position: "relative" }}>
        <div className="grid" />

        {/* Main content */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
          {mode === "admin" ? (
            <AdminPanel
              adminUser={adminUser}
              docs={docs}
              onDocsChange={setDocs}
              onLogout={handleLogout}
            />
          ) : (
            <UserChat docs={docs} />
          )}
        </div>

        {/* Mode switcher (demo purposes — hide in production) */}
        <div className="mode-sw">
          <button
            className={`sw-btn user ${mode === "user" ? "act" : ""}`}
            onClick={() => setMode("user")}>
            💬 User
          </button>
          <button
            className={`sw-btn adm ${mode === "admin" || mode === "admin-login" ? "act" : ""}`}
            onClick={() => mode !== "admin" ? setMode("admin-login") : setMode("admin")}>
            🔐 Admin
          </button>
        </div>
      </div>
    </>
  );
}
