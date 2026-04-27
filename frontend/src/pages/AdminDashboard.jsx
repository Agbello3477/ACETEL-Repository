import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AnalyticsCharts from '../components/AnalyticsCharts';
import PublicationAnalytics from '../components/PublicationAnalytics';
import LogoFlipper from '../components/LogoFlipper';
import SubmitThesisForm from '../components/SubmitThesisForm';
import SubmitPublicationForm from '../components/SubmitPublicationForm';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('adminActiveTab') || 'theses';
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('adminActiveTab', activeTab);
    }, [activeTab]);

    // Data State
    const [theses, setTheses] = useState([]);
    const [publications, setPublications] = useState([]);
    const [editingPub, setEditingPub] = useState(null);
    const [users, setUsers] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    // Filters
    const [thesisFilters, setThesisFilters] = useState({
        programme: '', degree: '', status: '', year: '', startDate: '', endDate: '', q: ''
    });
    const [pubFilters, setPubFilters] = useState({
        journal: '', year: '', q: ''
    });

    // Fetching Functions
    const fetchTheses = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const activeFilters = Object.fromEntries(
                Object.entries(thesisFilters).filter(([, value]) => value !== '')
            );
            const queryParams = new URLSearchParams(activeFilters).toString();
            const response = await fetch(`/api/theses?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setTheses(await response.json());
        } catch (error) { console.error("Fetch Theses Error:", error); }
    }, [thesisFilters]);

    const fetchPublications = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const activeFilters = Object.fromEntries(
                Object.entries(pubFilters).filter(([, value]) => value !== '')
            );
            const queryParams = new URLSearchParams(activeFilters).toString();
            const response = await fetch(`/api/publications?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setPublications(await response.json());
        } catch (error) { console.error("Fetch Pubs Error:", error); }
    }, [pubFilters]);

    const fetchUsers = useCallback(async () => {
        if (user?.role !== 'Super Admin') return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/auth/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setUsers(await response.json());
        } catch (error) { console.error("Fetch Users Error:", error); }
    }, [user]);

    const fetchLogs = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/analytics/logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setActivityLogs(await response.json());
        } catch (error) { console.error("Fetch Logs Error:", error); }
    }, []);

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

    // Initial Load & Session Guard
    useEffect(() => {
        // Only redirect if absolutely no user in local state
        const savedUser = localStorage.getItem('user');
        if (!user && !savedUser) {
            navigate('/', { replace: true });
            return;
        }

        // BFCache Protection: Force re-validation when page is shown
        const handlePageShow = (event) => {
            if (event.persisted && !localStorage.getItem('user')) {
                window.location.replace('/');
            }
        };
        window.addEventListener('pageshow', handlePageShow);

        fetchTheses();
        fetchPublications();
        fetchLogs();
        fetchNotifications();
        if (user?.role === 'Super Admin') fetchUsers();
        
        const interval = setInterval(fetchNotifications, 30000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, [user, navigate, fetchTheses, fetchPublications, fetchLogs, fetchNotifications, fetchUsers]);

    // Handle Actions
    const updateThesisStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/theses/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                fetchTheses();
            } else if (response.status === 401) {
                console.warn("Session expired during update.");
                logout(); // From useAuth
            } else {
                const err = await response.json();
                alert(`Error: ${err.message || 'Failed to update status'}`);
            }
        } catch (err) { console.error(err); }
    };

    const deleteThesis = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this thesis record? This cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/theses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchTheses();
            } else {
                const err = await response.json();
                alert(`Error: ${err.message || 'Failed to delete thesis'}`);
            }
        } catch (err) { console.error(err); }
    };

    const deletePublication = async (id) => {
        if (!window.confirm('Are you sure you want to delete this publication record?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/publications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchPublications();
            } else {
                const err = await response.json();
                alert(`Error: ${err.message || 'Failed to delete publication'}`);
            }
        } catch (err) { console.error(err); }
    };

    const toggleUserStatus = async (id, currentStatus) => {
        const action = currentStatus ? 'Block' : 'Unblock';
        if (!window.confirm(`Are you sure you want to ${action} this user account?`)) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/auth/users/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ is_active: !currentStatus })
            });
            if (response.ok) {
                fetchUsers();
            } else {
                const err = await response.json();
                alert(`Error: ${err.message || 'Action failed'}`);
            }
        } catch (err) { console.error(err); }
    };

    const deleteUser = async (id) => {
        if (!window.confirm('CRITICAL: Delete this user account and all associated personal data? This action is permanent.')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/auth/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchUsers();
            } else {
                const err = await response.json();
                alert(`Error: ${err.message || 'Failed to delete user'}`);
            }
        } catch (err) { console.error(err); }
    };



    const markNotifRead = async (id) => {
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

    // Navigation Items
    const navItems = [
        { id: 'theses', label: 'Theses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
        { id: 'publications', label: 'Publications', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14' },
        { id: 'upload', label: 'Upload Thesis', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v8' },
        { id: 'upload-pub', label: 'Publish Article', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2' },
        { id: 'logs', label: 'Activity Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    ];

    if (user?.role === 'Super Admin') {
        navItems.push({ id: 'users', label: 'User Management', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' });
    }

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans selection:bg-emerald-100 selection:text-emerald-700">
            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-6 flex items-center space-x-3 border-b border-white/10">
                        <div className="bg-white p-1.5 rounded-xl shadow-lg shadow-black/20">
                            <LogoFlipper className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg tracking-tight">ATPRS Admin</h2>
                            <p className="text-white/50 text-[10px] uppercase tracking-widest font-semibold">Repository System</p>
                        </div>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                                className={`
                                    w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group
                                    ${activeTab === item.id 
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-1 ring-white/20 font-semibold' 
                                        : 'text-white/60 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                <svg className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-white' : 'text-white/40 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-6 border-t border-white/10 mx-2 mb-2 bg-white/5 rounded-3xl">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-bold shadow-lg ring-2 ring-white/10">
                                {user?.full_name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{user?.full_name}</p>
                                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{user?.role}</p>
                            </div>
                        </div>
                        <button 
                            onClick={logout}
                            className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-sm font-bold transition-all border border-rose-500/20 active:scale-95"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#f1f5f9] overflow-hidden relative">
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 sm:px-8 flex justify-between items-center transition-all bg-opacity-70">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2.5 rounded-xl bg-slate-100 text-slate-600 lg:hidden hover:bg-slate-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                        </button>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                            {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Notification Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                className={`p-2.5 rounded-2xl transition-all relative group ${showNotifDropdown ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                                    <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl shadow-slate-300 ring-1 ring-black/5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                            <h3 className="font-bold text-slate-800">Alerts</h3>
                                            <button onClick={fetchNotifications} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-50">Sync</button>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="p-10 text-center">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                                    </div>
                                                    <p className="text-sm text-slate-400 font-medium italic">No notifications yet</p>
                                                </div>
                                            ) : (
                                                notifications.map(n => (
                                                    <div key={n.id} 
                                                        onClick={() => !n.is_read && markNotifRead(n.id)}
                                                        className={`p-4 border-b border-slate-50 cursor-pointer transition-colors ${!n.is_read ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'}`}
                                                    >
                                                        <p className="text-sm text-slate-700 leading-relaxed">{n.message}</p>
                                                        <div className="flex items-center mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            {new Date(n.created_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="w-px h-8 bg-slate-200 hidden sm:block mx-1"></div>

                        <Link 
                            to="/" 
                            className="px-5 py-2.5 bg-slate-800 text-white rounded-2xl text-sm font-bold shadow-lg shadow-slate-300 hover:shadow-indigo-200 hover:bg-indigo-600 transition-all active:scale-95 flex items-center group"
                        >
                            <svg className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            Portal
                        </Link>
                    </div>
                </header>

                {/* Dashboard Scroll View */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8">
                    {/* Page Loader / Top Analytics (Only for Theses and Pubs) */}
                    {(activeTab === 'theses' || activeTab === 'publications') && (
                        <div className="mb-8">
                             {activeTab === 'theses' ? <AnalyticsCharts /> : <PublicationAnalytics />}
                        </div>
                    )}

                    {/* View: User Management */}
                    {activeTab === 'users' && user?.role === 'Super Admin' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Administrative Access</p>
                                    <h2 className="text-2xl font-black text-slate-800">User Management</h2>
                                </div>
                                <div className="text-xs bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-black border border-emerald-200">
                                    {users.length} TOTAL USERS
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {users.map(u => (
                                    <div key={u.user_id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-emerald-100 transition-all border-b-4 border-b-slate-100 group hover:border-b-emerald-500 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 group-hover:bg-emerald-600 transition-colors duration-300 -z-0 opacity-20"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${u.role === 'Super Admin' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {u.full_name?.charAt(0)}
                                                </div>
                                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ring-1 ring-inset ${u.role === 'Super Admin' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-blue-50 text-blue-700 ring-blue-200'}`}>
                                                    {u.role}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 leading-tight mb-1">{u.full_name}</h3>
                                            <p className="text-xs text-slate-400 font-medium mb-4">{u.email}</p>
                                            
                                            <div className="space-y-2 border-t border-slate-50 pt-4">
                                                {u.role !== 'Student' ? (
                                                    <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Staff ID</span>
                                                        <span className="text-xs font-black text-slate-700">{u.staff_id || 'N/A'}</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Matric</span>
                                                            <span className="text-xs font-black text-slate-700">{u.matric_number || '-'}</span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-2 px-3">{u.programme}</p>
                                                    </>
                                                )}
                                                <div className="flex justify-between items-center px-3 py-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                                                    <span className={`text-[10px] font-black uppercase ${u.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>{u.is_active ? 'Active' : 'Blocked'}</span>
                                                </div>
                                            </div>

                                            {/* Restricted Master Admin Actions */}
                                            {/* Restricted Master Admin Actions - Final Casing/Storage Polish */}
                                            {(user?.email?.toLowerCase() === 'agbello@noun.edu.ng' || JSON.parse(localStorage.getItem('user'))?.email?.toLowerCase() === 'agbello@noun.edu.ng') && (
                                                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                                    <button 
                                                        onClick={() => toggleUserStatus(u.user_id, u.is_active)}
                                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                            u.is_active ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                                        }`}
                                                    >
                                                        {u.is_active ? 'Block Account' : 'Unblock Account'}
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteUser(u.user_id)}
                                                        className="p-2 bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                                                        title="Delete User Permanently"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View: Theses (Main List) */}
                    {activeTab === 'theses' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Thesis Submissions</h2>
                                    <p className="text-slate-500 text-sm font-medium">Review, approve, and manage the student research repository.</p>
                                </div>

                            </div>

                            {/* Thesis Filters Grid */}
                            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-2xl shadow-slate-200/50 mb-10 overflow-hidden relative group">
                                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600/10 group-hover:bg-indigo-600 transition-colors"></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Search Database</label>
                                        <div className="relative">
                                            <input name="q" value={thesisFilters.q} onChange={(e) => setThesisFilters({...thesisFilters, q: e.target.value})} placeholder="Title, Abstract, Keyword..." className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
                                            <svg className="w-5 h-5 absolute right-4 top-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Programme</label>
                                        <select name="programme" value={thesisFilters.programme} onChange={(e) => setThesisFilters({...thesisFilters, programme: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all ring-inset">
                                            <option value="">All Streams</option>
                                            <option value="Artificial Intelligence">Artificial Intelligence</option>
                                            <option value="Cyber Security">Cyber Security</option>
                                            <option value="Management Information System">Management Information System</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Degree</label>
                                        <select name="degree" value={thesisFilters.degree} onChange={(e) => setThesisFilters({...thesisFilters, degree: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all">
                                            <option value="">Degree (All)</option>
                                            <option value="MSc">MSc</option>
                                            <option value="PhD">PhD</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Curatorial Status</label>
                                        <select name="status" value={thesisFilters.status} onChange={(e) => setThesisFilters({...thesisFilters, status: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all">
                                            <option value="">Status (All)</option>
                                            <option value="Submitted">Submitted</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Locked">Locked</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Graduation Year</label>
                                        <input name="year" type="number" value={thesisFilters.year} onChange={(e) => setThesisFilters({...thesisFilters, year: e.target.value})} placeholder="YYYY" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-slate-100">
                                    <button onClick={() => setThesisFilters({ programme: '', status: '', year: '', startDate: '', endDate: '', q: '' })} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Reset</button>
                                    <button 
                                        onClick={() => {
                                            const doc = new jsPDF('l');
                                            const headers = [['S/N', 'Title', 'Student', 'Programme', 'Degree', 'Status', 'Date']];
                                            const data = theses.map((t, index) => [
                                                index + 1,
                                                t.title, 
                                                t.author_name || t.author_account_name, 
                                                t.programme, 
                                                t.degree || 'MSc',
                                                t.status, 
                                                new Date(t.created_at).toLocaleDateString()
                                            ]);

                                            // Page Header
                                            doc.setFontSize(18);
                                            doc.setTextColor(40);
                                            doc.text("ACETEL Thesis Repository System", 14, 15);
                                            doc.setFontSize(10);
                                            doc.setTextColor(100);
                                            doc.text(`Generated by: ${user?.name || 'Admin'} | Date: ${new Date().toLocaleString()}`, 14, 22);

                                            autoTable(doc, { 
                                                head: headers, 
                                                body: data, 
                                                startY: 30,
                                                styles: { fontSize: 8, cellPadding: 3 },
                                                headStyles: { fillStyle: 'f', fillColor: [79, 70, 229], textColor: 255 },
                                                didDrawPage: (data) => {
                                                    // Watermark
                                                    const img = new Image();
                                                    img.src = '/assets/acetel_logo.png';
                                                    doc.saveGraphicsState();
                                                    doc.setGState(new doc.GState({ opacity: 0.1 }));
                                                    // Center watermark
                                                    const pageSize = doc.internal.pageSize;
                                                    const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                                                    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                                                    doc.addImage(img, 'PNG', pageWidth / 2 - 50, pageHeight / 2 - 50, 100, 100);
                                                    doc.restoreGraphicsState();
                                                }
                                            });
                                            doc.save(`ADTRS_Theses_Export_${new Date().getTime()}.pdf`);
                                        }}
                                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2-8H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9l-5-5z" /></svg>
                                        Get PDF
                                    </button>
                                </div>
                            </div>

                            {/* Table Container */}
                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Title & Student</th>
                                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Programme Info</th>
                                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Supervisory Team</th>
                                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {theses.map(t => (
                                                <tr key={t.thesis_id} className="group hover:bg-indigo-50/30 transition-colors">
                                                    <td className="px-8 py-7">
                                                        <div className="max-w-md">
                                                            <div className="font-bold text-slate-800 mb-1.5 group-hover:text-emerald-700 transition-colors line-clamp-2">{t.title}</div>
                                                            <div className="flex items-center space-x-2">
                                                                <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                    { (t.author_name || t.author_account_name)?.charAt(0) }
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-500">{t.author_name || t.author_account_name || 'Legacy Author'}</span>
                                                                <span className="text-[10px] text-slate-300 font-bold tracking-widest">{t.matric_number || t.author_account_matric}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-7">
                                                        <div className="text-xs font-black text-slate-700 mb-1">{t.programme}</div>
                                                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 inline-block px-2 py-0.5 rounded-full">{t.degree}</div>
                                                    </td>
                                                    <td className="px-6 py-7">
                                                        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                                                            {Array.isArray(t.supervisors) ? t.supervisors.map((s, i) => (
                                                                <span key={i} className="text-[9px] font-black bg-white ring-1 ring-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-tight">{s}</span>
                                                            )) : <span className="text-[10px] italic text-slate-400 font-medium">{t.supervisors || 'Unassigned'}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-7">
                                                        <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-block ring-1 ring-inset ${
                                                            t.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                                                            t.status === 'Submitted' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                                                            'bg-slate-100 text-slate-600 ring-slate-200'
                                                        }`}>
                                                            {t.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-7 text-right space-x-2 whitespace-nowrap">
                                                        <a href={t.pdf_url?.startsWith('http') ? t.pdf_url : `/${t.pdf_url}`} target="_blank" className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-800 hover:text-white transition-all inline-block shadow-sm">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                                        </a>
                                                        {t.status !== 'Approved' && (
                                                            <button 
                                                                onClick={() => updateThesisStatus(t.thesis_id, 'Approved')}
                                                                className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm ring-1 ring-emerald-200"
                                                                title="Approve Submission"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => deleteThesis(t.thesis_id)}
                                                            className="p-2.5 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm ring-1 ring-rose-100"
                                                            title="Delete Record"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {theses.length === 0 && (
                                        <div className="p-20 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                                            </div>
                                            <p className="text-slate-400 font-bold text-lg">No Thesis Records Found</p>
                                            <p className="text-slate-300 text-sm">Try adjusting your curatorial filters above.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View: Publications */}
                    {activeTab === 'publications' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Academic Publications</h2>
                                    <p className="text-slate-500 text-sm font-medium">Manage faculty research, journals, and conference papers.</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        const doc = new jsPDF('l');
                                        const headers = [['S/N', 'Title', 'Authors', 'Journal', 'DOI', 'Date']];
                                        const data = publications.map((p, index) => [
                                            index + 1,
                                            p.title,
                                            Array.isArray(p.authors) ? p.authors.join(', ') : p.authors,
                                            p.journal_name,
                                            p.doi || 'N/A',
                                            p.publication_date ? new Date(p.publication_date).toLocaleDateString() : 'N/A'
                                        ]);

                                        doc.setFontSize(18);
                                        doc.setTextColor(40);
                                        doc.text("ACETEL Publication Repository", 14, 15);
                                        doc.setFontSize(10);
                                        doc.setTextColor(100);
                                        doc.text(`Generated by: ${user?.name || 'Admin'} | Date: ${new Date().toLocaleString()}`, 14, 22);

                                        autoTable(doc, { 
                                            head: headers, 
                                            body: data, 
                                            startY: 30,
                                            styles: { fontSize: 8, cellPadding: 3 },
                                            headStyles: { fillStyle: 'f', fillColor: [37, 99, 235], textColor: 255 },
                                            didDrawPage: (data) => {
                                                const img = new Image();
                                                img.src = '/assets/acetel_logo.png';
                                                doc.saveGraphicsState();
                                                doc.setGState(new doc.GState({ opacity: 0.1 }));
                                                const pageSize = doc.internal.pageSize;
                                                const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                                                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                                                doc.addImage(img, 'PNG', pageWidth / 2 - 50, pageHeight / 2 - 50, 100, 100);
                                                doc.restoreGraphicsState();
                                            }
                                        });
                                        doc.save(`ADTRS_Publications_Export_${new Date().getTime()}.pdf`);
                                    }}
                                    className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center shadow-xl shadow-emerald-100 hover:shadow-emerald-300 hover:bg-emerald-700 transition-all active:scale-95 self-start"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2-8H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9l-5-5z" /></svg>
                                    Get PDF
                                </button>
                            </div>

                             <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-2xl shadow-slate-200/50 mb-10 overflow-hidden relative group">
                                <div className="absolute top-0 left-0 w-2 h-full bg-blue-600/10 group-hover:bg-blue-600 transition-colors"></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Search Publications</label>
                                        <div className="relative">
                                            <input name="q" value={pubFilters.q} onChange={(e) => setPubFilters({...pubFilters, q: e.target.value})} placeholder="Title, Authors, Keywords..." className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 transition-all" />
                                            <svg className="w-5 h-5 absolute right-4 top-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Journal / Issue</label>
                                        <input name="journal" value={pubFilters.journal} onChange={(e) => setPubFilters({...pubFilters, journal: e.target.value})} placeholder="Filtering by Journal..." className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Year</label>
                                        <input name="year" type="number" value={pubFilters.year} onChange={(e) => setPubFilters({...pubFilters, year: e.target.value})} placeholder="YYYY" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 transition-all" />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-slate-100">
                                    <button onClick={() => setPubFilters({ journal: '', year: '', q: '' })} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Reset</button>
                                    <button 
                                        onClick={() => {
                                            const doc = new jsPDF('l');
                                            const headers = [['S/N', 'Title', 'Authors', 'Journal', 'DOI', 'Date']];
                                            const data = publications.map((p, index) => [
                                                index + 1,
                                                p.title,
                                                Array.isArray(p.authors) ? p.authors.join(', ') : p.authors,
                                                p.journal_name,
                                                p.doi || 'N/A',
                                                p.publication_date ? new Date(p.publication_date).toLocaleDateString() : 'N/A'
                                            ]);

                                            // Page Header
                                            doc.setFontSize(18);
                                            doc.setTextColor(40);
                                            doc.text("ACETEL Publication Repository", 14, 15);
                                            doc.setFontSize(10);
                                            doc.setTextColor(100);
                                            doc.text(`Generated by: ${user?.name || 'Admin'} | Date: ${new Date().toLocaleString()}`, 14, 22);

                                            autoTable(doc, { 
                                                head: headers, 
                                                body: data, 
                                                startY: 30,
                                                styles: { fontSize: 8, cellPadding: 3 },
                                                headStyles: { fillStyle: 'f', fillColor: [37, 99, 235], textColor: 255 },
                                                didDrawPage: (data) => {
                                                    // Watermark
                                                    const img = new Image();
                                                    img.src = '/assets/acetel_logo.png';
                                                    doc.saveGraphicsState();
                                                    doc.setGState(new doc.GState({ opacity: 0.1 }));
                                                    const pageSize = doc.internal.pageSize;
                                                    const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                                                    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                                                    doc.addImage(img, 'PNG', pageWidth / 2 - 50, pageHeight / 2 - 50, 100, 100);
                                                    doc.restoreGraphicsState();
                                                }
                                            });
                                            doc.save(`ADTRS_Publications_Export_${new Date().getTime()}.pdf`);
                                        }}
                                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2-8H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9l-5-5z" /></svg>
                                        Get PDF
                                    </button>
                                </div>
                            </div>

                             <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Title & Content</th>
                                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Collaborators</th>
                                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Journal Info</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Access</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {publications.map(p => (
                                                <tr key={p.publication_id} className="hover:bg-emerald-50/20 transition-colors">
                                                    <td className="px-8 py-7">
                                                        <div className="font-bold text-slate-800 mb-2 line-clamp-1">{p.title}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold">DATE: {p.publication_date ? new Date(p.publication_date).toLocaleDateString() : 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-7">
                                                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                                            {Array.isArray(p.authors) ? p.authors.map((a, i) => (
                                                                <span key={i} className="text-[9px] font-black bg-white ring-1 ring-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-tight">{a}</span>
                                                            )) : <span className="text-[10px] text-slate-400">No Authors listed</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-7">
                                                        <div className="text-xs font-black text-slate-700">{p.journal_name}</div>
                                                        {p.doi && <div className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-widest">{p.doi}</div>}
                                                    </td>
                                                    <td className="px-8 py-7 text-right space-x-2 whitespace-nowrap">
                                                        <button 
                                                            onClick={() => {
                                                                setEditingPub(p);
                                                                setActiveTab('upload-pub');
                                                            }}
                                                            className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all inline-block text-[10px] font-black uppercase tracking-widest"
                                                        >
                                                            EDIT
                                                        </button>
                                                        <button 
                                                            onClick={() => deletePublication(p.publication_id)}
                                                            className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all inline-block text-[10px] font-black uppercase tracking-widest"
                                                        >
                                                            DELETE
                                                        </button>
                                                        {p.pdf_url && (
                                                            <a href={p.pdf_url?.startsWith('http') ? p.pdf_url : `/${p.pdf_url}`} target="_blank" className="p-2.5 rounded-xl bg-slate-800 text-white hover:bg-black transition-all inline-block text-[10px] font-black uppercase tracking-widest">
                                                                PDF
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {publications.length === 0 && (
                                        <div className="p-20 text-center">
                                            <p className="text-slate-400 font-bold">No publication records found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View: Upload Center (Thesis) */}
                    {activeTab === 'upload' && (
                        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <SubmitThesisForm onComplete={() => setActiveTab('theses')} />
                        </div>
                    )}

                    {/* View: Publish Center (Publications) */}
                    {activeTab === 'upload-pub' && (
                        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <SubmitPublicationForm 
                                existingData={editingPub} 
                                onComplete={() => {
                                    setEditingPub(null);
                                    setActiveTab('publications');
                                    fetchPublications();
                                }} 
                             />
                        </div>
                    )}

                    {/* View: Logs */}
                    {activeTab === 'logs' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Security Audit Logs</h2>
                                    <p className="text-slate-500 text-sm font-medium italic">Tracing administrative footprints across the ATPRS network.</p>
                                </div>
                                <button onClick={fetchLogs} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                            </div>

                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100 uppercase text-[10px] font-black tracking-widest text-slate-400">
                                                <th className="px-8 py-6">Identity</th>
                                                <th className="px-6 py-6">Event Type</th>
                                                <th className="px-6 py-6">Target Record</th>
                                                <th className="px-6 py-6">Digital Signature (IP)</th>
                                                <th className="px-8 py-6 text-right">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {activityLogs.map(log => (
                                                <tr key={log.log_id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="font-bold text-slate-800 text-sm">{log.user_name || 'Automated System'}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold tracking-wider">{log.user_role} {log.staff_id && `[SID: ${log.staff_id}]`}</div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-slate-200">
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 font-mono text-xs text-slate-400">ID# {log.target_id || 'System'}</td>
                                                    <td className="px-6 py-5 font-mono text-[10px] text-slate-400 tracking-tighter">{log.ip_address}</td>
                                                    <td className="px-8 py-5 text-right text-[11px] font-bold text-slate-500 whitespace-nowrap">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Injected Styles for animations and scrollbars */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-in-from-bottom {
                    from { transform: translateY(1rem); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-in {
                    animation-fill-mode: both;
                    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                }
                .slide-in-from-bottom-4 {
                    animation-name: slide-in-from-bottom;
                }
                .fade-in {
                    animation-name: fade-in;
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
