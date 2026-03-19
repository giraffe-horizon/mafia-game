"use client";

import React, { useEffect, useCallback, useId } from "react";
import { cn } from "@/lib/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const titleId = useId();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn("bg-surface-low border border-on-surface/12 max-w-md w-full mx-4", className)}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-on-surface/10">
            <h3
              id={titleId}
              className="font-display font-bold uppercase tracking-widest text-on-surface text-sm"
            >
              {title}
            </h3>
            <button
              onClick={onClose}
              aria-label="Zamknij"
              className="size-8 flex items-center justify-center text-on-surface/40 hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        )}
        <div className={cn("p-5", title && "pt-4")}>{children}</div>
      </div>
    </div>
  );
}

export type { ModalProps };
