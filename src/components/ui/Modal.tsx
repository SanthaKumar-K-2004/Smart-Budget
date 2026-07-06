"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React from "react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onOpenChange, title, description, children, maxWidth = "480px" }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className="fixed z-50 left-1/2 top-1/2 w-[92vw] glass-strong rounded-2xl p-6"
                style={{ maxWidth }}
                initial={{ opacity: 0, scale: 0.94, x: "-50%", y: "-46%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.94, x: "-50%", y: "-46%" }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-start justify-between mb-1">
                  <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="icon-btn -mt-1 -mr-1" aria-label="Close">
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>
                {description && (
                  <Dialog.Description className="text-sm text-[var(--muted)] mb-4">
                    {description}
                  </Dialog.Description>
                )}
                {!description && <div className="mb-2" />}
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
