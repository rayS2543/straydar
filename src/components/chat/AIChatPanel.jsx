import { useEffect, useRef, useState } from 'react'
import { X, Send, PawPrint, KeyRound } from 'lucide-react'
import { getAssistantReply } from '../../services/aiAssistant'
import { useApiKey } from '../../hooks/useApiKey'

const QUICK_PROMPTS = [
  'How do I do TNR?',
  'How do I approach a skittish cat?',
  'What do I feed a kitten?',
  'Does this wound need a vet?',
]

const GREETING = {
  role: 'assistant',
  content:
    "Hi, I'm the Stray Helper AI. Ask me about trap-neuter-return, approaching a nervous cat, " +
    "feeding kittens, or whether a wound needs urgent vet care.",
}

export function AIChatPanel({ open, onClose }) {
  const { apiKey, setApiKey } = useApiKey()
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [showKeyField, setShowKeyField] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, sending])

  const sendMessage = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    const nextMessages = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)
    setError(null)

    try {
      const { reply } = await getAssistantReply({ messages: nextMessages, apiKey })
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className={`fixed inset-y-0 right-0 z-[1000] flex w-full max-w-sm transform flex-col border-l border-line bg-card shadow-2xl transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <PawPrint className="text-brand" size={20} />
          <h2 className="font-semibold text-ink">Stray Helper AI</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowKeyField((v) => !v)}
            className="rounded-full p-1.5 text-muted hover:bg-card-soft"
            aria-label="AI settings"
          >
            <KeyRound size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-card-soft"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {showKeyField && (
        <div className="border-b border-line bg-card-soft px-4 py-3">
          <label className="mb-1 block text-xs font-medium text-ink">
            Anthropic API key (optional)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-faint">
            Stored only in this browser&rsquo;s local storage, sent only to Anthropic&rsquo;s API.
            Without a key you&rsquo;ll get quick offline guidance instead of live AI answers.
          </p>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-brand text-white'
                : 'bg-card-soft text-ink'
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="max-w-[85%] rounded-2xl bg-card-soft px-3 py-2 text-sm text-faint">
            Thinking…
          </div>
        )}
        {error && (
          <div className="max-w-[85%] rounded-2xl bg-status-lost/10 px-3 py-2 text-sm text-status-lost">
            {error}
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 border-t border-line px-4 py-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:bg-card-soft"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage(input)
        }}
        className="flex items-center gap-2 border-t border-line px-3 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about TNR, feeding, wounds..."
          className="flex-1 rounded-full border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-50"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
