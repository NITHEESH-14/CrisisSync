import { GUIDANCE_DATA } from '@/lib/guidanceData';
import Link from 'next/link';
import { Button } from '@/components/Button';

// Correctly typing params as a generic promise or object for Next.js 15
export default async function GuidancePage({ params }: { params: Promise<{ type: string }> }) {
    const resolvedParams = await params;
    const { type } = resolvedParams;
    const data = GUIDANCE_DATA[type] || GUIDANCE_DATA['other'];

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-6 sm:p-12 font-[family-name:var(--font-sans)]">
            <div className="max-w-3xl mx-auto space-y-8">
                <header className="text-center space-y-4">
                    <div className="text-6xl animate-bounce">{data.icon}</div>
                    <h1 className={`text-4xl font-bold ${data.color} dark:text-white`}>
                        {data.title}
                    </h1>
                    <p className="text-xl font-medium text-neutral-600 dark:text-neutral-300">
                        Responders have been notified. Follow these steps immediately.
                    </p>
                </header>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-lg border-l-8 border-green-500">
                        <h2 className="text-2xl font-bold text-green-600 mb-4">✅ Do This</h2>
                        <ul className="space-y-3">
                            {data.dos.map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-neutral-700 dark:text-neutral-200">
                                    <span className="mt-1 text-green-500">✔</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-lg border-l-8 border-red-500">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">❌ Don't Do This</h2>
                        <ul className="space-y-3">
                            {data.donts.map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-neutral-700 dark:text-neutral-200">
                                    <span className="mt-1 text-red-500">✖</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-4">ℹ️ Instructions</h2>
                    <ol className="list-decimal list-inside space-y-3 text-lg text-neutral-800 dark:text-neutral-200">
                        {data.instructions.map((item, i) => (
                            <li key={i} className="pl-2">{item}</li>
                        ))}
                    </ol>
                </div>

                <div className="flex justify-center pt-8">
                    <Link href="/">
                        <Button variant="outline" size="lg">I Am Safe Now</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
