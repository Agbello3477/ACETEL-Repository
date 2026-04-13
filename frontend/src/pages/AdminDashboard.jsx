import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AnalyticsCharts from '../components/AnalyticsCharts';
import PublicationAnalytics from '../components/PublicationAnalytics';
import LogoFlipper from '../components/LogoFlipper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('theses'); // 'theses' or 'publications'

    // Theses State
    const [theses, setTheses] = useState([]);
    const [thesisFilters, setThesisFilters] = useState({
        programme: '', status: '', year: '', startDate: '', endDate: '', q: ''
    });

    // Publications State
    const [publications, setPublications] = useState([]);
    const [pubFilters, setPubFilters] = useState({
        journal: '', year: '', q: ''
    });

    // Logs State
    const [activityLogs, setActivityLogs] = useState([]);

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    const lastNotifiedIdRef = useRef(null);

    useEffect(() => {
        const unread = notifications.filter(n => !n.is_read);
        if (unread.length > 0) {
            const latest = unread[0];
            if (latest.id !== lastNotifiedIdRef.current) {
                lastNotifiedIdRef.current = latest.id;
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('ATPRS Admin Update', { body: latest.message, icon: '/favicon.ico' });
                } else if ('Notification' in window && Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification('ATPRS Admin Update', { body: latest.message, icon: '/favicon.ico' });
                        }
                    });
                }
            }
        }
    }, [notifications]);

    const requestNotificationPermission = () => {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') alert('Notifications enabled!');
            });
        }
    };

    const fetchTheses = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const activeFilters = Object.fromEntries(
                Object.entries(thesisFilters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
            );
            const queryParams = new URLSearchParams(activeFilters).toString();
            const response = await fetch(`/api/theses?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTheses(data);
            }
        } catch (error) {
            console.error("Failed to fetch theses", error);
        }
    }, [thesisFilters]);

    const fetchPublications = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const activeFilters = Object.fromEntries(
                Object.entries(pubFilters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
            );
            const queryParams = new URLSearchParams(activeFilters).toString();
            const response = await fetch(`/api/publications?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPublications(data);
            }
        } catch (error) {
            console.error("Failed to fetch publications", error);
        }
    }, [pubFilters]);

    const fetchLogs = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/analytics/logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setActivityLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
        }
    }, []);

    const handleExportTheses = async () => {
        try {
            const logoBase64 = await new Promise((resolve, reject) => {
                const img = new Image();
                img.src = '/assets/acetel_logo.png';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.globalAlpha = 0.1;
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = reject;
            });

            const doc = new jsPDF('landscape');
            doc.setFontSize(18);
            doc.text("ACETEL Thesis Repository Export", 14, 22);

            const headers = ['S/N', 'Title', 'Student', 'Matric Number', 'Programme', 'Status', 'Date'];
            const rows = theses.map((t, index) => [
                index + 1,
                t.title,
                t.author_name || t.author_account_name || '-',
                t.matric_number || t.author_account_matric || '-',
                t.programme,
                t.status,
                t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : '-'
            ]);

            autoTable(doc, {
                startY: 30,
                head: [headers],
                body: rows,
                didDrawPage: () => {
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    const imgWidth = 100;
                    const imgHeight = 100;
                    const x = (pageWidth - imgWidth) / 2;
                    const y = (pageHeight - imgHeight) / 2;
                    doc.addImage(logoBase64, 'PNG', x, y, imgWidth, imgHeight);
                }
            });

            doc.save(`theses_export_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("Error generating theses PDF:", err);
            alert("An error occurred during export.");
        }
    };

    const handleExportPublications = async () => {
        try {
            const logoBase64 = await new Promise((resolve, reject) => {
                const img = new Image();
                img.src = '/assets/acetel_logo.png';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.globalAlpha = 0.1;
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = reject;
            });

            const doc = new jsPDF('landscape');
            doc.setFontSize(18);
            doc.text("ACETEL Publications Repository Export", 14, 22);

            const headers = ['S/N', 'Title', 'Authors', 'Journal', 'DOI', 'Date'];
            const rows = publications.map((p, index) => [
                index + 1,
                p.title,
                Array.isArray(p.authors) ? p.authors.join(', ') : p.authors || '',
                p.journal_name,
                p.doi || '',
                p.publication_date ? new Date(p.publication_date).toISOString().split('T')[0] : ''
            ]);

            autoTable(doc, {
                startY: 30,
                head: [headers],
                body: rows,
                didDrawPage: () => {
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    const imgWidth = 100;
                    const imgHeight = 100;
                    const x = (pageWidth - imgWidth) / 2;
                    const y = (pageHeight - imgHeight) / 2;
                    doc.addImage(logoBase64, 'PNG', x, y, imgWidth, imgHeight);
                }
            });

            doc.save(`publications_export_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("Error generating publications PDF:", err);
            alert("An error occurred during publication export.");
        }
    };

    const clearFilters = () => {
        if (activeTab === 'theses') {
            setThesisFilters({ programme: '', status: '', year: '', startDate: '', endDate: '', q: '' });
        } else {
            setPubFilters({ journal: '', year: '', q: '' });
        }
    };

    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        } catch (err) { console.error(err); }
    }, []);

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) { console.error(err); }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/theses/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) fetchTheses();
        } catch (err) { console.error(err); }
    };

    const deletePublication = async (id) => {
        if (!window.confirm('Are you sure you want to delete this publication?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/publications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) fetchPublications();
        } catch (err) { console.error(err); }
    };

    const handleThesisFilterChange = (e) => setThesisFilters({ ...thesisFilters, [e.target.name]: e.target.value });
    const handlePubFilterChange = (e) => setPubFilters({ ...pubFilters, [e.target.name]: e.target.value });

    useEffect(() => {
        if (user) {
            fetchTheses();
            fetchPublications();
            fetchLogs();
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user, fetchTheses, fetchPublications, fetchLogs, fetchNotifications]);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Top Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="w-full max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <LogoFlipper />
                            <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 truncate max-w-[250px] md:max-w-none">
                                ACETEL Thesis and Publication Repository System <span className="text-gray-400 font-light text-xl">| Admin</span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Notification Bell */}
                            <div className="relative mr-4">
                                <button onClick={() => setShowNotifications(!showNotifications)} className="p-1 rounded-full text-gray-600 hover:bg-gray-100 relative">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500"></span>}
                                </button>
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5 max-h-96 overflow-y-auto">
                                        <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                            <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                                            <button onClick={fetchNotifications} className="text-xs text-indigo-600">Refresh</button>
                                        </div>
                                        {/* Permission Helper */}
                                        {'Notification' in window && Notification.permission !== 'granted' && (
                                            <div className="bg-yellow-50 px-4 py-2 text-xs text-yellow-700 flex justify-between items-center">
                                                <span>Enable desktop alerts?</span>
                                                <button onClick={requestNotificationPermission} className="underline font-bold">Enable</button>
                                            </div>
                                        )}
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-3 text-sm text-gray-500">No notifications</div>
                                        ) : (
                                            notifications.map(notification => (
                                                <div key={notification.id} className={`px-4 py-3 border-b hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`} onClick={() => !notification.is_read && markAsRead(notification.id)}>
                                                    <p className="text-sm text-gray-800">{notification.message}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-sm font-medium text-gray-900">{user?.full_name}</span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider">{user?.role}</span>
                            </div>
                            <button onClick={logout} className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors">Sign Out</button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="w-full max-w-[95%] mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-10">
                    {activeTab === 'theses' ? <AnalyticsCharts /> : <PublicationAnalytics />}
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('theses')}
                            className={`${activeTab === 'theses' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}
                        >
                            Theses Repository
                        </button>
                        <button
                            onClick={() => setActiveTab('publications')}
                            className={`${activeTab === 'publications' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}
                        >
                            Publications Repository
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`${activeTab === 'logs' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}
                        >
                            Activity Logs
                        </button>
                    </nav>
                </div>

                {/* Theses View */}
                {activeTab === 'theses' && (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Theses</h2>
                                <p className="text-sm text-gray-500">Manage student submissions and legacy uploads.</p>
                            </div>
                            <button onClick={() => navigate('/admin/submit-thesis')} className="mt-4 sm:mt-0 px-5 py-2.5 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700">
                                Upload Legacy Thesis
                            </button>
                        </div>
                        
                        {/* Thesis Filters */}
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                <input name="q" type="text" placeholder="Search title, abstract..." value={thesisFilters.q} onChange={handleThesisFilterChange} className="md:col-span-2 p-2.5 w-full rounded-md border-gray-300 border" />
                                <select name="programme" value={thesisFilters.programme} onChange={handleThesisFilterChange} className="p-2.5 w-full rounded-md border-gray-300 border bg-white">
                                    <option value="">All Programmes</option>
                                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                                    <option value="Cyber Security">Cyber Security</option>
                                    <option value="Management Information System">Management Information System</option>
                                </select>
                                <select name="status" value={thesisFilters.status} onChange={handleThesisFilterChange} className="p-2.5 w-full rounded-md border-gray-300 border bg-white">
                                    <option value="">All Statuses</option>
                                    <option value="Submitted">Submitted</option><option value="Approved">Approved</option>
                                    <option value="Locked">Locked</option><option value="Draft">Draft</option>
                                </select>
                                <input name="startDate" type="date" value={thesisFilters.startDate} onChange={handleThesisFilterChange} className="p-2.5 w-full rounded-md border-gray-300 border" />
                                <input name="endDate" type="date" value={thesisFilters.endDate} onChange={handleThesisFilterChange} className="p-2.5 w-full rounded-md border-gray-300 border" />
                            </div>
                            <div className="mt-4 flex justify-end space-x-3 no-print">
                                <button onClick={clearFilters} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md">Clear</button>
                                <button onClick={handleExportTheses} className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Export PDF
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title / Abstract</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisors</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {theses.map((thesis) => (
                                        <tr key={thesis.thesis_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 mb-1">{thesis.title}</div>
                                                <div className="text-xs text-gray-500 line-clamp-2 max-w-sm">{thesis.abstract}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="font-medium">{thesis.author_name || thesis.author_account_name || 'Legacy Account'}</div>
                                                <div className="text-xs text-gray-500">{thesis.matric_number || thesis.author_account_matric || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <span className="font-medium block">{thesis.programme}</span>
                                                <span className="text-xs">{thesis.degree}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {Array.isArray(thesis.supervisors) ? (
                                                        thesis.supervisors.map((s, i) => (
                                                            <span key={i} className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100 text-[11px] font-medium">{s}</span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs italic">{thesis.supervisors || 'Not assigned'}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100">{thesis.status}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <a href={`/${thesis.pdf_url}`} target="_blank" className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded">View</a>
                                                {thesis.status !== 'Approved' && <button onClick={() => updateStatus(thesis.thesis_id, 'Approved')} className="text-green-600 bg-green-50 px-3 py-1 rounded">Approve</button>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Publications View */}
                {activeTab === 'publications' && (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Publications</h2>
                                <p className="text-sm text-gray-500">Manage academic journals, conferences, and publications.</p>
                            </div>
                            <button onClick={() => navigate('/admin/submit-publication')} className="mt-4 sm:mt-0 px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700">
                                Upload Publication
                            </button>
                        </div>
                        
                        {/* Pub Filters */}
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input name="q" type="text" placeholder="Search title, abstract, authors..." value={pubFilters.q} onChange={handlePubFilterChange} className="md:col-span-2 p-2.5 w-full rounded-md border-gray-300 border" />
                                <input name="journal" type="text" placeholder="Journal/Conference" value={pubFilters.journal} onChange={handlePubFilterChange} className="p-2.5 w-full rounded-md border-gray-300 border" />
                                <input name="year" type="number" placeholder="Year" value={pubFilters.year} onChange={handlePubFilterChange} className="p-2.5 w-full rounded-md border-gray-300 border" />
                            </div>
                            <div className="mt-4 flex justify-end space-x-3 no-print">
                                <button onClick={clearFilters} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md">Clear</button>
                                <button onClick={handleExportPublications} className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Export PDF
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title / Authors</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journal & Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identifiers</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {publications.map((pub) => (
                                        <tr key={pub.publication_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 mb-1">{pub.title}</div>
                                                <div className="text-xs text-gray-500">
                                                    By: {Array.isArray(pub.authors) ? pub.authors.join(', ') : 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <span className="font-medium block">{pub.journal_name}</span>
                                                <span className="text-xs">{pub.publication_date ? new Date(pub.publication_date).toLocaleDateString() : 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {pub.doi && <div className="block">DOI: {pub.doi}</div>}
                                                {(pub.volume || pub.issue) && <div className="text-xs">Vol {pub.volume || '-'} / Iss {pub.issue || '-'}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                {pub.pdf_url && <a href={`/${pub.pdf_url}`} target="_blank" className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded">PDF</a>}
                                                {pub.external_link && <a href={pub.external_link} target="_blank" rel="noreferrer" className="text-blue-600 bg-blue-50 px-3 py-1 rounded">Link</a>}
                                                <button onClick={() => deletePublication(pub.publication_id)} className="text-red-600 bg-red-50 px-3 py-1 rounded">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {publications.length === 0 && (
                                <div className="p-8 text-center text-gray-500">No publications found.</div>
                            )}
                        </div>
                    </>
                )}

                {/* Logs View */}
                {activeTab === 'logs' && (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">System Activity Logs</h2>
                                <p className="text-sm text-gray-500">Monitor administrative actions and user events across the system.</p>
                            </div>
                            <button onClick={fetchLogs} className="mt-4 sm:mt-0 p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin / User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {activityLogs.map((log) => (
                                        <tr key={log.log_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{log.user_name || 'System / Auto'}</div>
                                                <div className="text-xs text-gray-500">{log.user_role || ''} {log.staff_id ? `(${log.staff_id})` : ''}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">{log.action}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.target_id || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                                                {log.ip_address || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {activityLogs.length === 0 && (
                                <div className="p-8 text-center text-gray-500">No activity logs recorded.</div>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-transparent text-gray-500 py-6 text-center border-t border-gray-200 mt-auto">
                <p className="text-xs">&copy; {new Date().getFullYear()} ACETEL Thesis and Publication Repository System.</p>
                <p className="mt-1 text-xs font-semibold tracking-wide text-gray-500">
                    <span>Powered by: </span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-blue-600">MaSha Secure Tech</span>
                </p>
            </footer>
        </div>
    );
};

export default AdminDashboard;
