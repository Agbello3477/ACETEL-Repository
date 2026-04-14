import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import LogoFlipper from '../components/LogoFlipper';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
    const [activeTab, setActiveTab] = useState('theses'); // 'theses' or 'publications'
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    
    // Auth Modal State
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
    
    useEffect(() => {
        if (location.state?.openLogin) {
            setAuthMode('login');
            setIsAuthOpen(true);
            // Clear state to prevent re-opening on manual refresh
            navigate(location.pathname, { replace: true, state: {} });
        } else if (location.state?.openRegister) {
            setAuthMode('register');
            setIsAuthOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);
    const [authError, setAuthError] = useState('');
    const [authSuccess, setAuthSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Login State
    const [loginData, setLoginData] = useState({ email: '', password: '', secretCode: '' });
    
    // Register State
    const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', staffId: '' });

    // Theses State
    const [theses, setTheses] = useState([]);
    const [thesisFilters, setThesisFilters] = useState({ q: '', programme: '', year: '' });

    // Publications State
    const [publications, setPublications] = useState([]);
    const [pubFilters, setPubFilters] = useState({ q: '', journal: '', year: '' });

    const fetchTheses = async () => {
        try {
            const queryParams = new URLSearchParams(thesisFilters).toString();
            const response = await fetch(`/api/theses/public?${queryParams}`);
            if (response.ok) {
                const data = await response.json();
                setTheses(data);
            }
        } catch (error) {
            console.error("Failed to fetch public theses", error);
        }
    };

    const fetchPublications = async () => {
        try {
            const queryParams = new URLSearchParams(pubFilters).toString();
            const response = await fetch(`/api/publications/public?${queryParams}`);
            if (response.ok) {
                const data = await response.json();
                setPublications(data);
            }
        } catch (error) {
            console.error("Failed to fetch public publications", error);
        }
    };

    useEffect(() => {
        if (activeTab === 'theses') {
            fetchTheses();
        } else {
            fetchPublications();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, thesisFilters, pubFilters]);

    const handleThesisFilterChange = (e) => setThesisFilters({ ...thesisFilters, [e.target.name]: e.target.value });
    const handlePubFilterChange = (e) => setPubFilters({ ...pubFilters, [e.target.name]: e.target.value });

    // Login Handle
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError('');
        setLoading(true);

        if (loginData.secretCode !== 'ACE2019') {
            setAuthError("Security Error: Invalid Secret Code.");
            setLoading(false);
            return;
        }

        try {
            const result = await login(loginData.email, loginData.password);
            if (result.success) {
                if (result.data.role === 'Centre Admin' || result.data.role === 'Super Admin') {
                    navigate('/admin-dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setAuthError(result.message);
            }
        } catch (err) {
            setAuthError("Unexpected error during login.");
        } finally {
            setLoading(false);
        }
    };

    // Register Handle
    const handleRegister = async (e) => {
        e.preventDefault();
        setAuthError('');
        setLoading(true);

        if (!registerData.email.endsWith('@noun.edu.ng')) {
            setAuthError('Email must be @noun.edu.ng');
            setLoading(false);
            return;
        }

        if (!/^\d{5}$/.test(registerData.staffId)) {
            setAuthError('Staff ID must be exactly 5 digits');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: registerData.name,
                    email: registerData.email,
                    password: registerData.password,
                    role: 'centre_admin',
                    staff_id: registerData.staffId
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setAuthSuccess('Registration successful! Switch to Login to continue.');
                setAuthMode('login');
                setTimeout(() => setAuthSuccess(''), 5000);
            } else {
                setAuthError(data.message || 'Registration failed');
            }
        } catch (err) {
            setAuthError('System error during registration.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
            {/* Header / Nav */}
            <header className="bg-white shadow-sm z-10 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <LogoFlipper />
                        <h1 className="text-2xl font-bold text-primary md:text-xl lg:text-2xl truncate max-w-[250px] md:max-w-none">ACETEL Thesis and Publication Repository System</h1>
                    </div>
                    <nav className="space-x-4">
                        <button 
                            onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }}
                            className="text-gray-600 hover:text-primary font-medium transition-colors"
                        >
                            Admin Login
                        </button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-primary text-white py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">ACETEL Research Repository</h2>
                    <p className="text-lg md:text-xl text-emerald-100 mb-8">Access the latest research, theses, and academic publications from the Africa Centre of Excellence on Technology Enhanced Learning.</p>

                    {/* Search Bar in Hero */}
                    <div className="bg-white p-2 rounded-lg shadow-lg flex flex-col md:flex-row gap-2 max-w-2xl mx-auto">
                        <input
                            name="q"
                            type="text"
                            placeholder={activeTab === 'theses' ? "Search theses, authors, keywords..." : "Search publications, journals, authors..."}
                            className="flex-grow p-3 rounded text-gray-800 focus:outline-none"
                            value={activeTab === 'theses' ? thesisFilters.q : pubFilters.q}
                            onChange={activeTab === 'theses' ? handleThesisFilterChange : handlePubFilterChange}
                        />
                        <button onClick={activeTab === 'theses' ? fetchTheses : fetchPublications} className="bg-secondary text-white px-6 py-3 rounded font-semibold hover:bg-yellow-600 transition">Search</button>
                    </div>
                </div>
            </section>

            {/* Auth Modal Overlay */}
            {isAuthOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-md w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/20 relative animate-in zoom-in-95 duration-300">
                        {/* Close button */}
                        <button 
                            onClick={() => setIsAuthOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <div className="p-8">
                            <div className="flex justify-center mb-6">
                                <LogoFlipper />
                            </div>
                            <h2 className="text-2xl font-bold text-center text-primary mb-2">
                                {authMode === 'login' ? 'Welcome Back' : 'Join ATPRS'}
                            </h2>
                            <p className="text-center text-gray-500 mb-8 text-sm">
                                {authMode === 'login' ? 'Please log in to manage records.' : 'Create an administrator account.'}
                            </p>

                            {authError && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 animate-pulse">{authError}</div>}
                            {authSuccess && <div className="mb-6 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">{authSuccess}</div>}

                            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                                {authMode === 'register' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={registerData.name}
                                            onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                            placeholder="Adebayo Ogunlesi"
                                            required
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">NOUN Email</label>
                                    <input
                                        type="email"
                                        value={authMode === 'login' ? loginData.email : registerData.email}
                                        onChange={(e) => authMode === 'login' ? setLoginData({...loginData, email: e.target.value}) : setRegisterData({...registerData, email: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                        placeholder="user@noun.edu.ng"
                                        required
                                    />
                                </div>
                                {authMode === 'register' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Staff ID (5 Digits)</label>
                                        <input
                                            type="text"
                                            value={registerData.staffId}
                                            onChange={(e) => setRegisterData({...registerData, staffId: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                            placeholder="12345"
                                            maxLength="5"
                                            required
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={authMode === 'login' ? loginData.password : registerData.password}
                                        onChange={(e) => authMode === 'login' ? setLoginData({...loginData, password: e.target.value}) : setRegisterData({...registerData, password: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                {authMode === 'login' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Secret security Code</label>
                                        <input
                                            type="password"
                                            value={loginData.secretCode}
                                            onChange={(e) => setLoginData({...loginData, secretCode: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                            placeholder="Enter security code"
                                            required
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-primary to-green-700 text-white rounded-xl font-bold shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Register Admin')}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <button 
                                    onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                                    className="text-primary hover:text-green-800 font-semibold text-sm transition-colors"
                                >
                                    {authMode === 'login' ? "New here? Create account" : "Have an account? Sign in"}
                                </button>
                                <div className="mt-4 flex items-center justify-center space-x-1 opacity-60">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400">Secure access by MaSha Tech</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 mt-8 border-b border-gray-200 w-full">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('theses')}
                        className={`${activeTab === 'theses' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}
                    >
                        Theses
                    </button>
                    <button
                        onClick={() => setActiveTab('publications')}
                        className={`${activeTab === 'publications' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}
                    >
                        Academic Publications
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="w-full md:w-64 space-y-6">
                        {activeTab === 'theses' ? (
                            <>
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Filter by Programme</h3>
                                    <select name="programme" onChange={handleThesisFilterChange} value={thesisFilters.programme} className="w-full p-2 border rounded bg-white">
                                        <option value="">All Programmes</option>
                                        <option value="Artificial Intelligence">Artificial Intelligence</option>
                                        <option value="Cyber Security">Cyber Security</option>
                                        <option value="Management Information System">MIS</option>
                                    </select>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Filter by Year</h3>
                                    <input name="year" type="number" placeholder="Year" onChange={handleThesisFilterChange} value={thesisFilters.year} className="w-full p-2 border rounded"/>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Filter by Journal</h3>
                                    <input name="journal" type="text" placeholder="Journal Name" onChange={handlePubFilterChange} value={pubFilters.journal} className="w-full p-2 border rounded"/>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Filter by Year</h3>
                                    <input name="year" type="number" placeholder="Year" onChange={handlePubFilterChange} value={pubFilters.year} className="w-full p-2 border rounded"/>
                                </div>
                            </>
                        )}
                    </aside>

                    {/* Results Grid */}
                    <div className="flex-grow">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Recent {activeTab === 'theses' ? 'Theses' : 'Publications'}</h3>

                        {activeTab === 'theses' ? (
                            theses.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded shadow-sm border border-gray-100">
                                    <p className="text-gray-500">No theses found matching your criteria.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {theses.map(thesis => (
                                        <div key={thesis.thesis_id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <Link to={`/thesis/${thesis.thesis_id}`} className="text-xl font-bold text-primary hover:underline mb-2 block">{thesis.title}</Link>
                                                    <p className="text-gray-600 text-sm mb-2 line-clamp-3">{thesis.abstract}</p>
                                                    <Link to={`/thesis/${thesis.thesis_id}`} className="text-xs text-primary font-semibold hover:underline mb-4 block">Read more</Link>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {thesis.keywords && thesis.keywords.map((k, i) => (
                                                            <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{k}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded whitespace-nowrap">{thesis.graduation_year}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-4 mt-2">
                                                <span>By <span className="font-medium text-gray-900">{thesis.author_name}</span></span>
                                                <span>{thesis.degree} {thesis.programme}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            publications.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded shadow-sm border border-gray-100">
                                    <p className="text-gray-500">No publications found matching your criteria.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {publications.map(pub => (
                                        <div key={pub.publication_id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="text-xl font-bold text-primary mb-2 block">{pub.title}</div>
                                                    <p className="text-gray-600 text-sm mb-2">{pub.journal_name} {pub.publication_date ? `(${new Date(pub.publication_date).getFullYear()})` : ''}</p>
                                                    {pub.abstract && <p className="text-gray-600 text-sm mb-4 line-clamp-3">{pub.abstract}</p>}
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {pub.doi && <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded">DOI: {pub.doi}</span>}
                                                        {(pub.pdf_url || pub.external_link) && (
                                                            <a href={pub.external_link || (pub.pdf_url?.startsWith('http') ? pub.pdf_url : `/${pub.pdf_url}`)} target="_blank" rel="noreferrer" className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded hover:underline">Access Publication</a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500 border-t pt-4 mt-2">
                                                <span>Authors: <span className="font-medium text-gray-900">{Array.isArray(pub.authors) ? pub.authors.join(', ') : 'N/A'}</span></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-gray-400 py-8 text-center mt-auto">
                <p>&copy; {new Date().getFullYear()} ACETEL Thesis and Publication Repository System. All rights reserved.</p>
                <p className="mt-2 text-sm font-semibold tracking-wide text-gray-500">
                    <span className="text-gray-400">Powered by: </span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">MaSha Secure Tech</span>
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;
