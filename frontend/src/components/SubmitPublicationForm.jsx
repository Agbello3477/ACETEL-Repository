import { useState } from 'react';

const SubmitPublicationForm = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        authors: '',
        journal_name: '',
        doi: '',
        volume: '',
        issue: '',
        pages: '',
        publication_date: new Date().toISOString().split('T')[0],
        keywords: '',
        external_link: ''
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const data = new FormData();
        // Authors as array
        const authorsArray = formData.authors.split(',').map(a => a.trim()).filter(Boolean);

        data.append('title', formData.title);
        data.append('abstract', formData.abstract);
        data.append('authors', JSON.stringify(authorsArray));
        data.append('journal_name', formData.journal_name);
        data.append('doi', formData.doi);
        data.append('volume', formData.volume);
        data.append('issue', formData.issue);
        data.append('pages', formData.pages);
        data.append('publication_date', formData.publication_date);
        data.append('keywords', formData.keywords);
        data.append('external_link', formData.external_link);
        
        if (file) {
            data.append('pdf', file);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/publications', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            const result = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Publication record created successfully!' });
                setTimeout(() => onComplete(), 2000);
            } else {
                setMessage({ type: 'error', text: result.message || 'Submission failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Server connection error.' });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 sm:p-10 mb-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-8">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14" /></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Publish Center</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Submit Academic Journal / Article</p>
                    </div>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-2xl mb-8 flex items-center space-x-3 border animate-in fade-in zoom-in duration-300 ${
                        message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                    }`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} text-white shadow-lg`}>
                            {message.type === 'success' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </div>
                        <span className="font-bold text-sm tracking-tight">{message.text}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center">
                            <span className="w-6 h-px bg-indigo-200 mr-3"></span>
                            Reference Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Publication Title</label>
                                <input name="title" type="text" placeholder="The title of the paper or article" onChange={handleChange} required 
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Authors (Comma Separated)</label>
                                <input name="authors" type="text" placeholder="Dr. Adamu, Prof. Musa, etc." onChange={handleChange} required 
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Journal / Conference Name</label>
                                <input name="journal_name" type="text" placeholder="e.g. IEEE Access" onChange={handleChange} required 
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center">
                            <span className="w-6 h-px bg-indigo-200 mr-3"></span>
                            Content & Identifiers
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Abstract Highlights</label>
                                <textarea name="abstract" rows="4" placeholder="Brief summary of the publication..." onChange={handleChange} required 
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium leading-relaxed text-slate-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none"></textarea>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">DOI / URL</label>
                                    <input name="doi" type="text" placeholder="e.g. 10.1109/..." onChange={handleChange} 
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Volume</label>
                                    <input name="volume" type="text" onChange={handleChange} 
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Issue</label>
                                    <input name="issue" type="text" onChange={handleChange} 
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pages</label>
                                    <input name="pages" type="text" placeholder="e.g. 120-145" onChange={handleChange} 
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                        <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Publication Date</label>
                            <input name="publication_date" type="date" value={formData.publication_date} onChange={handleChange} required 
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none" />
                        </div>
                        
                        <div className="space-y-2">
                             <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Document Attachment</label>
                                <span className="text-[10px] font-bold text-slate-400">PDF ONLY</span>
                             </div>
                             <div className="relative group">
                                 <input type="file" accept="application/pdf" onChange={handleFileChange} required 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                                 <div className={`w-full border-2 border-dashed rounded-2xl p-4 flex items-center justify-center space-x-3 transition-all ${file ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-indigo-300 group-hover:bg-indigo-50/50'}`}>
                                    {file ? (
                                        <>
                                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span className="text-sm font-black truncate max-w-[200px]">{file.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2-8H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9l-5-5z" /></svg>
                                            <span className="text-sm font-bold italic tracking-tight uppercase">Upload Full text PDF</span>
                                        </>
                                    )}
                                 </div>
                             </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-2 text-slate-400">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             <p className="text-[10px] font-bold max-w-[300px] uppercase tracking-tight italic">By publishing, you confirm this record adheres to scholarly plagiarism standards.</p>
                        </div>
                        <button type="submit" disabled={loading}
                             className={`group relative overflow-hidden px-10 py-4 rounded-2xl font-black text-white text-sm tracking-widest uppercase transition-all shadow-2xl ${
                                loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 shadow-indigo-200/50 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95'
                             }`}>
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Syncing...</span>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <span>Publish Article</span>
                                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubmitPublicationForm;
