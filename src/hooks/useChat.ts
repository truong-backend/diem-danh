import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../store/authStore';
import { chatService } from '../services/chat.service';
import type { Conversation, Message, ChatUser } from '../models/chat.model';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

export function useChat() {
  const { user, accessToken } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [userCache, setUserCache] = useState<Record<string, ChatUser>>({});
  const stompRef = useRef<Client | null>(null);
  const groupSubRef = useRef<any>(null);
  const activeConvRef = useRef<Conversation | null>(null);

  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  const loadUserCache = useCallback(async () => {
    try {
      const allUsers = await chatService.searchUsers('');
      const map: Record<string, ChatUser> = {};
      allUsers.forEach(u => { map[u.userId] = u; });
      setUserCache(map);
    } catch { }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatService.getMyConversations();
      setConversations(data);
    } catch { }
  }, []);

  useEffect(() => {
    loadConversations();
    loadUserCache();
  }, [loadConversations, loadUserCache]);

  useEffect(() => {
    if (!accessToken) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
    stompRef.current = client;
    client.onConnect = () => {
      if (user?.userId) {
        client.subscribe(`/user/${user.userId}/queue/conversations`, () => {
          loadConversations();
        });
        client.subscribe(`/user/${user.userId}/queue/users`, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            if (payload.type === 'USER_JOINED' && payload.user) {
              setUserCache(prev => ({ ...prev, [payload.user.userId]: payload.user }));
            }
          } catch { }
        });
      }
    };
    client.onStompError = (frame) => console.error('STOMP Error:', frame);
    client.onWebSocketError = (event) => console.error('WebSocket Error:', event);
    client.activate();
    return () => { client.deactivate(); };
  }, [accessToken]); // eslint-disable-line

  const reloadMessages = useCallback(async () => {
    const conv = activeConvRef.current;
    if (!conv) return;
    try {
      const msgs = await chatService.getMessages(conv.conversationId);
      setMessages(msgs);
    } catch { }
  }, []);

  // Subscribe tin nhắn của conversation đang mở
  useEffect(() => {
    const client = stompRef.current;
    if (!client || !activeConv) return;
    let msgSub: any = null;

    const subscribeMsgs = () => {
      msgSub = client.subscribe(
        `/topic/conversation/${activeConv.conversationId}`,
        (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            if (!activeConvRef.current) return;

            if (payload.eventType === 'MESSAGE_SENT' && payload.message) {
              // Tin nhắn mới broadcast từ REST
              const newMsg: Message = payload.message;
              if (!newMsg.messageId) return;
              setMessages(prev => {
                if (prev.some(m => m.messageId === newMsg.messageId)) return prev;
                return [newMsg, ...prev]; // prepend vì list đang reverse khi render
              });
            } else if (payload.eventType && payload.message) {
              // Edit / delete / pin / unpin — cập nhật đúng tin nhắn
              const updatedMsg: Message = payload.message;
              setMessages(prev =>
                prev.map(m => m.messageId === updatedMsg.messageId ? updatedMsg : m)
              );
            } else {
              // Tin nhắn mới — broadcast trực tiếp từ WS /app/chat.send
              const msg: Message = payload;
              if (!msg.messageId) return;
              setMessages(prev => {
                if (prev.some(m => m.messageId === msg.messageId)) return prev;
                return [msg, ...prev]; // prepend vì list đang reverse khi render
              });
            }
          } catch (err) {
            console.error('WS parse error:', err);
          }
        }
      );
    };

    if (client.connected) {
      subscribeMsgs();
    } else {
      const prevConnect = client.onConnect;
      client.onConnect = (frame) => {
        if (prevConnect) prevConnect(frame);
        subscribeMsgs();
      };
    }
    return () => { if (msgSub) msgSub.unsubscribe(); };
  }, [activeConv?.conversationId]); // eslint-disable-line

  // Subscribe group update events
  useEffect(() => {
    const client = stompRef.current;
    if (!client || !activeConv || activeConv.type === 'PRIVATE') return;
    const convId = activeConv.conversationId;
    const subscribe = () => {
      groupSubRef.current = client.subscribe(
        `/topic/group/${convId}/update`,
        async (frame) => {
          try {
            const event = JSON.parse(frame.body);
            if (event.type === 'GROUP_DELETED') {
              setConversations(prev => prev.filter(c => c.conversationId !== event.conversationId));
              if (activeConvRef.current?.conversationId === event.conversationId) {
                setActiveConv(null);
                setMessages([]);
              }
            } else {
              const updated = await chatService.getConversation(convId);
              setActiveConv(updated);
              setConversations(prev =>
                prev.map(c => c.conversationId === updated.conversationId ? updated : c));
            }
          } catch { }
        }
      );
    };
    if (client.connected) {
      subscribe();
    } else {
      const prevConnect = client.onConnect;
      client.onConnect = (frame) => {
        if (prevConnect) prevConnect(frame);
        subscribe();
      };
    }
    return () => { if (groupSubRef.current) groupSubRef.current.unsubscribe(); };
  }, [activeConv?.conversationId, activeConv?.type]); // eslint-disable-line

  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv);
    setLoading(true);
    try {
      const msgs = await chatService.getMessages(conv.conversationId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeConvRef.current || !content.trim()) return;
    // Gửi REST → backend broadcast WS → subscriber nhận → UI tự cập nhật
    await chatService.sendMessage({
      conversationId: activeConvRef.current.conversationId,
      content,
      type: 'TEXT',
    });
  }, []);

  const sendFile = useCallback(async (file: File) => {
    if (!activeConvRef.current) return;
    const { fileUrl, fileName } = await chatService.uploadFile(file);
    await chatService.sendMessage({
      conversationId: activeConvRef.current.conversationId,
      type: 'FILE',
      fileUrl,
      fileName,
    });
  }, []);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    await chatService.editMessage(messageId, content);
    await reloadMessages();
  }, [reloadMessages]);

  const deleteMessage = useCallback(async (messageId: string) => {
    await chatService.deleteMessage(messageId);
    await reloadMessages();
  }, [reloadMessages]);

  const pinMessage = useCallback(async (messageId: string) => {
    await chatService.pinMessage(messageId);
    await reloadMessages();
  }, [reloadMessages]);

  const unpinMessage = useCallback(async (messageId: string) => {
    await chatService.unpinMessage(messageId);
    await reloadMessages();
  }, [reloadMessages]);

  const searchMessages = useCallback(async (keyword: string) => {
    if (!activeConvRef.current) return [];
    return chatService.searchMessages(activeConvRef.current.conversationId, keyword);
  }, []);

  const displayName = useCallback(
    (userId: string) => userCache[userId]?.fullName || userId,
    [userCache]
  );

  const convDisplayName = useCallback(
    (conv: Conversation): string => {
      if (conv.type !== 'PRIVATE') return conv.name || 'Nhóm không tên';
      const otherId = conv.memberIds.find(id => id !== user?.userId);
      return otherId ? (userCache[otherId]?.fullName || otherId) : 'Người dùng';
    },
    [user, userCache]
  );

  return {
    conversations,
    activeConv,
    setActiveConv,
    messages,
    loading,
    userCache,
    displayName,
    convDisplayName,
    loadConversations,
    loadUserCache,
    openConversation,
    sendMessage,
    sendFile,
    editMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    searchMessages,
    reloadMessages,
  };
}