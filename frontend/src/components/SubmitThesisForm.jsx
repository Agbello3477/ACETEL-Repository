import { useState } from 'react';

const SubmitThesisForm = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        keywords: '',
        degree: 'MSc',
        supervisor1: '',
        supervisor2: '',
        supervisor3: '',
        programme: 'Artificial Intelligence',
        year: new Date().getFullYear(),
        student_name: '',
        matric_number: '',
        status: 'Approved'
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
        // Combine supervisors for the backend
        const supervisors = [formData.supervisor1, formData.supervisor2, formData.degree === 'PhD' ? formData.supervisor3 : null]
            .filter(s => s && s.trim() !== '')
            .join(', ');

        data.append('title', formData.title);
        data.append('abstract', formData.abstract);
        data.append('keywords', formData.keywords);
        data.append('supervisors', supervisors);
        data.append('degree', formData.degree);
        data.append('programme', formData.programme);
        data.append('year', formData.year);
        data.append('student_name', formData.student_name);
        data.append('matric_number', formData.matric_number);
        data.append('status', formData.status);
        if (file) {
            data.append('pdf', file);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/theses', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            const result = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Thesis uploaded successfully! Refreshing dashboard...' });
                setTimeout(() => onComplete(), 2000);
            } else {
                setMessage({ type: 'error', text: result.message || 'Upload failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Server connection error. Please try again.' });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 sm:p-10 mb-10 overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-8">
                    <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-200">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v8" /></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Upload Center</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Submit Legacy Research Record</p>
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
                    {/* Researcher Section */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center">
                            <span className="w-6 h-px bg-emerald-200 mr-3"></span>
                            Researcher Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                <input name="student_name" type="text" placeholder="e.g. John Doe" onChange={handleChange} required 
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all outline-none" />
                            </div>
                            <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Matriculation Number</label>
                                <input name="matric_number" type="text" placeholder="e.g. NOUN/24/1234" onChange={handleChange} required 
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center">
                            <span className="w-6 h-px bg-emerald-200 mr-3"></span>
                            Thesis Metadata
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Thesis Title</label>
                                <input name="title" type="text" placeholder="Enter complete title as it appears on cover" onChange={handleChange} required 
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Abstract Highlights</label>
                                <textarea name="abstract" rows="5" placeholder="Summary of research methodology and findings..." onChange={handleChange} required 
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium leading-relaxed text-slate-600 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all outline-none resize-none"></textarea>
                            </div>
                            <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Keywords (Comma Separated)</label>
                                <input name="keywords" type="text" placeholder="e.g. Artificial Intelligence, Blockchain, Education" onChange={handleChange} required 
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all outline-none" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Academic Programme</label>
                                    <select name="programme" onChange={handleChange} 
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all outline-none appearance-none cursor-pointer">
                                        <option value="Artificial Intelligence">Artificial Intelligence</option>
                                        <option value="Cyber Security">Cyber Security</option>
                                        <option value="Management Information System">Management Information System</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Degree Type</label>
                                    <select name="degree" value={formData.degree} onChange={handleChange} 
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all outline-none appearance-none cursor-pointer">
                                        <option value="MSc">MSc (Master of Science)</option>
                                        <option value="PhD">PhD (Doctor of Philosophy)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Supervisors Section */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center">
                            <span className="w-6 h-px bg-emerald-200 mr-3"></span>
                            Supervisory Team
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-dashed border-slate-200">
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supervisor 1</label>
                                <input name="supervisor1" type="text" placeholder="Full Name" onChange={handleChange} required 
                                    className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 outline-none shadow-sm transition-all" />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supervisor 2</label>
                                <input name="supervisor2" type="text" placeholder="Full Name" onChange={handleChange} required 
                                    className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 outline-none shadow-sm transition-all" />
                             </div>
                             {formData.degree === 'PhD' && (
                                <div className="space-y-1.5 animate-in slide-in-from-right-4 duration-300">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supervisor 3</label>
                                    <input name="supervisor3" type="text" placeholder="Full Name" onChange={handleChange} required 
                                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 outline-none shadow-sm transition-all" />
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Final Details Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Graduation Year</label>
                                <input name="year" type="number" value={formData.year} onChange={handleChange} required 
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all outline-none" />
                            </div>
                            <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} 
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all outline-none appearance-none cursor-pointer">
                                    <option value="Approved">Published</option>
                                    <option value="Submitted">Pending</option>
                                    <option value="Locked">Locked</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                             <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Document Attachment</label>
                                <span className="text-[10px] font-bold text-slate-400">PDF ONLY (MAX 10MB)</span>
                             </div>
                             <div className="relative group">
                                 <input type="file" accept="application/pdf" onChange={handleFileChange} required 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                                 <div className={`w-full border-2 border-dashed rounded-2xl p-4 flex items-center justify-center space-x-3 transition-all ${file ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-emerald-300 group-hover:bg-emerald-50/50'}`}>
                                    {file ? (
                                        <>
                                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span className="text-sm font-black truncate max-w-[200px]">{file.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2-8H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9l-5-5z" /></svg>
                                            <span className="text-sm font-bold italic tracking-tight uppercase">Drop PDF or click to select</span>
                                        </>
                                    )}
                                 </div>
                             </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-2 text-slate-400">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             <p className="text-[10px] font-bold max-w-[300px] leading-tight uppercase tracking-tight italic">By uploading, you certify that this research is an official ACETEL record and all student information is accurate.</p>
                        </div>
                        <button type="submit" disabled={loading}
                             className={`group relative overflow-hidden px-10 py-4 rounded-2xl font-black text-white text-sm tracking-widest uppercase transition-all shadow-2xl ${
                                loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 shadow-emerald-200/50 hover:bg-emerald-700 hover:-translate-y-1 active:scale-95'
                             }`}>
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Syncing...</span>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <span>Finalize Submission</span>
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

export default SubmitThesisForm;
