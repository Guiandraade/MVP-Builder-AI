"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";

export const MAX_CONVERSATION_TITLE_CHARS = 120;
export const MAX_MESSAGE_CONTENT_CHARS = 8000;

function sanitizeTitle(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function normalizeMessageContent(input: string): string {
  return input.replace(/\r\n/g, "\n").trim();
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  optimistic?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

// ── Guest-mode localStorage persistence ─────────────────────────────────────
const GUEST_CACHE_KEY = "mvp-builder-ai-guest-cache";
const GUEST_MODE_KEY = "mvp-builder-ai-guest";

type GuestCache = {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
};

function loadGuestCache(): GuestCache {
  if (typeof window === "undefined") return { conversations: [], messages: {} };
  try {
    const raw = localStorage.getItem(GUEST_CACHE_KEY);
    if (!raw) return { conversations: [], messages: {} };
    return JSON.parse(raw) as GuestCache;
  } catch {
    return { conversations: [], messages: {} };
  }
}

function saveGuestCache(cache: GuestCache): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage quota exceeded — ignore
  }
}

interface ChatStore {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  messagesLoading: boolean;
  error: string | null;
  searchQuery: string;
  isGuestMode: boolean;

  // Conversation actions
  fetchConversations: () => Promise<void>;
  createConversation: (title: string) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  pinConversation: (id: string, pinned: boolean) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setSearchQuery: (query: string) => void;
  setGuestMode: (v: boolean) => void;
  loadGuestConversations: () => void;

  // Message actions
  fetchMessages: (conversationId: string) => Promise<void>;
  addMessage: (
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ) => Promise<Message>;

  // Clear
  clearError: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  messagesLoading: false,
  error: null,
  searchQuery: "",
  isGuestMode:
    typeof window !== "undefined" && localStorage.getItem(GUEST_MODE_KEY) === "true",

  setGuestMode: (v: boolean) => {
    if (v) {
      const cache = loadGuestCache();
      set({
        isGuestMode: true,
        conversations: cache.conversations,
        currentConversation: null,
        messages: [],
        error: null,
        loading: false,
        messagesLoading: false,
      });
      return;
    }

    // Leaving guest mode: clear in-memory state to avoid showing stale data
    // from a previous session/account until authenticated data is fetched.
    set({
      isGuestMode: false,
      conversations: [],
      currentConversation: null,
      messages: [],
      error: null,
      loading: false,
      messagesLoading: false,
    });
  },

  loadGuestConversations: () => {
    const cache = loadGuestCache();
    set({
      conversations: cache.conversations,
      currentConversation: null,
      messages: [],
      loading: false,
      messagesLoading: false,
      error: null,
    });
  },

