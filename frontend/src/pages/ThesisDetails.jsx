import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const ThesisDetails = () => {
    const { id } = useParams();
    const [thesis, setThesis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Anti-Piracy DRM Hooks
    useEffect(() => {
        const handleContextMenu = (e) => e.preventDefault();
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                alert("Printing and downloading are disabled to protect the author's intellectual property.");
            }
        };
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        const fetchThesis = async () => {
            try {
                const response = await fetch(`/api/theses/public/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setThesis(data);
                } else {
                    setError('Thesis not found or restricted. Please ensure it is marked as "Approved".');
                }
            } catch (err) {
                setError('Failed to load thesis from server.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchThesis();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-bold animate-pulse">Initializing Document Viewer...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#f8fafc] p-10 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mb-6 border border-rose-100 shadow-xl shadow-rose-100/50">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Access Restricted</h2>
            <p className="text-slate-500 max-w-md mb-8 leading-relaxed">{error}</p>
            <Link to="/" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center group">
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Return to Repository
            </Link>
        </div>
    );

    return (
        <div className="h-screen bg-slate-900 flex flex-col lg:flex-row overflow-hidden font-sans">
            {/* Left Sidebar: Metadata & Abstract */}
            <aside className="w-full lg:w-[400px] xl:w-[450px] h-full bg-white border-r border-slate-200 flex flex-col shadow-2xl relative z-20">
                {/* Header Section */}
                <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-50 to-white border-b border-slate-100">
                    <Link to="/" className="inline-flex items-center text-xs font-black text-indigo-600 uppercase tracking-widest mb-6 hover:text-indigo-700 transition-colors group">
                        <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Search
                    </Link>
                    
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                             <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">{thesis.degree}</span>
                             <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">{thesis.programme}</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 leading-tight">{thesis.title}</h1>
                        <div className="flex items-center space-x-3 text-sm pt-2">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-lg">
                                {thesis.author_name?.charAt(0)}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Researcher</p>
                                <p className="font-bold text-slate-800">{thesis.author_name}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section (Scrollable) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-10">
                    {/* Abstract */}
                    <section>
                         <h3 className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" /></svg>
                            Abstract
                         </h3>
                         <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 relative group overflow-hidden">
                             <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-100 rounded-bl-full opacity-30 group-hover:scale-110 transition-transform"></div>
                             <p className="text-sm text-slate-600 leading-[1.8] font-medium selection:bg-indigo-100 selection:text-indigo-800">
                                {thesis.abstract}
                             </p>
                         </div>
                    </section>

                    {/* Supervisors */}
                    <section>
                         <h3 className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Supervisory Team
                         </h3>
                         <div className="grid grid-cols-1 gap-3">
                             {Array.isArray(thesis.supervisors) ? (
                                thesis.supervisors.map((s, i) => (
                                    <div key={i} className="flex items-center space-x-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                                            {s.charAt(0)}
                                        </div>
                                        <span className="text-xs font-black text-slate-700">{s}</span>
                                    </div>
                                ))
                             ) : (
                                <div className="text-sm text-slate-600 font-bold bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    {thesis.supervisors || 'Not assigned'}
                                </div>
                             )}
                         </div>
                    </section>

                    {/* Meta Footer */}
                    <section className="pt-6 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Graduation</p>
                                <p className="text-xs font-black text-slate-700">{thesis.graduation_year}</p>
                            </div>
                            {thesis.keywords && (
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Key Indices</p>
                                    <div className="flex flex-wrap gap-1">
                                        {thesis.keywords.slice(0, 3).map((k, i) => (
                                            <span key={i} className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{k}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </aside>

            {/* Right Side: PDF Viewer */}
            <main className="flex-1 bg-slate-800 relative flex flex-col">
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500 rounded-full blur-[100px]"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-[100px]"></div>
                </div>

                <div className="relative z-10 flex-1 flex flex-col">
                    {/* Viewer Header */}
                    <div className="h-14 bg-slate-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6">
                        <div className="flex items-center space-x-2">
                             <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                             <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Official Document Preview</span>
                        </div>
                        <div className="flex items-center space-x-4">
                             <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">PROTECTED VIEW</div>
                        </div>
                    </div>

                    {/* Iframe Viewport */}
                    <div className="flex-1 bg-slate-700 shadow-inner relative group overflow-hidden">
                        {thesis.pdf_url ? (
                            <>
                                {/* Overlay to block context menu in some browsers */}
                                <div className="absolute inset-0 z-10 pointer-events-none"></div> 
                                <iframe
                                    src={`/${thesis.pdf_url}#toolbar=0&navpanes=0&scrollbar=1`}
                                    className="w-full h-full border-none"
                                    title="Thesis Document Viewer"
                                    onContextMenu={(e) => e.preventDefault()}
                                >
                                    <p className="text-white p-10 text-center">Your browser does not support embedded PDFs. Please view in a compatible browser.</p>
                                </iframe>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-10">
                                <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center mb-6 text-white/20">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">Document Unavailable</h4>
                                <p className="text-white/40 max-w-xs text-sm">This research record currently does not have a linked PDF document for preview.</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Injected Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ThesisDetails;
