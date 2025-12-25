'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from './Button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const EMERGENCY_TYPES = [
    { id: 'fire', label: 'Fire', color: 'bg-orange-100 text-orange-600 border-orange-200' },
    { id: 'medical', label: 'Medical', color: 'bg-blue-100 text-blue-600 border-blue-200' },
    { id: 'accident', label: 'Accident', color: 'bg-red-100 text-red-600 border-red-200' },
    { id: 'violence', label: 'Violence', color: 'bg-purple-100 text-purple-600 border-purple-200' },
    { id: 'disaster', label: 'Disaster', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    { id: 'other', label: 'Other', color: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
];

function WizardContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const step = (searchParams.get('step') as 'type' | 'location' | 'details' | 'submitting') || 'type';
    const typeParam = searchParams.get('type');

    const [showManualInput, setShowManualInput] = useState(false);
    const [data, setData] = useState({
        type: typeParam || '',
        location: null as GeolocationCoordinates | null,
        address: '',
        details: ''
    });
    const [locationError, setLocationError] = useState('');

    useEffect(() => {
        if (step === 'submitting') {
            const timer = setTimeout(() => {
                router.replace('/');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step, router]);

    useEffect(() => {
        if (step !== 'type' && !data.type) {
            router.replace(pathname);
        }
    }, [step, data.type, router, pathname]);

    const updateStep = (newStep: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('step', newStep);
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleTypeSelect = (typeId: string) => {
        setData(prev => ({ ...prev, type: typeId }));
        updateStep('location');
        setShowManualInput(false);
    };

    const handleBack = () => {
        if (step === 'location' && showManualInput) {
            setShowManualInput(false);
            return;
        }

        if (step === 'type') {
            router.push('/');
        } else {
            router.back();
        }
    };

    const handleLocationRequest = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported. Please enter address manually.');
            setShowManualInput(true);
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setData(prev => ({ ...prev, location: position.coords }));
                updateStep('details');
            },
            (error) => {
                let msg = 'Unable to retrieve location.';
                if (error && error.code) {
                    if (error.code === 1) msg = 'Location permission denied.';
                    if (error.code === 2) msg = 'Location unavailable.';
                    if (error.code === 3) msg = 'Location request timed out.';
                }

                console.error("Location error:", error);
                setLocationError(msg + " Switched to manual entry.");

                setShowManualInput(true);
            },
            options
        );
    };

    const handleManualAddressNext = () => {
        if (data.address.trim()) {
            updateStep('details');
        }
    };

    const getResponders = (type: string) => {
        switch (type) {
            case 'fire': return 'Fire Services';
            case 'medical': return 'Ambulance & Medical Team';
            case 'accident': return 'Police & Ambulance';
            case 'violence': return 'Police Department';
            case 'disaster': return 'Disaster Management Team';
            default: return 'Police Control Room';
        }
    };

    const handleSubmit = async () => {
        updateStep('submitting');

        try {
            const location = data.location ? {
                latitude: data.location.latitude,
                longitude: data.location.longitude,
                accuracy: data.location.accuracy
            } : null;

            await addDoc(collection(db, 'reports'), {
                ...data,
                location,
                timestamp: new Date().toISOString(),
                status: 'pending',
                volunteerCount: 0,
                userId: JSON.parse(localStorage.getItem('user_profile') || '{}').id || 'anonymous',
                userName: JSON.parse(localStorage.getItem('user_profile') || '{}').fullName || 'Anonymous'
            });
        } catch (error) {
            console.error("Error submitting report:", error);
            alert("Failed to send alert. Check permissions or internet connection.");
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-xl shadow-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
            <div className="p-6">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <button
                            onClick={handleBack}
                            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-2xl leading-none px-2"
                        >
                            ←
                        </button>

                        <h2 className="text-xl font-bold dark:text-white text-center flex-1">
                            {step === 'type' && 'What is the emergency?'}
                            {step === 'location' && 'Share Location'}
                            {step === 'details' && 'More Details'}
                            {step === 'submitting' && 'Alert Sent'}
                        </h2>

                        <div className="w-8"></div>
                    </div>

                    <div className="flex justify-between items-center px-1 mb-4">
                        <span className="text-sm text-neutral-400">
                            {step === 'type' && 'Step 1/3'}
                            {step === 'location' && 'Step 2/3'}
                            {step === 'details' && 'Step 3/3'}
                        </span>
                    </div>

                    <div className="h-1 bg-neutral-100 dark:bg-neutral-700 rounded-full">
                        <div
                            className="h-full bg-emergency transition-all duration-300 rounded-full"
                            style={{
                                width: step === 'type' ? '33%' : step === 'location' ? '66%' : '100%'
                            }}
                        />
                    </div>
                </div>

                {step === 'type' && (
                    <div className="grid grid-cols-2 gap-3">
                        {EMERGENCY_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => handleTypeSelect(type.id)}
                                className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center gap-2 hover:brightness-95 transition-all ${type.color}`}
                            >
                                <span className="font-bold text-lg">{type.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {step === 'location' && (
                    <div className="space-y-6 py-4">
                        {!showManualInput ? (
                            <div className="text-center space-y-6">
                                <div className="relative w-28 h-28 mx-auto inline-block">
                                    <div className="absolute inset-0 rounded-full overflow-hidden bg-blue-50 dark:bg-blue-900/30 border-4 border-white dark:border-neutral-700 shadow-xl">
                                        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/640px-World_map_blank_without_borders.svg.png')] bg-cover bg-center opacity-40 mix-blend-multiply dark:mix-blend-overlay"></div>
                                        <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse"></div>
                                    </div>

                                    <div className="relative z-10 w-full h-full flex items-center justify-center -translate-y-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-2xl transform hover:scale-110 transition-transform filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3" fill="#ffffff" stroke="none"></circle>
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-neutral-600 dark:text-neutral-300">
                                    We need your precise location to send help to the right place.
                                </p>
                                {locationError && (
                                    <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{locationError}</p>
                                )}
                                <Button
                                    onClick={handleLocationRequest}
                                    className="w-full text-xl py-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold !border-0 shadow-lg transition-all duration-150 active:scale-[0.99] focus:outline-none !ring-0 !focus:ring-0 !focus:ring-offset-0"
                                    size="lg"
                                    style={{ borderWidth: '0', outline: 'none', filter: 'none' }}
                                >
                                    Share My Location
                                </Button>
                                <button
                                    onClick={() => setShowManualInput(true)}
                                    className="text-neutral-400 text-sm hover:underline"
                                >
                                    Skip (Enter address manually)
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {locationError && (
                                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm border border-red-100 dark:border-red-900/30 flex items-center gap-2 animate-in slide-in-from-top-2">
                                        <span>⚠️</span>
                                        {locationError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium mb-3 dark:text-neutral-300">Emergency Address</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-md border border-neutral-200 dark:border-neutral-600 dark:bg-neutral-900 focus:ring-2 focus:ring-emergency focus:border-transparent outline-none transition-all"
                                        placeholder="Enter complete address..."
                                        value={data.address}
                                        onChange={(e) => setData({ ...data, address: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <Button
                                    onClick={handleManualAddressNext}
                                    className="w-full text-xl py-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold !border-0 shadow-lg transition-all duration-150 active:scale-[0.99] focus:outline-none !ring-0 !focus:ring-0 !focus:ring-offset-0"
                                    size="lg"
                                    disabled={!data.address.trim()}
                                    style={{ borderWidth: '0', outline: 'none', filter: 'none' }}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {step === 'details' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-3 dark:text-neutral-300">Additional Info (Optional)</label>
                            <textarea
                                className="w-full p-3 rounded-md border border-neutral-200 dark:border-neutral-600 dark:bg-neutral-900 focus:ring-2 focus:ring-emergency focus:border-transparent outline-none transition-all"
                                rows={4}
                                placeholder="Number of injured, trapped, specific landmarks..."
                                value={data.details}
                                onChange={(e) => setData({ ...data, details: e.target.value })}
                            />
                        </div>
                        <Button
                            onClick={handleSubmit}
                            className="w-full text-xl py-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold !border-0 shadow-lg transition-all duration-150 active:scale-[0.99] focus:outline-none !ring-0 !focus:ring-0 !focus:ring-offset-0"
                            size="lg"
                            style={{ borderWidth: '0', outline: 'none', filter: 'none' }}
                        >
                            SEND ALERT
                        </Button>
                    </div>
                )}

                {step === 'submitting' && (
                    <div className="py-2 space-y-6">
                        <div className="text-center space-y-2 mb-8">
                            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-green-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-in zoom-in duration-300">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <h3 className="font-bold text-xl dark:text-white">Responders have been notified.</h3>
                            <p className="text-neutral-500 text-sm">Help is on the way. Stay calm.</p>
                        </div>

                        <div>
                            <h4 className="text-lg font-bold text-emergency mb-2 ml-1">Alert sent to:</h4>
                            <div className="divide-y divide-neutral-200 dark:divide-neutral-700 border-t border-b border-neutral-200 dark:border-neutral-700">
                                <div className="py-2 px-1">
                                    <h4 className="font-medium dark:text-white text-base">Nearby Volunteers</h4>
                                </div>
                                <div className="py-2 px-1">
                                    <h4 className="font-medium dark:text-white text-base">Social Organizations</h4>
                                </div>
                                <div className="py-2 px-1">
                                    <h4 className="font-medium dark:text-white text-base">{getResponders(data.type)}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export function ReportWizard() {
    return (
        <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
            <WizardContent />
        </Suspense>
    );
}
