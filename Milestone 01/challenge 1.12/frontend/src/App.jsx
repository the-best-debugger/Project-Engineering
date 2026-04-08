import React, { useEffect, useMemo, useRef, useState } from "react";

function MessageBubble({ role, content }) {
  return <div className={`message ${role}`}>{content}</div>;
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const chatDisplayRef = useRef(null);

  const chatBackendUrl = useMemo(() => {
    // Prefer runtime override if provided, then fall back to Vite env, then localhost default.
    // This keeps backend calls server-side (the frontend never sees any AI API keys).
    const runtimeOverride =
      typeof window !== "undefined" && window.CHAT_BACKEND_URL
        ? window.CHAT_BACKEND_URL
        : null;
    const envOverride = import.meta.env.VITE_CHAT_BACKEND_URL || null;
    return runtimeOverride || envOverride || "http://localhost:3002/chat";
  }, []);

  useEffect(() => {
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];

    // Optimistic update for responsiveness.
    setMessages(nextMessages);
    setText("");
    setIsSending(true);

    try {
      const response = await fetch(chatBackendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data && data.error ? data.error : `Request failed (${response.status})`;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${errorMsg}` },
        ]);
        return;
      }

      const reply = data.reply;
      if (typeof reply !== "string" || !reply.trim()) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error: empty reply from server" },
        ]);
        return;
      }

      // Add assistant message to state so the next request includes full context.
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${String(err)}` },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="chat-container">
      <header>
        <h1>AI Chatbot</h1>
      </header>

      <div ref={chatDisplayRef} className="chat-display">
        {messages.map((m, idx) => (
          <MessageBubble key={`${m.role}-${idx}`} role={m.role} content={m.content} />
        ))}
      </div>

      <div className="input-area">
        <input
          id="messageInput"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message here..."
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          disabled={isSending}
        />
        <button id="sendBtn" onClick={sendMessage} disabled={isSending}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

