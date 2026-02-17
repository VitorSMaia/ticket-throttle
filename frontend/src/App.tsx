import { useEffect, useState } from 'react';
import { EventCard } from './components/EventCard';
import { AdminPanel } from './components/AdminPanel';
import { CartDrawer } from './components/CartDrawer';
import { Toast } from './components/Toast';
import { MyTickets } from './components/MyTickets';
import { useCart } from './store/cartStore';
import { ShoppingBag, Ticket, Sparkles } from 'lucide-react';
import { API_URL } from './config';

interface EventData {
  event_name: string;
  price: number;
  available: number;
}

type Tab = 'events' | 'mytickets';

function App() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const { items, toggleCart, toast, refreshKey } = useCart();
  const [badgePulse, setBadgePulse] = useState(false);

  // Fetch events (grouped) — refetch when refreshKey changes (after purchase)
  useEffect(() => {
    fetch(`${API_URL}/tickets/events`)
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(console.error);
  }, [refreshKey]);

  // Anima o badge quando um item é adicionado
  useEffect(() => {
    if (toast) {
      setBadgePulse(true);
      const timer = setTimeout(() => setBadgePulse(false), 600);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const totalCartItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header MASP */}
      <header className="bg-white border-b border-red-600 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-red-600 tracking-tighter">MASP</h1>
            <p className="text-gray-500 text-xs mt-1 tracking-widest hidden sm:block">MUSEU DE ARTE DE SÃO PAULO ASSIS CHATEAUBRIAND</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Tabs de Navegação */}
            <nav className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('events')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'events'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} /> Em Cartaz
                </span>
              </button>
              <button
                onClick={() => setActiveTab('mytickets')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'mytickets'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <span className="flex items-center gap-1.5">
                  <Ticket size={14} /> Meus Ingressos
                </span>
              </button>
            </nav>

            {/* Botão do Carrinho */}
            <button
              onClick={toggleCart}
              className="relative bg-gray-100 p-3 rounded-full hover:bg-red-50 hover:text-red-600 transition group"
            >
              <ShoppingBag className="w-6 h-6 text-gray-700 group-hover:text-red-600" />
              {totalCartItems > 0 && (
                <span className={`absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white transition-transform ${badgePulse ? 'scale-125' : 'scale-100'
                  }`}>
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tabs Mobile */}
        <div className="sm:hidden flex border-t border-gray-100">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-3 text-sm font-medium text-center transition ${activeTab === 'events'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500'
              }`}
          >
            Em Cartaz
          </button>
          <button
            onClick={() => setActiveTab('mytickets')}
            className={`flex-1 py-3 text-sm font-medium text-center transition ${activeTab === 'mytickets'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500'
              }`}
          >
            Meus Ingressos
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">

        {activeTab === 'events' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800">Em Cartaz</h2>
              <p className="text-gray-600">Selecione um evento para comprar ingressos.</p>
            </div>

            <AdminPanel />

            <div className="mb-8 border-t border-gray-200 my-8"></div>

            {/* Grid de Eventos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <EventCard
                  key={event.event_name}
                  eventName={event.event_name}
                  price={event.price}
                  available={event.available}
                />
              ))}
            </div>

            {events.length === 0 && (
              <p className="text-center text-gray-400 py-12">Nenhum evento disponível. Use o painel acima para gerar ingressos.</p>
            )}
          </>
        )}

        {activeTab === 'mytickets' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800">Meus Ingressos</h2>
              <p className="text-gray-600">Ingressos pagos e confirmados.</p>
            </div>

            <MyTickets />
          </>
        )}

      </main>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Toast Notification */}
      <Toast />

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
