import { useEffect, useState } from 'react';
import { Ticket, CheckCircle, Calendar } from 'lucide-react';
import { API_URL } from '../config';

interface PaidTicket {
    id: string;
    event_name: string;
    price: string;
    updated_at: string;
}

export function MyTickets() {
    const [tickets, setTickets] = useState<PaidTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userId = localStorage.getItem('ticket_user_email');
        if (!userId) {
            setLoading(false);
            return;
        }

        fetch(`${API_URL}/tickets/paid/${userId}`)
            .then(res => res.json())
            .then(data => {
                setTickets(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (tickets.length === 0) {
        return (
            <div className="text-center py-20">
                <Ticket className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-400">Nenhum ingresso comprado</h3>
                <p className="text-gray-400 mt-2">Seus ingressos pagos aparecerão aqui.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map(ticket => (
                <div
                    key={ticket.id}
                    className="bg-white rounded-xl border-2 border-green-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                    {/* Barra verde do topo */}
                    <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500" />

                    <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{ticket.event_name}</h3>
                                <p className="text-xs text-gray-400 mt-1">ID: {ticket.id.slice(0, 8)}...</p>
                            </div>
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle size={12} /> PAGO
                            </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                <Calendar size={14} />
                                {new Date(ticket.updated_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </div>
                            <span className="text-lg font-bold text-gray-800">
                                R$ {Number(ticket.price).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
