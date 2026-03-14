'use client';

import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string; };
type Props = { isOpen: boolean; onClose: () => void; };

export default function ChatBot({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Hi! I\'m your Sofia guide. Ask me anything! 🇧🇬' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentChatAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentTtsAbortRef = useRef<AbortController | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results).map(result => result[0].transcript).join('');
        if (event.results[0].isFinal) setInput(transcript);
      };
      recognitionRef.current.onend = () => { setIsListening(false); if (input.trim()) sendMessage(input); };
    }
  }, [input]);

  const stopAudio = () => {
    if (currentTtsAbortRef.current) { currentTtsAbortRef.current.abort(); currentTtsAbortRef.current = null; }
    if (currentChatAudioRef.current) { currentChatAudioRef.current.pause(); currentChatAudioRef.current = null; }
    setIsSpeaking(false);
  };

  const speakText = async (text: string) => {
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

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;
    const userMessage = text.trim();
    setInput('');
    stopAudio();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMessage, history: messages.slice(-6) }) });
      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        speakText(data.reply); // auto-play — no button needed
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, try again!' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Try again!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleMic = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    stopAudio(); // stop audio when user starts speaking
    if (recognitionRef.current) { setIsListening(true); recognitionRef.current.start(); }
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
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#282828] p-3 rounded-xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#b3b3b3] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#b3b3b3] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-[#b3b3b3] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#181818] p-4">
        <div className="flex gap-2 items-center">
          <button
            onClick={handleMic}
            className={`p-3 rounded-full transition-colors ${isListening ? 'bg-red-500 animate-pulse' : 'bg-[#282828] hover:bg-[#333]'}`}
            title={isListening ? 'Stop listening' : 'Speak'}
          >
            🎤
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about Sofia..."
            className="flex-1 bg-[#282828] text-white px-4 py-3 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#8DC63F]"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="bg-[#00D47E] text-black p-3 rounded-full disabled:opacity-50 hover:bg-[#00b368] transition-colors"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
