import { fmtTime, renderMd } from "../../lib/utils";

export default function MessageList({ msgs, busy, endRef }) {
  return (
    <div className="msgs">
      {msgs.map((m) => (
        <div key={m.id} className={`bbl ${m.role === "user" ? "usr" : ""}`}>
          <div className={`av ${m.role === "user" ? "usr" : "bot"}`}>
            <span>{m.role === "user" ? "U" : "S"}</span>
          </div>
          <div className="bbl-wrap">
            <div
              className={`bubble ${m.role === "user" ? "usr" : "bot"}`}
              dangerouslySetInnerHTML={{ __html: renderMd(m.content) }}
            />
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
                  <span
                    key={i}
                    className="tdot"
                    style={{ animation: `bounce 1.1s ${i * 0.18}s ease-in-out infinite` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
