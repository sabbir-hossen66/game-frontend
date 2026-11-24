'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { ChatMessage, UserProfile } from '../../types';

interface ChatBoxProps {
  messages: ChatMessage[];
  myProfile: UserProfile;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
}

const QUICK_EMOJIS = ['🔥', '🎮', '🤣', '👏', '🏆', '💀', '😱', '👍'];

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  myProfile,
  onSendMessage,
  onSendReaction,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Arena Chat
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">Real-time</span>
      </div>

      {/* Messages Feed */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 py-6 italic text-[11px]">
            No messages yet. Say hello or cheer with emojis!
          </div>
        )}

        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div
                key={msg.id}
                className="text-center py-1 px-2.5 my-1 rounded-xl bg-slate-800/40 text-slate-400 text-[11px] font-medium"
              >
                {msg.text}
              </div>
            );
          }

          if (msg.type === 'reaction') {
            return (
              <div key={msg.id} className="flex items-center justify-center py-1">
                <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-lg shadow-sm animate-bounce">
                  {msg.emoji}
                </span>
              </div>
            );
          }

          const isMe = msg.senderId === myProfile.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <span className="text-base select-none">{msg.senderAvatar}</span>
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 ${
                  isMe
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/60'
                }`}
              >
                {!isMe && (
                  <span className="text-[10px] font-bold text-cyan-400 block mb-0.5">
                    {msg.senderName}
                  </span>
                )}
                <p className="break-words leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Reactions Bar */}
      <div className="px-3 py-1.5 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between gap-1 overflow-x-auto">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendReaction(emoji)}
            className="p-1 hover:scale-125 transition-transform text-sm cursor-pointer select-none"
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-slate-950 text-slate-100 rounded-xl px-3 py-2 text-xs border border-slate-800 focus:border-cyan-400 outline-none placeholder:text-slate-500"
          maxLength={150}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 transition-colors cursor-pointer"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
