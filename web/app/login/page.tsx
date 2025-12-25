'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const userProfile = localStorage.getItem('user_profile');
        if (userProfile) {
            router.replace('/');
        } else {
            setIsLoading(false);
        }
    }, [router]);

    if (isLoading) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-neutral-50 to-neutral-200 dark:from-neutral-900 dark:to-black">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
                        Crisis<span className="text-orange-600">Sync</span>
                    </h1>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
