import React from "react";
import { cn } from "@/lib/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className={cn("bg-slate-900 rounded-lg max-w-md w-full mx-4", className)}>
        {title && (
          <div className="flex items-center justify-between p-6 pb-4">
            <h3 className="text-white font-bold text-lg font-typewriter">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        )}
        <div className={cn("p-6", title && "pt-0")}>{children}</div>
      </div>
    </div>
  );
}

export type { ModalProps };
