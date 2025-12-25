import { ReportWizard } from '@/components/ReportWizard';

export default function ReportPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4 flex flex-col justify-center">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Emergency Report</h1>
                <p className="text-neutral-500">Stay calm. Help is on the way.</p>
            </div>
            <ReportWizard />
        </div>
    );
}
