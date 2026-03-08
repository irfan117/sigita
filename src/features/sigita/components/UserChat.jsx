import ChatHeader from "./chat/ChatHeader";
import ChatInput from "./chat/ChatInput";
import ChatStatusBar from "./chat/ChatStatusBar";
import MessageList from "./chat/MessageList";
import QuickChips from "./chat/QuickChips";
import { useChat } from "../hooks/useChat";

export default function UserChat({ docs }) {
  const { hasDoc, msgs, input, busy, endRef, taRef, quick, setInput, send, pickQuick } = useChat({ docs });

  return (
    <div className="user-chat">
      <ChatHeader />
      <ChatStatusBar busy={busy} hasDoc={hasDoc} docsCount={docs.length} />
      <MessageList msgs={msgs} busy={busy} endRef={endRef} />
      {quick.length > 0 && msgs.length <= 1 && !busy && (
        <QuickChips quick={quick} onPick={pickQuick} />
      )}
      <ChatInput input={input} busy={busy} taRef={taRef} setInput={setInput} onSend={send} />
    </div>
  );
}
