import Modal from "./Modal";
import Button from "./Button";
import { useState } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "ZATWIERDŹ",
  cancelText = "ANULUJ",
  variant = "primary",
  loading: externalLoading = false,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading || internalLoading;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-4">
        <p className="font-display text-sm text-on-surface/80 mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            disabled={isLoading}
            onClick={async () => {
              if (isLoading) return;
              setInternalLoading(true);
              try {
                await onConfirm();
                onClose();
              } catch (error) {
                console.error("ConfirmDialog onConfirm error:", error);
              } finally {
                setInternalLoading(false);
              }
            }}
          >
            {isLoading ? "..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
