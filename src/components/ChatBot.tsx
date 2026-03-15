'use client';

import { useState, useRef, useEffect } from 'react';
import CameraButton from './CameraButton';
import ReactMarkdown from 'react-markdown';

type Message = { role: 'user' | 'assistant'; content: string; };

function linkify(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
  const parts = text.split(urlRegex);
  // After split with a capture group, odd indices are the matched URLs
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-[#8DC63F] hover:text-[#aee05a] break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}
type Props = { isOpen: boolean; onClose: () => void; };

export default function ChatBot({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Hi! I\'m your Sofia guide. Ask me anything! 🇧🇬' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentChatAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentTtsAbortRef = useRef<AbortController | null>(null);
  const isHoldingRef = useRef(false);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
        setInterimText(transcript);
        if (event.results[event.results.length - 1].isFinal) {
          setInterimText('');
          sendMessage(transcript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        setInterimText('');
      };
    }
  }, []);

  const stopAudio = () => {
    if (currentTtsAbortRef.current) { currentTtsAbortRef.current.abort(); currentTtsAbortRef.current = null; }
    if (currentChatAudioRef.current) { currentChatAudioRef.current.pause(); currentChatAudioRef.current = null; }
    setIsSpeaking(false);
  };

  const stripUrls = (text: string) =>
    text.replace(/https?:\/\/[^\s<>"]+/g, '').replace(/\s{2,}/g, ' ').trim();

  const speakText = async (text: string) => {
    text = stripUrls(text);
    stopAudio();
    setIsSpeaking(true);
    const controller = new AbortController();
    currentTtsAbortRef.current = controller;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio('data:audio/mpeg;base64,' + data.audio);
        currentChatAudioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); currentChatAudioRef.current = null; };
        audio.onerror = () => { setIsSpeaking(false); currentChatAudioRef.current = null; };
        audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') setIsSpeaking(false);
    } finally {
      currentTtsAbortRef.current = null;
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    stopAudio();
    setMessages(prev => [...prev, { role: 'user', content: text.trim() }]);
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history: messages.slice(-6) })
      });
      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        speakText(data.reply);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, try again!' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Try again!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Hold to record handlers
  const startHold = () => {
    if (!recognitionRef.current || isLoading) return;
    isHoldingRef.current = true;
    stopAudio();
    setIsListening(true);
    setInterimText('');
    try { recognitionRef.current.start(); } catch {}
  };

  const endHold = () => {
    isHoldingRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#121212]/95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#181818] p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl">🤖</span>
          <h3 className="font-bold">Sofia Guide AI</h3>
          {isSpeaking && (
            <button onClick={stopAudio} className="flex items-center gap-1.5 bg-[#8DC63F]/20 text-[#8DC63F] text-xs px-3 py-1 rounded-full animate-pulse">
              <span>⏹</span> Stop
            </button>
          )}
        </div>
        <button onClick={onClose} className="text-[#b3b3b3] hover:text-white text-2xl">×</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-[#00D47E] text-black' : 'bg-[#282828] text-white'}`}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer"
                        className="underline text-[#8DC63F] hover:text-[#aee05a] break-all"
                        onClick={(e) => e.stopPropagation()}>
                        {children}
                      </a>
                    ),
                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#282828] p-3 rounded-xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#b3b3b3] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[#b3b3b3] rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                <div className="w-2 h-2 bg-[#b3b3b3] rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Hold-to-record bar */}
      <div className="bg-[#181818] p-6 flex flex-col items-center gap-3">
        {isListening && interimText && (
          <p className="text-[#b3b3b3] text-sm italic text-center px-4">{interimText}</p>
        )}
        {isListening ? (
          <p className="text-red-400 text-xs">Release to send</p>
        ) : (
          <p className="text-[#555] text-xs">{isLoading ? 'Thinking...' : 'Hold to speak'}</p>
        )}

        <div className="flex items-center gap-6">
          <CameraButton
            onResult={(message) => {
              setMessages(prev => [...prev, { role: 'assistant', content: message }]);
              speakText(message);
            }}
            onError={(error) => {
              setMessages(prev => [...prev, { role: 'assistant', content: error }]);
            }}
            disabled={isLoading || isListening}
          />

          <button
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={(e) => { e.preventDefault(); startHold(); }}
            onTouchEnd={(e) => { e.preventDefault(); endHold(); }}
            disabled={isLoading}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-150 select-none
              ${isListening
                ? 'bg-red-500 scale-110 shadow-[0_0_24px_rgba(239,68,68,0.6)]'
                : isLoading
                  ? 'bg-[#282828] opacity-50 cursor-not-allowed'
                  : 'bg-[#8DC63F] hover:bg-[#7ab535] active:scale-95 shadow-[0_0_16px_rgba(141,198,63,0.4)]'
              }`}
          >
            🎤
          </button>
        </div>
      </div>
    </div>
  );
}
