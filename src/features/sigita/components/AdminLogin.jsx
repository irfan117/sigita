import { useState } from "react";
import { ADMIN_CREDENTIALS } from "../lib/constants";

export default function AdminLogin({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async () => {
    if (!u.trim() || !p.trim()) {
      setErr("Isi username dan password.");
      return;
    }

    setLoading(true);
    setErr("");
    await new Promise((r) => setTimeout(r, 700));

    const match = ADMIN_CREDENTIALS.find((c) => c.username === u && c.password === p);
    if (match) {
      onLogin(u);
      return;
    }

    setErr("Username atau password salah.");
    setLoading(false);
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-top">
          <div className="lring sm">
            <div className="lring-spin" />
            <div className="lring-in">S</div>
          </div>
          <div>
            <h2 className="login-title">Admin Panel</h2>
            <p className="login-sub">BPT Komdigi · SIGITA</p>
          </div>
        </div>
        <p className="login-desc">Masuk untuk mengelola dokumen pengetahuan SIGITA</p>

        <div className="lfield">
          <label className="llabel">Username</label>
          <input
            className="linput"
            placeholder="admin.bpt"
            value={u}
            onChange={(e) => setU(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <div className="lfield">
          <label className="llabel">Password</label>
          <div style={{ position: "relative" }}>
            <input
              className="linput"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={p}
              onChange={(e) => setP(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
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
