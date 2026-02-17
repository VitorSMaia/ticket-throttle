import { useState } from 'react';
import { useCart } from '../store/cartStore';
import { X, Minus, Plus, ShoppingCart, Check, Users, AlertTriangle } from 'lucide-react';

interface EventDetailProps {
    eventName: string;
    price: number;
    available: number;
    onClose: () => void;
}

export function EventDetail({ eventName, price, available, onClose }: EventDetailProps) {
    const { addItem, items } = useCart();
    const [quantity, setQuantity] = useState(1);
    const isInCart = items.some(i => i.eventName === eventName);

    const maxQty = Math.min(available, 10); // cap at 10 per transaction

    const increment = () => setQuantity(q => Math.min(q + 1, maxQty));
    const decrement = () => setQuantity(q => Math.max(q - 1, 1));

    const handleAdd = () => {
        addItem({ eventName, price }, quantity);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-red-600 text-white p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-2xl font-bold pr-8">{eventName}</h2>
                    <p className="text-red-200 text-sm mt-1">Selecione a quantidade de ingressos</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Disponibilidade */}
                    <div className={`flex items-center gap-2 text-sm font-medium p-3 rounded-lg ${available <= 3
                            ? 'bg-red-50 text-red-700'
                            : 'bg-green-50 text-green-700'
                        }`}>
                        {available <= 3 ? <AlertTriangle size={16} /> : <Users size={16} />}
                        {available} ingresso{available !== 1 ? 's' : ''} disponíve{available === 1 ? 'l' : 'is'}
                    </div>

                    {/* Preço unitário */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Preço unitário</span>
                        <span className="text-xl font-bold text-gray-900">R$ {price.toFixed(2)}</span>
                    </div>

                    {/* Seletor de Quantidade */}
                    {!isInCart && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">Quantidade</label>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center border-2 rounded-xl overflow-hidden">
                                    <button
                                        onClick={decrement}
                                        disabled={quantity <= 1}
                                        className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={maxQty}
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = Math.min(maxQty, Math.max(1, Number(e.target.value) || 1));
                                            setQuantity(val);
                                        }}
                                        className="w-16 text-center text-lg font-bold text-gray-800 border-x-2 outline-none py-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                        onClick={increment}
                                        disabled={quantity >= maxQty}
                                        className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <span className="text-sm text-gray-400">máx. {maxQty}</span>
                            </div>
                        </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center pt-4 border-t">
                        <span className="text-lg font-medium text-gray-600">Total</span>
                        <span className="text-3xl font-bold text-gray-900">
                            R$ {(price * quantity).toFixed(2)}
                        </span>
                    </div>

                    {/* Botão */}
                    <button
                        onClick={handleAdd}
                        disabled={isInCart || available === 0}
                        className={`w-full py-4 text-lg font-bold rounded-xl transition flex items-center justify-center gap-2 ${isInCart
                                ? 'bg-green-500 text-white cursor-default'
                                : available === 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-black active:scale-[0.98]'
                            }`}
                    >
                        {isInCart ? (
                            <><Check size={20} /> Já no Carrinho</>
                        ) : available === 0 ? (
                            'Esgotado'
                        ) : (
                            <><ShoppingCart size={20} /> Adicionar {quantity} Ingresso{quantity > 1 ? 's' : ''}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
