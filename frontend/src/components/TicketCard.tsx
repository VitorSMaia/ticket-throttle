import { useState } from 'react';

export function TicketCard({ ticketId, name }: { ticketId: string, name: string }) {
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    const handleReserve = async () => {
        setStatus('processing');

        try {
            const response = await fetch('http://localhost:3000/reserve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'joao_frontend', ticketId })
            });

            if (response.ok) {
                // Como a resposta é 202 (Aceito), avisamos que está na fila
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    return (
        <div className="p-6 border rounded-lg shadow-sm bg-white flex flex-col gap-4">
            <h3 className="text-xl font-bold text-gray-800">{name}</h3>
            <p className="text-sm text-gray-500">ID: {ticketId}</p>

            <button
                onClick={handleReserve}
                disabled={status !== 'idle'}
                className={`px-4 py-2 rounded font-medium transition ${status === 'idle' ? 'bg-red-600 text-white hover:bg-red-700' :
                        status === 'processing' ? 'bg-yellow-400 text-black animate-pulse' :
                            status === 'success' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                    }`}
            >
                {status === 'idle' && 'Reservar Ingresso'}
                {status === 'processing' && 'Processando na Fila...'}
                {status === 'success' && '✓ Na Fila de Reserva'}
                {status === 'error' && 'Erro na Solicitação'}
            </button>
        </div>
    );
}
