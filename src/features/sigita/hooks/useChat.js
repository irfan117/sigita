import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QUICK_QUESTIONS, WELCOME_NO_DOCS, WELCOME_WITH_DOCS } from "../lib/constants";
import { DocStore } from "../lib/docStore";
import { callAPI } from "../lib/services";
import { uid } from "../lib/utils";

export function useChat({ docs }) {
  const hasDoc = docs.length > 0;
  const [msgs, setMsgs] = useState([
    {
      id: "0",
      role: "assistant",
      ts: new Date(),
      content: hasDoc ? WELCOME_WITH_DOCS : WELCOME_NO_DOCS,
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    const nextWelcome = hasDoc ? WELCOME_WITH_DOCS : WELCOME_NO_DOCS;
    setMsgs((prev) => {
      if (prev.length !== 1 || prev[0]?.id !== "0") return prev;
      if (prev[0].content === nextWelcome) return prev;
      return [{ ...prev[0], content: nextWelcome }];
    });
  }, [hasDoc]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

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
      setMsgs((p) => [
        ...p,
        { id: uid(), role: "assistant", ts: new Date(), content: `⚠️ Terjadi kesalahan: ${e.message}` },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => taRef.current?.focus(), 80);
    }
  }, [busy, input, msgs]);

  const quick = useMemo(() => (hasDoc ? QUICK_QUESTIONS : []), [hasDoc]);

  const pickQuick = (q) => {
    setInput(q);
    taRef.current?.focus();
  };

  return {
    hasDoc,
    msgs,
    input,
    busy,
    endRef,
    taRef,
    quick,
    setInput,
    send,
    pickQuick,
  };
}
