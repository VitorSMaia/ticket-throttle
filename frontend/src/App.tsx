import { useEffect, useState } from 'react';
import { TicketCard } from './components/TicketCard';
import { AdminPanel } from './components/AdminPanel';

interface Ticket {
  id: string;
  event_name: string;
  status: string;
}

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/tickets')
      .then(res => res.json())
      .then(data => setTickets(data))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header MASP */}
      <header className="bg-white border-b border-red-600">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-red-600 tracking-tighter">MASP</h1>
          <p className="text-gray-500 text-sm mt-1">MUSEU DE ARTE DE SÃO PAULO ASSIS CHATEAUBRIAND</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">Em Cartaz</h2>
          <p className="text-gray-600">Selecione uma exposição para reservar seu ingresso.</p>
        </div>

        <AdminPanel />

        <div className="mb-8 border-t border-gray-200 my-8"></div>

        {/* Grid de Ingressos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticketId={ticket.id}
              name={ticket.event_name}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; 2026 MASP - Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

export default App;
