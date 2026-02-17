import { useState } from 'react';

export function AdminPanel() {
    const [event, setEvent] = useState('');
    const [qty, setQty] = useState(10);
    const [loading, setLoading] = useState(false);

    const generateTickets = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/tickets/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventName: event, quantity: qty })
            });

            if (res.ok) {
                alert(`${qty} Ingressos gerados!`);
                window.location.reload(); // Recarrega para mostrar os novos ingressos
            } else {
                alert("Erro ao gerar");
            }
        } catch (err) {
            alert("Erro ao gerar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-gray-100 rounded-xl shadow-inner max-w-md mx-auto my-10 border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-red-600 border-b border-gray-300 pb-2">Painel Administrativo MASP</h2>

            <div className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Exposição</label>
                    <input
                        type="text"
                        placeholder="Ex: Tarsila do Amaral"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                        onChange={(e) => setEvent(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                    <input
                        type="number"
                        placeholder="Quantidade"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                        onChange={(e) => setQty(Number(e.target.value))}
                        value={qty}
                    />
                </div>
                <button
                    onClick={generateTickets}
                    disabled={loading || !event}
                    className={`w-full text-white p-3 rounded font-medium transition ${loading || !event ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
                        }`}
                >
                    {loading ? 'Gerando...' : 'Gerar Ingressos em Lote'}
                </button>
            </div>
        </div>
    );
}