  fetchConversations: async () => {
    if (get().isGuestMode) {
      const cache = loadGuestCache();
      set({ conversations: cache.conversations, loading: false });
      return;
    }
    set({ loading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) throw error;
      set({ conversations: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  createConversation: async (title: string) => {
    const safeTitle = sanitizeTitle(title);
    if (!safeTitle) {
      const err = new Error("O título da conversa não pode ficar vazio.");
      set({ error: err.message });
      throw err;
    }
    if (safeTitle.length > MAX_CONVERSATION_TITLE_CHARS) {
      const err = new Error(`Título muito longo. Use no máximo ${MAX_CONVERSATION_TITLE_CHARS} caracteres.`);
      set({ error: err.message });
      throw err;
    }

    if (get().isGuestMode) {
      const localConv: Conversation = {
        id: `guest-${crypto.randomUUID()}`,
        title: safeTitle,
        pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const cache = loadGuestCache();
      cache.conversations = [localConv, ...cache.conversations];
      saveGuestCache(cache);
      set((state) => ({
        conversations: [localConv, ...state.conversations],
        currentConversation: localConv,
        messages: [],
      }));
      return localConv;
    }

    set({ error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("conversations")
        .insert([{ user_id: user.id, title: safeTitle, pinned: false }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        conversations: [data, ...state.conversations],
        currentConversation: data,
        messages: [],
      }));

      return data;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteConversation: async (id: string) => {
    if (get().isGuestMode) {
      const cache = loadGuestCache();
      cache.conversations = cache.conversations.filter((c) => c.id !== id);
      delete cache.messages[id];
      saveGuestCache(cache);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        currentConversation:
          state.currentConversation?.id === id ? null : state.currentConversation,
        messages: state.currentConversation?.id === id ? [] : state.messages,
      }));
      return;
    }

    set({ error: null });
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        currentConversation:
          state.currentConversation?.id === id ? null : state.currentConversation,
        messages: state.currentConversation?.id === id ? [] : state.messages,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateConversationTitle: async (id: string, title: string) => {
    const safeTitle = sanitizeTitle(title);
    if (!safeTitle) {
      set({ error: "O título da conversa não pode ficar vazio." });
      return;
    }
    if (safeTitle.length > MAX_CONVERSATION_TITLE_CHARS) {
      set({ error: `Título muito longo. Use no máximo ${MAX_CONVERSATION_TITLE_CHARS} caracteres.` });
      return;
    }

    // Optimistic update
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title: safeTitle } : c
      ),
      currentConversation:
        state.currentConversation?.id === id
          ? { ...state.currentConversation, title: safeTitle }
          : state.currentConversation,
    }));

    if (get().isGuestMode) {
      const cache = loadGuestCache();
      cache.conversations = cache.conversations.map((c) =>
        c.id === id ? { ...c, title: safeTitle } : c
      );
      saveGuestCache(cache);
      return;
    }

    try {
      await supabase
        .from("conversations")
        .update({ title: safeTitle })
        .eq("id", id);
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  },

  pinConversation: async (id: string, pinned: boolean) => {
    // Optimistic update
    set((state) => ({
      conversations: state.conversations
        .map((c) => (c.id === id ? { ...c, pinned } : c))
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }),
      currentConversation:
        state.currentConversation?.id === id
          ? { ...state.currentConversation, pinned }
          : state.currentConversation,
    }));

    if (get().isGuestMode) return;

    try {
      await supabase
        .from("conversations")
        .update({ pinned })
        .eq("id", id);
    } catch (error) {
      console.error("Failed to pin conversation:", error);
    }
  },

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
    if (conversation) {
      get().fetchMessages(conversation.id);
    } else {
      set({ messages: [] });
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  fetchMessages: async (conversationId: string) => {
    if (get().isGuestMode) {
      const cache = loadGuestCache();
      set({ messages: cache.messages[conversationId] ?? [], messagesLoading: false });
      return;
    }

    set({ messagesLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      set({ messages: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ messagesLoading: false });
    }
  },

  addMessage: async (conversationId: string, role, content) => {
    const safeContent = normalizeMessageContent(content);
    if (!safeContent) {
      const err = new Error("Mensagem vazia não é permitida.");
      set({ error: err.message });
      throw err;
    }
    if (safeContent.length > MAX_MESSAGE_CONTENT_CHARS) {
      const err = new Error(`Mensagem muito longa. Use no máximo ${MAX_MESSAGE_CONTENT_CHARS} caracteres.`);
      set({ error: err.message });
      throw err;
    }

    if (get().isGuestMode) {
      const msg: Message = {
        id: `guest-msg-${crypto.randomUUID()}`,
        conversation_id: conversationId,
        role,
        content: safeContent,
        created_at: new Date().toISOString(),
      };
      const cache = loadGuestCache();
      cache.messages[conversationId] = [
        ...(cache.messages[conversationId] ?? []),
        msg,
      ];
      saveGuestCache(cache);
      set((state) => ({ messages: [...state.messages, msg] }));
      return msg;
    }

    // Optimistic update — message appears instantly
    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      role,
      content: safeContent,
      created_at: new Date().toISOString(),
      optimistic: true,
    };

    set((state) => ({ messages: [...state.messages, optimisticMessage] }));

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([{ conversation_id: conversationId, role, content: safeContent }])
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real one
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === optimisticId ? data : m
        ),
      }));

      // Update conversation updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      return data;
    } catch (error) {
      // Remove failed optimistic message
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== optimisticId),
        error: (error as Error).message,
      }));
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

