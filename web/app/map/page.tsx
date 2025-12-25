'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(() => import('../../components/MapComponent'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-neutral-900 text-white">Loading Map...</div>
});

export default function MapPage() {
    const router = useRouter();

    return (
        <div className="relative h-screen w-screen bg-neutral-900 flex flex-col">
            {/* Header/Nav */}
            <div className="fixed top-6 left-20 z-50 flex gap-4 pl-4">
                <button
                    onClick={() => router.back()}
                    className="bg-white/10 backdrop-blur-md text-white px-6 h-12 rounded-xl shadow-lg font-medium border border-white/20 hover:bg-white/20 flex items-center gap-2 transition-all"
                >
                    <span>←</span> Back to Dashboard
                </button>
            </div>

            {/* Interactive Leaflet Map */}
            <div className="w-full h-full z-0">
                <MapWithNoSSR />
            </div>
        </div>
    );
}
