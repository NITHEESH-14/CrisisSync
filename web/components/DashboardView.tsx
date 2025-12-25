'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, getDocs, where, arrayUnion, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from './Button';

type Report = {
    id: string;
    type: string;
    timestamp: string;
    status: 'pending' | 'acknowledged' | 'resolved';
    details: string;
    address?: string;
    volunteerCount: number;
    location?: {
        latitude: number;
        longitude: number;
        accuracy: number;
    };
    userId?: string;
    orgPledges?: { orgName: string; count: number }[];
};

type UserProfile = {
    id?: string;
    fullName: string;
    role?: string;
    activeVolunteerId?: string;
};

export function DashboardView() {
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [locationFilter, setLocationFilter] = useState('All');
    const [volunteeredReports, setVolunteeredReports] = useState<string[]>([]);

    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userOrg, setUserOrg] = useState<{ id: string; name: string } | null>(null);
    const [isRegisteredVolunteer, setIsRegisteredVolunteer] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('user_profile');
        if (stored) {
            const user = JSON.parse(stored);
            setCurrentUser(user);
            setIsAdmin(user.role === 'admin' || (user.email === 'nitsxcreation@gmail.com'));
        }

        const storedVolunteered = localStorage.getItem('volunteered_reports');
        if (storedVolunteered) {
            setVolunteeredReports(JSON.parse(storedVolunteered));
        }
    }, []);

    useEffect(() => {
        if (!currentUser?.fullName) return;

        const checkProfiles = async () => {
            const orgQ = query(collection(db, 'organizations'), where('owner', '==', currentUser.fullName));
            const orgSnap = await getDocs(orgQ);
            if (!orgSnap.empty) {
                setUserOrg({ id: orgSnap.docs[0].id, name: orgSnap.docs[0].data().name });
            }

            const volQ = query(collection(db, 'volunteers'), where('name', '==', currentUser.fullName));
            const volSnap = await getDocs(volQ);
            if (!volSnap.empty) {
                setIsRegisteredVolunteer(true);
            }
        };
        checkProfiles();
    }, [currentUser]);

    const [refreshKey, setRefreshKey] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newReports = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Report[];
            setReports(newReports);
            setLoading(false);

            setTimeout(() => {
                setIsRefreshing(false);
            }, 1000);
        }, (error) => {
            console.error("Error fetching reports:", error);
            setLoading(false);
            setIsRefreshing(false);
        });

        return () => unsubscribe();
    }, [refreshKey]);

    const handleVolunteer = async (reportId: string) => {
        if (!isRegisteredVolunteer) {
            alert("You must register as a Volunteer in Settings before you can join an emergency!");
            return;
        }
        if (volunteeredReports.includes(reportId)) return;

        try {
            const reportRef = doc(db, 'reports', reportId);
            await updateDoc(reportRef, {
                volunteerCount: increment(1),
                status: 'acknowledged'
            });

            const updated = [...volunteeredReports, reportId];
            setVolunteeredReports(updated);
            localStorage.setItem('volunteered_reports', JSON.stringify(updated));

        } catch (error) {
            console.error("Error volunteering:", error);
        }
    };

    const [pledgingReportId, setPledgingReportId] = useState<string | null>(null);
    const [pledgeCount, setPledgeCount] = useState('');

    const togglePledgeInput = (reportId: string) => {
        if (pledgingReportId === reportId) {
            setPledgingReportId(null);
            setPledgeCount('');
        } else {
            setPledgingReportId(reportId);
            setPledgeCount('');
        }
    };

    const submitPledge = async (reportId: string) => {
        if (!userOrg || !pledgeCount) return;
        const count = parseInt(pledgeCount);
        if (isNaN(count) || count <= 0) return;

        try {
            const reportRef = doc(db, 'reports', reportId);
            await updateDoc(reportRef, {
                orgPledges: arrayUnion({ orgName: userOrg.name, count: count, timestamp: Date.now() }),
                volunteerCount: increment(count),
                status: 'acknowledged'
            });
            setPledgingReportId(null);
            setPledgeCount('');
        } catch (e) {
            console.error("Org volunteer error:", e);
        }
    };

    const handleDelete = async (reportId: string) => {
        if (!confirm("Admin: Delete this report?")) return;
        try {
            await deleteDoc(doc(db, 'reports', reportId));
        } catch (e) {
            console.error("Delete failed:", e);
        }
    };

    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [resolutionNote, setResolutionNote] = useState('');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    const initiateResolution = (id: string) => {
        setResolvingId(id);
        setResolutionNote('');
    };

    const confirmResolution = async () => {
        if (!resolvingId || !resolutionNote.trim()) return;

        try {
            const reportRef = doc(db, 'reports', resolvingId);
            const report = reports.find(r => r.id === resolvingId);

            if (!report) return;

            await addDoc(collection(db, 'resolution_logs'), {
                reportId: resolvingId,
                reportType: report.type,
                resolvedBy: currentUser?.fullName || 'Unknown',
                resolvedById: currentUser?.id || 'Unknown',
                timestamp: new Date().toISOString(),
                resolutionNote: resolutionNote,
                originalReportTime: report.timestamp
            });

            await updateDoc(reportRef, {
                status: 'resolved',
                resolution: resolutionNote,
            });

            setResolvingId(null);
            setResolutionNote('');
        } catch (error) {
            console.error("Error resolving:", error);
            alert("Failed to resolve. Check permissions.");
        }
    };

    const filteredReports = reports.filter(r => {
        if (r.status === 'resolved') {
            const reportTime = new Date(r.timestamp).getTime();
            const threeHours = 3 * 60 * 60 * 1000;
            if (Date.now() - reportTime > threeHours) return false;
        }

        if (locationFilter === 'All') return true;
        if (locationFilter === 'Near Me') return true;
        return r.address?.includes(locationFilter) || false;
    }).sort((a, b) => {
        const amIOwnerA = currentUser?.fullName && (a.details.includes(currentUser.fullName));
        const amIOwnerB = currentUser?.fullName && (b.details.includes(currentUser.fullName));

        if (amIOwnerA && !amIOwnerB) return -1;
        if (!amIOwnerA && amIOwnerB) return 1;

        return 0;
    });

    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [showRealMap, setShowRealMap] = useState(false);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-black text-neutral-500 dark:text-neutral-400">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                <span className="text-sm font-medium tracking-wide">LOADING DASHBOARD...</span>
            </div>
        </div>
    );

    const SidebarContent = () => (
        <div className="flex flex-col h-full gap-2">
            <div
                className="bg-neutral-900 rounded-lg overflow-hidden border border-neutral-700 relative flex-1 min-h-[250px] group cursor-pointer"
            >
                {showRealMap ? (
                    <div className="absolute inset-0 w-full h-full">
                        <iframe
                            src="https://embed.windy.com/embed2.html?lat=20.59&lon=78.96&detailLat=20.59&detailLon=78.96&width=650&height=450&zoom=5&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1"
                            className="w-full h-full border-0"
                            title="Live Weather Risk Map"
                            allowFullScreen
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowRealMap(false); }}
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1 transition-colors z-20"
                            title="Close Map"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                ) : (
                    <div className="absolute inset-0 w-full h-full" onClick={() => setShowRealMap(true)}>
                        <div className="absolute inset-0 bg-[#242f3e] opacity-80">
                            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#3a4b61 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-red-500/50 rounded-full"></div>

                        <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
                            <Button size="sm" variant="ghost" className="bg-white text-black h-8 text-xs font-bold">
                                Live Risk Map
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700 shrink-0">
                <h3 className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Active Incidents</h3>
                <p className="text-2xl font-bold mt-1 text-neutral-900 dark:text-white">{reports.filter(r => r.status !== 'resolved').length}</p>
            </div>
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700 shrink-0">
                <h3 className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Responders</h3>
                <p className="text-2xl font-bold mt-1 text-green-600">
                    {reports.reduce((acc, curr) => acc + (curr.volunteerCount || 0), 0)}
                </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700 shrink-0">
                <h3 className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Resolved</h3>
                <p className="text-2xl font-bold mt-1 text-blue-600">{reports.filter(r => r.status === 'resolved').length}</p>
            </div>
        </div>
    );

    return (
        <div className="relative h-[calc(100vh-100px)] lg:h-[calc(100vh-180px)] pt-16 lg:pt-0">
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedReport(null)}>
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                        <div className="p-5 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center bg-neutral-50/50 dark:bg-white/5">
                            <div>
                                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${selectedReport.type === 'fire' ? 'bg-orange-500' : selectedReport.type === 'medical' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                    {selectedReport.type} Emergency
                                </h3>
                                <p className="text-xs text-neutral-500 mt-1">
                                    ID: {selectedReport.id.slice(0, 8)}...
                                </p>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-full transition-colors">✕</button>
                        </div>

                        <div className="flex flex-col overflow-hidden h-full max-h-[80vh]">

                            <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">

                            </div>

                            <div className="px-6 flex shrink-0 gap-4 mb-4">
                                <div className="flex-1 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 text-center">
                                    <div className="text-2xl font-bold dark:text-white">{selectedReport.volunteerCount || 0}</div>
                                    <div className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Volunteers</div>
                                </div>
                                <div className="flex-1 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-100 dark:border-purple-900/30 text-center">
                                    <div className="text-2xl font-bold dark:text-white">{(selectedReport.orgPledges?.length || 0)}</div>
                                    <div className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Pledges</div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 min-h-0 border-t border-b border-neutral-100 dark:border-neutral-800 py-4 bg-neutral-50/30 dark:bg-black/20">
                                <h4 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide mb-3 sticky top-0 bg-transparent backdrop-blur-sm z-10 py-1">
                                    🤝 Organization Pledges ({(selectedReport.orgPledges?.length || 0)})
                                </h4>
                                {selectedReport.orgPledges && selectedReport.orgPledges.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedReport.orgPledges.map((pledge, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm">
                                                <span className="font-medium dark:text-neutral-200">{pledge.orgName}</span>
                                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold whitespace-nowrap">
                                                    +{pledge.count} Members
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-20 flex items-center justify-center text-3xl font-bold text-neutral-300 dark:text-neutral-700">
                                        0
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className="p-6 bg-white dark:bg-neutral-800 shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <h4 className="text-xs font-bold uppercase text-blue-800 dark:text-blue-300 mb-2">Services Notified</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const getNotified = (type: string) => {
                                            const base = ['Nearby Volunteers'];
                                            if (type === 'panic') return ['Police Department', 'District Organizations', 'Nearby Volunteers'];
                                            if (type === 'fire') return ['Fire Department', 'Medical Team', ...base];
                                            if (type === 'medical') return ['Ambulance', 'Nearby Hospitals', ...base];
                                            if (type === 'accident') return ['Police', 'Ambulance', ...base];
                                            if (type === 'violence') return ['Police Department', ...base];
                                            if (type === 'disaster') return ['Disaster Relief Team', 'State Control Room', 'District Organizations', ...base];
                                            return ['Police Control Room', ...base];
                                        };

                                        return getNotified(selectedReport.type).map(service => (
                                            <span key={service} className="px-2 py-1 bg-white dark:bg-neutral-800 rounded border border-blue-100 dark:border-blue-900 text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                                {service}
                                            </span>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {resolvingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-md border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-lg font-bold dark:text-white mb-2">Confirm Resolution</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                Please provide a reason or action taken to mark this incident as resolved. This helps in auditing and future reference.
                            </p>
                            <textarea
                                autoFocus
                                className="w-full p-3 rounded-md bg-neutral-50 dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 focus:border-orange-500 outline-none text-sm min-h-[100px] mb-4"
                                placeholder="e.g. Fire extinguished, Victim transported to City Hospital..."
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                            />
                            <div className="flex gap-3 justify-end">
                                <Button variant="ghost" onClick={() => setResolvingId(null)}>Cancel</Button>
                                <Button
                                    className="bg-green-600 text-white hover:bg-green-700"
                                    disabled={!resolutionNote.trim()}
                                    onClick={confirmResolution}
                                >
                                    Confirm Resolved
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsStatsOpen(true)}
                className="lg:hidden fixed right-0 top-6 z-40 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm p-2 pr-4 pl-4 rounded-l-full shadow-lg border-y border-l border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-orange-500 transition-colors flex items-center justify-center h-12"
                aria-label="Open Sidebar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>

            {isStatsOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsStatsOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-80 bg-neutral-100 dark:bg-neutral-900 p-4 shadow-2xl animate-in slide-in-from-right duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-lg dark:text-white">Overview</h2>
                            <button onClick={() => setIsStatsOpen(false)} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full">✕</button>
                        </div>
                        <div className="h-[calc(100%-4rem)]">
                            <SidebarContent />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                <div className="lg:col-span-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center shrink-0 bg-white dark:bg-neutral-800 z-10">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold dark:text-white">Live Feed</h2>
                            <div className="relative">
                                <select
                                    className="bg-neutral-100 dark:bg-neutral-900 border-none text-sm py-2 pl-3 pr-10 rounded-md focus:ring-1 focus:ring-orange-500 appearance-none cursor-pointer"
                                    value={locationFilter}
                                    onChange={(e) => setLocationFilter(e.target.value)}
                                >
                                    <option value="All">All Locations</option>
                                    <option value="Near My Location">Near My Location</option>
                                    <option value="District">District</option>
                                    <option value="State">State</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setIsRefreshing(true);
                                setRefreshKey(prev => prev + 1);
                            }}
                            className={`text-neutral-400 hover:text-white transition-colors focus:ring-0 focus:outline-none focus:bg-transparent active:bg-transparent hover:bg-transparent ${isRefreshing ? 'animate-spin' : ''}`}
                            style={{ boxShadow: 'none' }}
                            title="Refresh Feed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M21 21v-5h-5"></path></svg>
                        </Button>
                    </div>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-700 overflow-y-auto flex-1 scrollbar-hide">
                        {filteredReports.length === 0 ? (
                            <div className="p-8 text-center text-neutral-400">No active reports</div>
                        ) : (
                            filteredReports.map((report) => (
                                <div key={report.id} className="relative p-6 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <h3 className="font-bold text-lg capitalize text-neutral-900 dark:text-white flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${report.type === 'fire' ? 'bg-orange-500' : report.type === 'medical' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                                    {report.type} Emergency
                                                </h3>
                                                <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                                                    <span className="opacity-70">🕒 {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span>•</span>
                                                    <span className="opacity-70">{new Date(report.timestamp).toLocaleDateString()}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${report.status === 'pending' ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' :
                                            report.status === 'acknowledged' ? 'bg-yellow-50 border-yellow-100 text-yellow-600' :
                                                'bg-green-50 border-green-100 text-green-600'
                                            }`}>
                                            {report.status}
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-4">
                                        <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                                            <span className="font-bold text-neutral-500 dark:text-neutral-400">Location:</span>
                                            {report.address ? (
                                                <span className="font-medium">{report.address}</span>
                                            ) : (
                                                <span className="italic text-neutral-400">Coordinates available on map</span>
                                            )}
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                            <h4 className="text-xs font-bold uppercase text-blue-800 dark:text-blue-300 mb-2">Services Notified</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {(() => {
                                                    const getNotified = (type: string) => {
                                                        const base = ['Nearby Volunteers'];
                                                        if (type === 'panic') return ['Police Department', 'District Organizations', 'Nearby Volunteers'];
                                                        if (type === 'fire') return ['Fire Department', 'Medical Team', ...base];
                                                        if (type === 'medical') return ['Ambulance', 'Nearby Hospitals', ...base];
                                                        if (type === 'accident') return ['Police', 'Ambulance', ...base];
                                                        if (type === 'violence') return ['Police Department', ...base];
                                                        if (type === 'disaster') return ['Disaster Relief Team', 'State Control Room', 'District Organizations', ...base];
                                                        return ['Police Control Room', ...base];
                                                    };

                                                    return getNotified(report.type).map(service => (
                                                        <span key={service} className="px-2 py-1 bg-white dark:bg-neutral-800 rounded border border-blue-100 dark:border-blue-900 text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                                            {service}
                                                        </span>
                                                    ));
                                                })()}
                                            </div>
                                        </div>

                                        {report.details && (
                                            <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                                                <span className="font-bold text-neutral-500 dark:text-neutral-400">Reason:</span>
                                                <span className="text-neutral-700 dark:text-neutral-200">
                                                    {report.details}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 pt-2">
                                        {report.status !== 'resolved' && (!currentUser?.id || report.userId !== currentUser.id) && (
                                            <button
                                                onClick={() => handleVolunteer(report.id)}
                                                disabled={volunteeredReports.includes(report.id)}
                                                className={`h-9 px-5 rounded-md text-sm font-semibold transition-all shadow-sm
                                                    ${volunteeredReports.includes(report.id)
                                                        ? 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed'
                                                        : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-orange-500 text-neutral-900 dark:text-white hover:shadow-md active:scale-95'
                                                    }`}
                                            >
                                                {volunteeredReports.includes(report.id) ? '✓ Joined' : `Volunteer (${report.volunteerCount || 0})`}
                                            </button>
                                        )}

                                        {userOrg && report.status !== 'resolved' && (!currentUser?.id || report.userId !== currentUser.id) && (
                                            <>
                                                {pledgingReportId === report.id ? (
                                                    <div className="flex items-center gap-2 animate-in slide-in-from-right duration-200">
                                                        <input
                                                            autoFocus
                                                            type="number"
                                                            min="1"
                                                            placeholder="#"
                                                            className="w-16 h-9 px-2 rounded-md border border-orange-300 dark:border-orange-800 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                                            value={pledgeCount}
                                                            onChange={(e) => setPledgeCount(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && submitPledge(report.id)}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            onClick={() => submitPledge(report.id)}
                                                            className="h-9 bg-orange-600 hover:bg-orange-700 text-white border-none"
                                                        >
                                                            Confirm
                                                        </Button>
                                                        <button
                                                            onClick={() => togglePledgeInput(report.id)}
                                                            className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => togglePledgeInput(report.id)}
                                                        className="h-9 px-4 rounded-md border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-sm font-bold transition-all shadow-sm text-orange-700 dark:text-orange-400"
                                                    >
                                                        Org Pledge +
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        <button
                                            onClick={() => {
                                                if (report.location) {
                                                    window.open(`https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}`, '_blank');
                                                } else if (report.address) {
                                                    window.open(`https://www.google.com/maps?q=${encodeURIComponent(report.address)}`, '_blank');
                                                } else {
                                                    alert("No location data provided for this report.");
                                                }
                                            }}
                                            className="h-9 px-4 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-orange-500 hover:text-orange-600 hover:shadow-md active:scale-95 text-sm font-medium transition-all shadow-sm text-neutral-600 dark:text-neutral-400"
                                        >
                                            Location
                                        </button>

                                        {report.status !== 'resolved' && (isAdmin || isRegisteredVolunteer || (currentUser?.id && report.userId === currentUser.id)) && (
                                            <button
                                                onClick={() => initiateResolution(report.id)}
                                                className="h-9 px-4 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-orange-500 hover:text-orange-600 hover:shadow-md active:scale-95 text-xs font-medium transition-all shadow-sm text-neutral-500 dark:text-neutral-400"
                                            >
                                                Resolve
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDelete(report.id)}
                                                className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600 transition-colors"
                                                title="Delete Report"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                                        className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-neutral-500 dark:text-neutral-400 hover:text-orange-600 transition-colors flex items-center justify-center border border-neutral-200 dark:border-neutral-700"
                                        title="View Details & Pledges"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="16" x2="12" y2="12"></line>
                                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="hidden lg:block lg:col-span-1 h-full overflow-hidden">
                    <SidebarContent />
                </div>
            </div>
        </div>
    );
}
