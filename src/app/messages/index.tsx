'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { format, isToday, isYesterday } from 'date-fns';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/lib/auth-client';
import { getConversations, getMessages, sendMessage } from '@/lib/messages';
import { cn } from '@/lib/utils';

import type { JSX } from 'react';

import type { ConversationPreview, MessageData } from '@/lib/messages';

const formatTimestamp = (date: Date): string => {
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
};

const UserAvatar = ({
  user,
  size = 'md',
}: {
  user: { name: string; image: string | null };
  size?: 'sm' | 'md';
}): JSX.Element => (
  <div
    className={cn(
      'shrink-0 rounded-full bg-neutral-700 overflow-hidden flex items-center justify-center font-medium text-white',
      size === 'md' ? 'size-10 text-sm' : 'size-8 text-xs',
    )}
  >
    {user.image ? (
      <Image
        alt={user.name}
        className="w-full h-full object-cover"
        height={size === 'md' ? 40 : 32}
        src={user.image}
        width={size === 'md' ? 40 : 32}
      />
    ) : (
      <span>{user.name.charAt(0).toUpperCase()}</span>
    )}
  </div>
);

const ConversationItem = ({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: ConversationPreview;
  isSelected: boolean;
  onClick: () => void;
}): JSX.Element => (
  <button
    onClick={onClick}
    type="button"
    className={cn(
      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors text-white',
      isSelected ? 'bg-neutral-800' : 'hover:bg-neutral-800/50',
    )}
  >
    <UserAvatar user={conversation.otherUser} />
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline gap-2">
        <span className={cn('font-medium truncate', conversation.isUnread && 'font-semibold')}>
          {conversation.otherUser.name}
        </span>
        {conversation.lastMessageAt ? (
          <span className="text-xs text-neutral-400 shrink-0">
            {formatTimestamp(new Date(conversation.lastMessageAt))}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-400 truncate flex-1">
          {conversation.lastMessage ?? 'No messages yet'}
        </span>
        {conversation.isUnread ? (
          <div className="shrink-0 size-2 bg-blue-500 rounded-full" />
        ) : null}
      </div>
    </div>
  </button>
);

const MessageBubble = ({
  message,
  isOwn,
}: {
  message: MessageData;
  isOwn: boolean;
}): JSX.Element => (
  <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
    <div
      className={cn(
        'max-w-[72%] px-3 py-2 rounded-2xl text-sm',
        isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-neutral-800 text-white rounded-bl-sm',
      )}
    >
      <p className="whitespace-pre-wrap break-words">{message.content}</p>
      <p className={cn('text-xs mt-1', isOwn ? 'text-blue-200' : 'text-neutral-500')}>
        {format(new Date(message.createdAt), 'h:mm a')}
      </p>
    </div>
  </div>
);

const MessagesPage = (): JSX.Element => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('conversation'));
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth guard
  useEffect(() => {
    if (!isPending && !session?.user) router.push('/sign-in');
  }, [isPending, session, router]);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch {
      // silently fail on background polls
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
    } catch {
      // silently fail on background polls
    }
  }, []);

  // Conversation list — initial load + 5 s polling
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Message thread — load on select + 3 s polling
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return undefined;
    }
    setLoadingMsgs(true);
    fetchMessages(selectedId).finally(() => setLoadingMsgs(false));
    const interval = setInterval(async () => fetchMessages(selectedId), 3000);
    return () => clearInterval(interval);
  }, [selectedId, fetchMessages]);

  // Scroll to latest message within the container (not the page)
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!session || !selectedId || !draft.trim() || sending) return;
    const content = draft.trim();
    setSending(true);
    setDraft('');

    // Optimistic update
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: MessageData = {
      id: optimisticId,
      senderId: session.user.id,
      content,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const real = await sendMessage(selectedId, content);
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? real : m)));
      // Refresh conversation list so last-message preview updates
      fetchConversations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setDraft(content);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isPending) return <p className="text-center mt-8 text-white">Loading…</p>;
  if (!session?.user) return <p className="text-center mt-8 text-white">Redirecting…</p>;

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100dvh-73px)] text-white overflow-hidden border-t border-neutral-800">
      <aside
        className={cn(
          'w-full md:w-72 shrink-0 border-r border-neutral-800 flex flex-col',
          selectedId ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="px-4 py-3 shrink-0">
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <p className="text-center py-8 text-neutral-400 text-sm">Loading…</p>
          ) : null}
          {!loadingConvs && conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-2">
              <p className="text-neutral-300 font-medium">No conversations yet</p>
              <p className="text-sm text-neutral-500">
                Open a ride post and tap &ldquo;Send a message&rdquo; to start one.
              </p>
            </div>
          ) : null}
          {!loadingConvs &&
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={conv.id === selectedId}
                onClick={() => setSelectedId(conv.id)}
              />
            ))}
        </div>
      </aside>

      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden',
          !selectedId ? 'hidden md:flex' : 'flex',
        )}
      >
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-neutral-500">Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800 shrink-0">
              <Button
                className="md:hidden"
                onClick={() => setSelectedId(null)}
                size="icon"
                variant="ghost"
              >
                <ArrowLeftIcon className="size-4" />
              </Button>
              {selectedConversation ? (
                <>
                  <UserAvatar size="sm" user={selectedConversation.otherUser} />
                  <span className="font-xl">{selectedConversation.otherUser.name}</span>
                </>
              ) : (
                <div className="size-8 rounded-full bg-neutral-700 animate-pulse" />
              )}
            </div>

            {/* Message thread */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-2"
            >
              {loadingMsgs ? (
                <p className="text-center text-neutral-400 text-sm">Loading…</p>
              ) : null}
              {!loadingMsgs && messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-neutral-500 text-sm">No messages yet — say hi!</p>
                </div>
              ) : null}
              {!loadingMsgs &&
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    isOwn={msg.senderId === session.user.id}
                    message={msg}
                  />
                ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-neutral-800 shrink-0">
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={textareaRef}
                  className="resize-none min-h-10 max-h-32"
                  disabled={sending}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                  rows={1}
                  value={draft}
                />
                <Button
                  className="shrink-0"
                  disabled={!draft.trim() || sending}
                  onClick={handleSend}
                  size="icon"
                >
                  <PaperAirplaneIcon className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
