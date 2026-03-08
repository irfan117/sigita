"use client";

import { useEffect, useState } from "react";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import UserChat from "./components/UserChat";
import { DocStore } from "./lib/docStore";

export default function SigitaApp() {
  const [mode, setMode] = useState("user");
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
      {mode === "admin-login" && <AdminLogin onLogin={handleLogin} />}

      <div style={{ position: "relative" }}>
        <div className="grid" />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "20px",
          }}
        >
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

        <div className="mode-sw">
          <button className={`sw-btn user ${mode === "user" ? "act" : ""}`} onClick={() => setMode("user")}>
            💬 User
          </button>
          <button
            className={`sw-btn adm ${mode === "admin" || mode === "admin-login" ? "act" : ""}`}
            onClick={() => (mode !== "admin" ? setMode("admin-login") : setMode("admin"))}
          >
            🔐 Admin
          </button>
        </div>
      </div>
    </>
  );
}
