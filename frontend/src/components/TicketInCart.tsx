import { useState, useEffect } from 'react';

interface TicketInCartProps {
    ticket: {
        id: string;
        event_name: string;
        price: string;
        reservedAt: string;
    };
    onExpire?: (ticketId: string) => void;
}

export function TicketInCart({ ticket, onExpire }: TicketInCartProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        const calculateTime = () => {
            // A Origem da Verdade: reservedAt do PostgreSQL + 15 minutos
            const expirationTime = new Date(ticket.reservedAt).getTime() + 15 * 60 * 1000;
            const now = Date.now();
            const diff = Math.max(0, Math.floor((expirationTime - now) / 1000));
            setTimeLeft(diff);

            // Se expirou, notifica o parent
            if (diff <= 0 && onExpire) {
                onExpire(ticket.id);
            }
        };

        calculateTime(); // Calcula imediatamente
        const timer = setInterval(calculateTime, 1000);

        return () => clearInterval(timer);
    }, [ticket.reservedAt, ticket.id, onExpire]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const progressPercent = (timeLeft / 900) * 100; // 900s = 15min

    // Se expirou, oculta o card (o worker já liberou no banco)
    if (timeLeft <= 0) return null;

    // Cor muda conforme urgência
    const isUrgent = timeLeft < 120; // menos de 2 min
    const barColor = isUrgent ? 'bg-red-600' : 'bg-red-500';
    const textColor = isUrgent ? 'text-red-600 animate-pulse' : 'text-red-500';

    return (
        <div className="p-4 bg-white border-2 border-red-100 rounded-lg shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-gray-800">{ticket.event_name}</h3>
                    <span className={`text-xs font-semibold ${textColor}`}>
                        {isUrgent ? '⚠️ Expirando!' : 'Expira em'}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-red-600 font-mono text-lg font-bold block">
                        {minutes}:{seconds.toString().padStart(2, '0')}
                    </span>
                    <span className="text-gray-500 font-mono text-xs">
                        R$ {Number(ticket.price).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Barra de progresso baseada no tempo real do servidor */}
            <div className="mt-3 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div
                    className={`${barColor} h-full transition-all duration-1000 ease-linear`}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    );
}
