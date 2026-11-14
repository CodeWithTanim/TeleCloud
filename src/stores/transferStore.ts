import { create } from "zustand";
import { TransferItem } from "../types";

interface TransferState {
  transfers: TransferItem[];
  isOpen: boolean;

  setIsOpen: (isOpen: boolean) => void;
  addTransfer: (item: Omit<TransferItem, "progress" | "status">) => void;
  updateProgress: (id: string, progress: number, transferred: number, speed?: string) => void;
  setStatus: (id: string, status: TransferItem["status"], error?: string) => void;
  clearCompleted: () => void;
}

export const useTransferStore = create<TransferState>((set) => ({
  transfers: [],
  isOpen: false,

  setIsOpen: (isOpen) => set({ isOpen }),

  addTransfer: (item) =>
    set((state) => ({
      isOpen: true,
      transfers: [
        {
          ...item,
          progress: 0,
          status: "pending",
        },
        ...state.transfers,
      ],
    })),

  updateProgress: (id, progress, transferred, speed) =>
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === id ? { ...t, progress, transferred, speed, status: "active" } : t
      ),
    })),

  setStatus: (id, status, error) =>
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === id ? { ...t, status, error } : t
      ),
    })),

  clearCompleted: () =>
    set((state) => ({
      transfers: state.transfers.filter((t) => t.status !== "completed"),
    })),
}));
