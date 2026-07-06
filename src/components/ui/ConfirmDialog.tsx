"use client";

import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} maxWidth="400px">
      <div className="flex gap-3 mb-4">
        <span className="icon-btn danger shrink-0 bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]">
          <AlertTriangle size={18} />
        </span>
        <p className="text-sm text-[var(--muted)] pt-1.5">{description}</p>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary" onClick={() => onOpenChange(false)}>
          Cancel
        </button>
        <button
          className={danger ? "btn-danger" : "btn-primary"}
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
