"use client";

import { Conversation, MAX_CONVERSATION_TITLE_CHARS, useChatStore } from "@/lib/chat-store";
import { Trash2, Pin, PinOff, Pencil, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ConversationSkeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface ConversationListProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelect: (conversation: Conversation) => void;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  currentConversation,
  onSelect,
  isLoading = false,
}: ConversationListProps) {
  const { deleteConversation, pinConversation, updateConversationTitle, loading } = useChatStore();
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  const pinned = conversations.filter((c) => c.pinned);
  const unpinned = conversations.filter((c) => !c.pinned);
  const now = new Date();

  const groupByDate = (convos: Conversation[]) => {
    const today = now.toDateString();
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();

    const groups: { [key: string]: Conversation[] } = {};

    convos.forEach((conv) => {
      const createdAt = new Date(conv.created_at);
      const date = createdAt.toDateString();
      let group = "Anteriores";
      if (date === today) group = "Hoje";
      else if (date === yesterday) group = "Ontem";
      else if (now.getTime() - createdAt.getTime() < 604800000)
        group = "Últimos 7 dias";

      if (!groups[group]) groups[group] = [];
      groups[group].push(conv);
    });

    return groups;
  };

  const grouped = groupByDate(unpinned);
  const groupOrder = ["Hoje", "Ontem", "Últimos 7 dias", "Anteriores"];

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteConversation(toDelete);
    setToDelete(null);
  };

  const startEditing = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
    setSavingTitle(false);
  };

  const saveTitle = async (conv: Conversation) => {
    const nextTitle = editingTitle.trim();
    if (!nextTitle) return;
    if (nextTitle === conv.title) {
      cancelEditing();
      return;
    }

    setSavingTitle(true);
    try {
      await updateConversationTitle(conv.id, nextTitle);
      cancelEditing();
    } catch (error) {
      console.error("Error updating title:", error);
      setSavingTitle(false);
    }
  };

  const renderItem = (conv: Conversation, index: number) => {
    const isActive = currentConversation?.id === conv.id;
    const isEditing = editingId === conv.id;
    return (
      <motion.div
        key={conv.id}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18, delay: index * 0.03 }}
        className="group relative flex cursor-pointer items-center gap-1 rounded-xl px-2 py-2 transition-colors"
        style={{
          background: isActive ? "hsl(0 0% 100% / 0.05)" : "transparent",
          border: `1px solid ${isActive ? "hsl(0 0% 100% / 0.16)" : "transparent"}`,
        }}
        onMouseEnter={(e) => {
          if (!isActive)
            (e.currentTarget as HTMLDivElement).style.background = "hsl(240 10% 16% / 0.6)";
        }}
        onMouseLeave={(e) => {
          if (!isActive)
            (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}
      >
        {isEditing ? (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <input
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void saveTitle(conv);
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEditing();
                }
              }}
              autoFocus
              disabled={savingTitle}
              maxLength={MAX_CONVERSATION_TITLE_CHARS}
              className="w-full rounded-md border px-2 py-1 text-sm outline-none"
              style={{
                background: "var(--surface-2)",
                borderColor: "hsl(0 0% 100% / 0.2)",
                color: "hsl(240 5% 92%)",
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                void saveTitle(conv);
              }}
              disabled={savingTitle || !editingTitle.trim()}
              className="rounded p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: "hsl(142 71% 55%)" }}
              title="Salvar"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelEditing();
              }}
              disabled={savingTitle}
              className="rounded p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: "hsl(240 5% 55%)" }}
              title="Cancelar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onSelect(conv)}
            className="flex-1 cursor-pointer truncate text-left text-sm"
            style={{
              color: isActive ? "hsl(240 5% 92%)" : "hsl(240 5% 65%)",
              fontWeight: isActive ? 500 : 400,
            }}
          >
            {conv.title}
          </button>
        )}

        {/* Actions: always visible on mobile, hover-visible on desktop */}
        {!isEditing && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              startEditing(conv);
            }}
            className="rounded p-1 cursor-pointer transition-colors"
            style={{ color: "hsl(240 5% 45%)" }}
            title="Editar título"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              pinConversation(conv.id, !conv.pinned);
            }}
            className="rounded p-1 cursor-pointer transition-colors"
            style={{ color: conv.pinned ? "hsl(0 0% 82%)" : "hsl(240 5% 45%)" }}
            title={conv.pinned ? "Desafixar" : "Fixar"}
          >
            {conv.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setToDelete(conv.id);
            }}
            className="rounded p-1 cursor-pointer transition-colors"
            style={{ color: "hsl(240 5% 45%)" }}
            title="Deletar"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "hsl(0 72% 60%)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "hsl(240 5% 45%)";
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        )}
      </motion.div>
    );
  };

  return (
    <>
      <div className="chat-scroll flex-1 py-2">
        {isLoading || loading ? (
          <>
            <div
              className="px-4 pb-1 pt-2 text-[10px] uppercase tracking-widest"
              style={{ color: "hsl(240 5% 40%)" }}
            >
              Hoje
            </div>
            <ConversationSkeleton />
          </>
        ) : conversations.length === 0 ? (
          <div
            className="px-4 py-10 text-center text-xs"
            style={{ color: "hsl(240 5% 45%)" }}
          >
            Nenhum chat ainda.
            <br />
            Comece com uma ideia de produto.
          </div>
        ) : (
          <>
            {/* Pinned section */}
            {pinned.length > 0 && (
              <div className="mb-2">
                <div
                  className="px-4 pb-1 pt-2 text-[10px] uppercase tracking-widest"
                  style={{ color: "hsl(0 0% 78%)" }}
                >
                  📌 Fixados
                </div>
                <div className="space-y-0.5 px-2">
                  {pinned.map((c, i) => renderItem(c, i))}
                </div>
              </div>
            )}

            {/* Date groups */}
            {groupOrder.map(
              (groupName) =>
                grouped[groupName] && (
                  <div key={groupName} className="mb-2">
                    <div
                      className="px-4 pb-1 pt-2 text-[10px] uppercase tracking-widest"
                      style={{ color: "hsl(240 5% 40%)" }}
                    >
                      {groupName}
                    </div>
                    <div className="space-y-0.5 px-2">
                      {grouped[groupName].map((c, i) => renderItem(c, pinned.length + i))}
                    </div>
                  </div>
                )
            )}
          </>
        )}
      </div>

      <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar chat</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este chat? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
