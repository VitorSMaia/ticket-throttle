
import { create } from 'zustand';

export interface CartItem {
    eventName: string;
    price: number;
    quantity: number;
}

interface ToastData {
    message: string;
    quantity: number;
    total: number;
}

interface CartStore {
    items: CartItem[];
    isOpen: boolean;
    total: number;
    toast: ToastData | null;
    refreshKey: number;
    addItem: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
    removeItem: (eventName: string) => void;
    clearCart: () => void;
    toggleCart: () => void;
    hideToast: () => void;
}

export const useCart = create<CartStore>((set) => ({
    items: [],
    isOpen: false,
    total: 0,
    toast: null,
    refreshKey: 0,
    addItem: (item, quantity) => set((state) => {
        // Evita duplicatas do mesmo evento
        if (state.items.some(i => i.eventName === item.eventName)) return state;

        const itemTotal = item.price * quantity;

        return {
            items: [...state.items, { ...item, quantity }],
            total: state.total + itemTotal,
            toast: {
                message: `${item.eventName} adicionado ao carrinho`,
                quantity,
                total: itemTotal,
            },
        };
    }),
    removeItem: (eventName) => set((state) => {
        const item = state.items.find(i => i.eventName === eventName);
        const itemTotal = item ? item.price * item.quantity : 0;
        return {
            items: state.items.filter(i => i.eventName !== eventName),
            total: state.total - itemTotal,
        };
    }),
    clearCart: () => set((state) => ({ items: [], total: 0, refreshKey: state.refreshKey + 1 })),
    toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    hideToast: () => set({ toast: null }),
}));
