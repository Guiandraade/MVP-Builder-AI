"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";

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
  isGuestMode: false,

  setGuestMode: (v: boolean) => set({ isGuestMode: v }),

  fetchConversations: async () => {
    if (get().isGuestMode) return;
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
    if (get().isGuestMode) {
      const localConv: Conversation = {
        id: `guest-${crypto.randomUUID()}`,
        title,
        pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
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
        .insert([{ user_id: user.id, title, pinned: false }])
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
    // Optimistic update
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
      currentConversation:
        state.currentConversation?.id === id
          ? { ...state.currentConversation, title }
          : state.currentConversation,
    }));

    if (get().isGuestMode) return;

    try {
      await supabase
        .from("conversations")
        .update({ title })
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
      // Guest mode: clear messages when switching conversations (in-memory only)
      set({ messages: [], messagesLoading: false });
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
    if (get().isGuestMode) {
      const msg: Message = {
        id: `guest-msg-${crypto.randomUUID()}`,
        conversation_id: conversationId,
        role,
        content,
        created_at: new Date().toISOString(),
      };
      set((state) => ({ messages: [...state.messages, msg] }));
      return msg;
    }

    // Optimistic update — message appears instantly
    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      role,
      content,
      created_at: new Date().toISOString(),
      optimistic: true,
    };

    set((state) => ({ messages: [...state.messages, optimisticMessage] }));

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([{ conversation_id: conversationId, role, content }])
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

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

