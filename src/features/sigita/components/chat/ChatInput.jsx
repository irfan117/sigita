export default function ChatInput({ input, busy, taRef, setInput, onSend }) {
  return (
    <div className="inp-wrap">
      <div className="ibox">
        <textarea
          ref={taRef}
          className="ita"
          placeholder="Ketik pertanyaan Anda…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={1}
          style={{ height: "22px" }}
          onInput={(e) => {
            e.target.style.height = "22px";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 90)}px`;
          }}
        />
        <button className="sbtn" onClick={onSend} disabled={!input.trim() || busy}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
      <p className="foot">SIGITA · BPT Komdigi RI 🇮🇩 · Dijawab berdasarkan dokumen resmi</p>
    </div>
  );
}
