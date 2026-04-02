import { useState, useRef, useEffect } from 'react';
import { Send, Zap, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Patient } from '../types';
import { sendChatMessage, ChatMessage } from '../api/agent';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'user',
    content: 'What are the main blockers to discharging this patient today?',
  },
  {
    role: 'assistant',
    content:
      "Based on the chart, the primary barrier is a pending blood culture result at 48 hours. The patient is clinically improving — afebrile, tolerating oral intake — but the infectious disease workup isn't final. I recommend reaching out to the attending now to pre-write a conditional discharge order so you can act quickly once results return.",
  },
  {
    role: 'user',
    content: 'Is there anything else I should do before the end of shift?',
  },
  {
    role: 'assistant',
    content:
      "Yes — three items: (1) The discharge summary hasn't been signed yet. Ping the attending. (2) Patient education for antibiotic completion is still outstanding. (3) PCP follow-up hasn't been scheduled. The case manager can handle #3 now so discharge isn't delayed when labs clear.",
  },
];

export default function AIChat({ patient }: { patient: Patient }) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendChatMessage(newMessages, patient);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Unable to reach the AI assistant. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border border-slate-200 rounded-md overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full px-3 py-2 bg-slate-800 text-white text-xs font-semibold"
      >
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-teal-400" />
          <span>AI Assistant</span>
          <span className="text-slate-400 font-normal">Powered by FlowBoard AI</span>
        </div>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="max-h-56 overflow-y-auto bg-slate-50 p-2 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-2.5 py-1.5 rounded-lg text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm">
                  <Loader2 size={10} className="animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-1 px-2 py-1.5 bg-white border-t border-slate-200">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about this patient…"
              className="flex-1 text-xs px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-teal-400 bg-slate-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="p-1.5 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
            >
              <Send size={11} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
