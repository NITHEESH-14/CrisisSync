'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function RealtimeNotifications() {
    const [toast, setToast] = useState<{ message: string; type: string; visible: boolean } | null>(null);

    useEffect(() => {
        const isEnabled = localStorage.getItem('notifications_enabled') !== 'false';
        if (!isEnabled) return;

        const q = query(
            collection(db, 'reports'),
            orderBy('timestamp', 'desc'),
            limit(1)
        );

        let isInitialLoad = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (isInitialLoad) {
                isInitialLoad = false;
                return;
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const notifEnabled = localStorage.getItem('notifications_enabled') !== 'false';

                    if (notifEnabled) {
                        const currentUser = JSON.parse(localStorage.getItem('user_profile') || '{}');
                        if (data.userId && data.userId === currentUser.id) {
                            return;
                        }

                        const reportTime = new Date(data.timestamp).getTime();
                        const now = Date.now();
                        const diffSeconds = (now - reportTime) / 1000;

                        if (diffSeconds > 60) {
                            return;
                        }

                        const typeEmoji = data.type === 'fire' ? '🔥' : data.type === 'medical' ? '🚑' : data.type === 'panic' ? '🚨' : '⚠️';
                        const locationText = data.address ? ` at ${data.address.substring(0, 20)}...` : '';
                        const msg = `New ${data.type.toUpperCase()} Alert${locationText}`;

                        setToast({
                            message: msg,
                            type: data.type,
                            visible: true
                        });

                        if ("Notification" in window && Notification.permission === "granted") {
                            new Notification("CrisisSync Emergency", {
                                body: msg,
                                icon: "/favicon.ico",
                                tag: data.id
                            });
                        }

                        setTimeout(() => {
                            setToast(prev => prev ? { ...prev, visible: false } : null);
                        }, 5000);
                    }
                }
            });
        });

        return () => unsubscribe();
    }, []);

    const handleToastClick = () => {
        window.location.href = '/dashboard';
    };

    if (!toast || !toast.visible) return null;

    return (
        <div
            onClick={handleToastClick}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-5 fade-in duration-300 cursor-pointer"
        >
            <div className={`px-4 py-2 rounded-full shadow-xl flex items-center gap-2 backdrop-blur-md border border-white/10 hover:scale-105 transition-transform active:scale-95
                ${toast.type === 'panic' ? 'bg-red-600/90 text-white' :
                    toast.type === 'fire' ? 'bg-orange-600/90 text-white' :
                        toast.type === 'medical' ? 'bg-red-500/90 text-white' :
                            'bg-neutral-800/90 text-white'}`}>
                <span className="font-bold tracking-wide uppercase text-xs">
                    {toast.message}
                </span>
                <span className="text-[10px] opacity-70 ml-1 border-l pl-2 border-white/30">
                    TAP TO VIEW
                </span>
            </div>
        </div>
    );
}
