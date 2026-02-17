import { useState } from 'react';
import { MapPin, Clock, Users } from 'lucide-react';
import { EventDetail } from './EventDetail';

interface EventCardProps {
    eventName: string;
    price: number;
    available: number;
}

export function EventCard({ eventName, price, available }: EventCardProps) {
    const [showDetail, setShowDetail] = useState(false);

    const availabilityColor = available <= 3
        ? 'text-red-600 bg-red-50'
        : available <= 10
            ? 'text-amber-600 bg-amber-50'
            : 'text-green-600 bg-green-50';

    return (
        <>
            <div
                onClick={() => setShowDetail(true)}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:border-red-200 transition-all duration-300"
            >
                {/* Barra de cor do topo */}
                <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-700 group-hover:from-red-600 group-hover:to-red-800 transition-all" />

                <div className="p-6 flex flex-col gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-red-600 transition-colors">
                            {eventName}
                        </h3>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1"><MapPin size={14} /> MASP</span>
                            <span className="flex items-center gap-1"><Clock size={14} /> Ter–Dom</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div>
                            <p className="text-xs text-gray-400">A partir de</p>
                            <p className="text-2xl font-bold text-gray-900">R$ {price.toFixed(2)}</p>
                        </div>

                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${availabilityColor}`}>
                            <Users size={14} />
                            {available} disponíve{available === 1 ? 'l' : 'is'}
                        </span>
                    </div>

                    <button className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 active:scale-[0.98] transition text-sm">
                        Comprar Ingressos
                    </button>
                </div>
            </div>

            {/* Modal de Detalhe */}
            {showDetail && (
                <EventDetail
                    eventName={eventName}
                    price={price}
                    available={available}
                    onClose={() => setShowDetail(false)}
                />
            )}
        </>
    );
}
