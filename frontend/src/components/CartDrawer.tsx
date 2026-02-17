
import { useCart } from '../store/cartStore';
import { X, Trash2, ShoppingBag, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { TicketInCart } from './TicketInCart';
import { PaymentModal } from './PaymentModal';
import { API_URL } from '../config';

interface ReservedTicket {
    id: string;
    event_name: string;
    price: string;
    reservedAt: string;
}

export function CartDrawer() {
    const { items, total, isOpen, toggleCart, removeItem, clearCart } = useCart();
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    // Payment Modal State
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [checkoutTotal, setCheckoutTotal] = useState(0);
    const [checkoutItemCount, setCheckoutItemCount] = useState(0);

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('joao_frontend'); // userId padrão para testes
    const [errors, setErrors] = useState<{ name?: string, email?: string }>({});

    // Active Reservations State
    const [reservedItems, setReservedItems] = useState<ReservedTicket[]>([]);

    // 1. Load User from LocalStorage on mount
    useEffect(() => {
        const storedEmail = localStorage.getItem('ticket_user_email');
        const storedName = localStorage.getItem('ticket_user_name');
        if (storedEmail) setEmail(storedEmail);
        if (storedName) setName(storedName);
    }, []);

    // 2. Poll for Active Reservations (roda quando email e isOpen mudam)
    useEffect(() => {
        if (!email || !isOpen) return;

        const fetchReservations = async () => {
            try {
                const res = await fetch(`${API_URL}/tickets/cart/${email}`);
                if (res.ok) {
                    const data = await res.json();
                    setReservedItems(data);
                }
            } catch (error) {
                // Silently fail on network error for polling
            }
        };

        fetchReservations();
        const interval = setInterval(fetchReservations, 5000);
        return () => clearInterval(interval);
    }, [email, isOpen]);

    // Remove ticket expirado da lista local (sem precisar esperar o próximo poll)
    const handleExpire = (ticketId: string) => {
        setReservedItems(prev => prev.filter(t => t.id !== ticketId));
    };

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: { name?: string, email?: string } = {};
        if (!name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!email.trim() || !/\S+@\S+\.\S/.test(email)) newErrors.email = 'Email inválido';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCheckout = async () => {
        if (items.length === 0) return;
        if (!validate()) return;

        setStatus('processing');

        // Save user to LocalStorage
        localStorage.setItem('ticket_user_email', email);
        localStorage.setItem('ticket_user_name', name);

        try {
            // Formatar items para o novo formato: { eventName, quantity, price }
            const checkoutItems = items.map(item => ({
                eventName: item.eventName,
                quantity: item.quantity,
                price: item.price,
            }));

            const response = await fetch(`${API_URL}/tickets/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-idempotency-key': crypto.randomUUID()
                },
                body: JSON.stringify({ userId: email, name, items: checkoutItems })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Checkout success:', data);

                // Abre o modal de pagamento com o clientSecret do Stripe
                setClientSecret(data.clientSecret);
                setCheckoutTotal(data.total);
                setCheckoutItemCount(data.ticketCount || items.reduce((s, i) => s + i.quantity, 0));
                setStatus('idle');
            } else {
                console.error('Checkout failed');
                setStatus('error');
            }
        } catch (error) {
            console.error('Network error:', error);
            setStatus('error');
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex justify-end">
                {/* Overlay */}
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={toggleCart}
                />

                {/* Drawer */}
                <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b flex justify-between items-center bg-red-600 text-white">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <ShoppingBag /> Seu Pedido
                        </h2>
                        <button onClick={toggleCart} className="hover:bg-red-700 p-2 rounded-full transition">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* SEÇÃO 1: ITENS LOCAIS (Novo Pedido) */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-3 uppercase text-xs tracking-wider">Itens no Carrinho</h3>
                            <div className="space-y-4">
                                {items.length === 0 ? (
                                    <p className="text-gray-400 text-sm italic">Carrinho vazio.</p>
                                ) : (
                                    items.map(item => (
                                        <div key={item.eventName} className="flex justify-between items-center p-4 border rounded-lg hover:shadow-sm transition bg-white">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{item.eventName}</h3>
                                                <p className="text-sm text-gray-500">{item.quantity}x • R$ {item.price.toFixed(2)} cada</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-red-600">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                                <button
                                                    onClick={() => removeItem(item.eventName)}
                                                    className="text-gray-400 hover:text-red-600 transition"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* SEÇÃO 2: FORMULÁRIO (Aparece se tiver itens locais) */}
                        {items.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg border space-y-4 animate-in fade-in">
                                <h3 className="font-bold text-gray-700">Seus Dados</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-red-500 outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="João Silva"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-red-500 outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="joao@email.com"
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                            </div>
                        )}

                        {/* SEÇÃO 3: RESERVAS ATIVAS (Vindas do Banco) */}
                        {reservedItems.length > 0 && (
                            <div className="pt-6 border-t">
                                <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                                    <Clock size={18} /> Reservas Ativas (Aguardando Pagamento)
                                </h3>
                                <div className="space-y-3">
                                    {reservedItems.map(ticket => (
                                        <TicketInCart
                                            key={ticket.id}
                                            ticket={ticket}
                                            onExpire={handleExpire}
                                        />
                                    ))}


                                </div>
                            </div>
                        )}

                    </div>

                    {/* FOOTER: Botão de Checkout (Só aparece se tiver itens locais para reservar) */}
                    {items.length > 0 && (
                        <div className="p-6 border-t bg-gray-50">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-lg font-medium text-gray-600">Total</span>
                                <span className="text-3xl font-bold text-gray-900">R$ {total.toFixed(2)}</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={status === 'processing'}
                                className={`w-full py-4 text-lg font-bold rounded shadow-lg transition flex justify-center items-center gap-2 ${status === 'processing' ? 'bg-yellow-500 cursor-not-allowed' :
                                    status === 'success' ? 'bg-green-600' :
                                        status === 'error' ? 'bg-gray-800' :
                                            'bg-red-600 hover:bg-black text-white'
                                    }`}
                            >
                                {status === 'idle' && 'Reservar & Pagar'}
                                {status === 'processing' && 'Reservando...'}
                                {status === 'success' && 'Reservado!'}
                                {status === 'error' && 'Erro ao Reservar'}
                            </button>
                            {status === 'error' && <p className="text-red-600 text-center mt-2 text-sm">Ocorreu um erro. Tente novamente.</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Pagamento Stripe */}
            {clientSecret && (
                <PaymentModal
                    clientSecret={clientSecret}
                    total={checkoutTotal}
                    itemCount={checkoutItemCount}
                    onClose={() => setClientSecret(null)}
                    onSuccess={() => {
                        setClientSecret(null);
                        clearCart();
                    }}
                />
            )}
        </>
    );
}
