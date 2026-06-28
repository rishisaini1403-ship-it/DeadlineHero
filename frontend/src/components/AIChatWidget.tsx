import React, { useState, useRef, useEffect } from 'react';
import aiService from '../services/ai.service';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your DeadlineHero AI assistant. How can I help you manage your deadlines today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.chatWithAI(input);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: '📅 Plan my day', message: 'How should I plan my day?' },
    { label: '⚠️ Check risks', message: 'What are my deadline risks?' },
    { label: '🔨 Break down task', message: 'How can I break down my tasks?' },
    { label: '😰 Feeling overwhelmed', message: 'I feel overwhelmed with deadlines' },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full shadow-2xl flex items-center justify-center text-white text-3xl transition-all transform hover:scale-110 z-50"
        title="Chat with AI Assistant"
      >
        🤖
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-2xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">AI Assistant</h3>
            <p className="text-xs text-white/80">Powered by DeadlineHero AI</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200 transition-colors text-2xl"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 bg-gray-50 border-b">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(action.message);
              }}
              className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs hover:bg-purple-50 hover:border-purple-300 transition-all"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-none'
                  : 'bg-white border border-gray-200 rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}
              >
                {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-2xl">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            placeholder="Ask me anything..."
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {loading ? '⏳' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatWidget;
