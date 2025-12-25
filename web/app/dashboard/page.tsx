import { DashboardView } from '@/components/DashboardView';

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 p-6 md:p-10 font-[family-name:var(--font-sans)]">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8 mt-16 lg:mt-0">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Responder Dashboard</h1>
                        <p className="text-neutral-500">Live emergency feed for coordinated response.</p>
                    </div>
                    <div className="hidden sm:block">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">System Operational</span>
                        </div>
                    </div>
                </div>
                <DashboardView />
            </div>
        </div>
    );
}
