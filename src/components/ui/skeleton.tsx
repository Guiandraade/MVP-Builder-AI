"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        "bg-surface-2",
        className
      )}
      style={{ backgroundColor: "var(--surface-2)" }}
    />
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="space-y-1 px-2">
      {[80, 65, 90, 72, 58].map((w, i) => (
        <div key={i} className="flex items-center gap-2 rounded-xl p-2">
          <Skeleton className="h-4 flex-1 rounded" style={{ width: `${w}%`, maxWidth: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}
