import React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDanger = true,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-2xl shrink-0 ${
              isDanger
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
            }`}
          >
            {isDanger ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <p className="text-sm text-[#c4c7c5] leading-relaxed pt-1">
            {message}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
          <Button variant="ghost" type="button" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? "danger" : "primary"}
            type="button"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
