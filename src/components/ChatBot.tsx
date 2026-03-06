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

  const startListening = () => { if (recognitionRef.current) { setIsListening(true); recognitionRef.current.start(); } };
  const stopListening = () => { if (recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); } };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;
    const userMessage = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMessage, history: messages.slice(-6) }) });
      const data = await response.json();
      if (data.reply) { setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]); speakText(data.reply); }
      else { setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, try again!' }]); }
    } catch (error) { setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Try again!' }]); }
    finally { setIsLoading(false); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const toggleVoice = () => { 
    if (isSpeaking) { 
      window.speechSynthesis.cancel(); 
      setIsSpeaking(false); 
    } else { 
      const lastMsg = [...messages].reverse().find(m => m.role === 'assistant'); 
      if (lastMsg) speakText(lastMsg.content); 
    } 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#121212]/95 z-50 flex flex-col">
      <div className="bg-[#181818] p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl">🤖</span>
          <h3 className="font-bold">Sofia Guide AI</h3>
        </div>
        <button onClick={onClose} className="text-[#b3b3b3] hover:text-white text-2xl">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-bg-[#00D47E] text-black' : 'bg-[#282828] text-white'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && <div className="flex justify-start"><div className="bg-[#282828] p-3 rounded-xl"><div className="flex gap-1"><div className="w-2 h-2 bg-[#b3b3b3] rounded-full animate-bounce"></div><div className="w-2 h-2 bg-[#b3b3b3] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div><div className="w-2 h-2 bg-[#b3b3b3] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div></div></div></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-[#181818] p-4">
        <div className="flex gap-2 items-center">
          <button onClick={isListening ? stopListening : startListening} className={`p-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-[#282828]'}`}>
            🎤
          </button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask about Sofia..." className="flex-1 bg-[#282828] text-white px-4 py-3 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-bg-[#00D47E]" disabled={isLoading} />
          <button onClick={toggleVoice} className={`p-3 rounded-full ${isSpeaking ? 'bg-bg-[#00D47E]' : 'bg-[#282828]'}`}>
            {isSpeaking ? '🔊' : '🔈'}
          </button>
          <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} className="bg-bg-[#00D47E] hover:bg-[#00D47E] text-black p-3 rounded-full disabled:opacity-50">
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
