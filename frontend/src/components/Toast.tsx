import { useEffect, useState } from 'react';
import { useCart } from '../store/cartStore';
import { CheckCircle, ShoppingBag } from 'lucide-react';

export function Toast() {
    const { toast, hideToast, toggleCart, items } = useCart();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (toast) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(hideToast, 300); // Espera a animação sair
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast, hideToast]);

    if (!toast) return null;

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 max-w-sm transition-all duration-300 ${visible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                }`}
        >
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Barra verde superior */}
                <div className="h-1 bg-green-500" />

                <div className="p-4 flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full shrink-0">
                        <CheckCircle className="text-green-600" size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm">{toast.message}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {toast.quantity}x • R$ {toast.total.toFixed(2)}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            hideToast();
                            toggleCart();
                        }}
                        className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-700 transition shrink-0"
                    >
                        <ShoppingBag size={14} />
                        Ver ({items.length})
                    </button>
                </div>
            </div>
        </div>
    );
}
