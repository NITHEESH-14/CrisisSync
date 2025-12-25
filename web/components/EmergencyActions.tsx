'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function EmergencyActions() {
    const router = useRouter();
    const [status, setStatus] = useState<'idle' | 'locating' | 'sending'>('idle');

    const handleImmediateReport = () => {
        setStatus('locating');

        const createReport = async (coords?: GeolocationCoordinates | null) => {
            setStatus('sending');
            try {
                const reportData = {
                    type: 'panic',
                    timestamp: new Date().toISOString(),
                    status: 'pending',
                    details: 'IMMEDIATE SOS BUTTON PRESSED',
                    location: coords ? {
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        accuracy: coords.accuracy
                    } : null,
                    volunteerCount: 0,
                    userId: JSON.parse(localStorage.getItem('user_profile') || '{}').id || 'anonymous',
                    userName: JSON.parse(localStorage.getItem('user_profile') || '{}').fullName || 'Anonymous'
                };

                await addDoc(collection(db, 'reports'), reportData);

                setTimeout(() => {
                    setStatus('idle');
                    router.push('/report?step=submitting&type=panic');
                }, 800);
            } catch (error: any) {
                console.error("SOS Error:", error);
                alert(`Failed to send SOS: ${error.message || 'Unknown Error'}. Check connection.`);
                setStatus('idle');
            }
        };

        if (!navigator.geolocation) {
            console.error('Geolocation not supported');
            createReport();
            return;
        }

        const tryGetLocation = (highAccuracy: boolean) => {
            if (window.location.hostname !== 'localhost' && !window.isSecureContext) {
                alert("⚠️ GPS ERROR: Mobile browsers block GPS on HTTP.\n\nSince we cannot get your location, the request is cancelled.\n\nPlease use the 'Report with Details' button to enter address manually.");
                setStatus('idle');
                return;
            }

            console.log(`Trying GPS (High Accuracy: ${highAccuracy})...`);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log("GPS Success:", position.coords);
                    createReport(position.coords);
                },
                (error) => {
                    console.error('Location error:', error);

                    if (highAccuracy) {
                        console.log("High accuracy failed, retrying with low accuracy...");
                        tryGetLocation(false);
                    } else {
                        let msg = "Unknown location error";
                        if (error.code === 1) msg = "Permission denied. Please allow location access.";
                        if (error.code === 2) msg = "Position unavailable. Ensure device GPS is on.";
                        if (error.code === 3) msg = "Location request timed out.";

                        alert(`⚠️ SOS CANCELLED: We could not retrieve your location (${msg}).\n\nPlease use the manual report option.`);
                        setStatus('idle');
                    }
                },
                {
                    enableHighAccuracy: highAccuracy,
                    timeout: highAccuracy ? 10000 : 20000,
                    maximumAge: 0
                }
            );
        };

        tryGetLocation(true);
    };


    const handleRegularReport = () => {
        router.push('/report');
    };

    return (
        <div className="w-full space-y-4">
            <Button
                variant="ghost"
                size="lg"
                className="w-full text-xl py-8 animate-pulse relative overflow-hidden !ring-0 !focus:ring-0 !focus:ring-offset-0 !shadow-none !outline-none !bg-emergency !text-white hover:!bg-red-600 focus:!bg-red-600"
                style={{ boxShadow: 'none', filter: 'none', outline: 'none' }}
                onClick={handleImmediateReport}
                disabled={status !== 'idle'}
            >
                {status === 'locating' ? (
                    <div className="flex justify-center items-center gap-2">
                        <span className="font-semibold tracking-widest uppercase text-sm">ACQUIRING GPS...</span>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white"></span>
                    </div>
                ) : status === 'sending' ? (
                    <div className="flex justify-center items-center gap-2">
                        <span className="font-semibold tracking-widest uppercase">SENDING ALERT</span>
                        <span className="flex gap-1 ml-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                        </span>
                    </div>
                ) : (
                    "REPORT EMERGENCY NOW"
                )}
            </Button>

            <Button
                variant="ghost"
                size="lg"
                className="w-full text-xl py-6 border border-orange-500 text-neutral-600 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/5 active:bg-orange-50 active:scale-[0.99] transition-all duration-150 focus:outline-none !ring-0 !focus:ring-0 !focus:ring-offset-0"
                style={{ borderWidth: '0.1px', outline: 'none', boxShadow: 'none' }}
                onClick={handleRegularReport}
            >
                Report with Details
            </Button>
        </div>
    );
}
