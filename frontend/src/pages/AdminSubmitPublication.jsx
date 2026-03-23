import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminSubmitPublication = () => {
    const [title, setTitle] = useState('');
    const [abstract, setAbstract] = useState('');
    const [authors, setAuthors] = useState(''); // Comma separated for simplicity in v1
    const [journalName, setJournalName] = useState('');
    const [doi, setDoi] = useState('');
    const [volume, setVolume] = useState('');
    const [issue, setIssue] = useState('');
    const [pages, setPages] = useState('');
    const [publicationDate, setPublicationDate] = useState('');
    const [keywords, setKeywords] = useState('');
    const [externalLink, setExternalLink] = useState('');
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!title || !journalName) {
            setError('Title and Journal Name are required fields.');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('abstract', abstract);
        formData.append('authors', authors);
        formData.append('journal_name', journalName);
        formData.append('doi', doi);
        formData.append('volume', volume);
        formData.append('issue', issue);
        formData.append('pages', pages);
        formData.append('publication_date', publicationDate);
        formData.append('keywords', keywords);
        formData.append('external_link', externalLink);
        
        if (file) {
            formData.append('pdf', file);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/publications', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess('Publication successfully submitted to ATPRS!');
                setTimeout(() => navigate('/admin-dashboard'), 2000);
            } else {
                setError(data.message || 'Submission failed.');
            }
        } catch (err) {
            console.error('Publication Submit Error:', err);
            setError('System error submitting publication.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
            <h1 className="text-2xl font-bold mb-6 text-primary border-b pb-2">Upload Publication Legacy/Record</h1>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary focus:outline-none"
                            placeholder="Full Publication Title"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Abstract *</label>
                    <textarea
                        value={abstract}
                        onChange={(e) => setAbstract(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md h-32 focus:ring focus:ring-primary focus:outline-none"
                        placeholder="Abstract or Summary..."
                        required
                    ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Authors *</label>
                        <input
                            type="text"
                            value={authors}
                            onChange={(e) => setAuthors(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary focus:outline-none"
                            placeholder="John Doe, Aliyu Musa"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Comma separated</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Journal / Conference Name *</label>
                        <input
                            type="text"
                            value={journalName}
                            onChange={(e) => setJournalName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary focus:outline-none"
                            placeholder="e.g. Journal of AI Research"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DOI *</label>
                        <input
                            type="text"
                            value={doi}
                            onChange={(e) => setDoi(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary focus:outline-none"
                            placeholder="10.1000/xyz123"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Publication Date *</label>
                        <input
                            type="date"
                            value={publicationDate}
                            onChange={(e) => setPublicationDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Volume *</label>
                        <input
                            type="text"
                            value={volume}
                            onChange={(e) => setVolume(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary focus:outline-none"
                            placeholder="e.g. 12"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Issue *</label>
                        <input
                            type="text"
                            value={issue}
                            onChange={(e) => setIssue(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary focus:outline-none"
                            placeholder="e.g. 4"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pages *</label>
                        <input
                            type="text"
                            value={pages}
                            onChange={(e) => setPages(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary focus:outline-none"
                            placeholder="e.g. 120-135"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keywords *</label>
                    <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary focus:outline-none"
                        placeholder="Machine Learning, Ethics, Data (Comma separated)"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">External Link *</label>
                        <input
                            type="url"
                            value={externalLink}
                            onChange={(e) => setExternalLink(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary focus:outline-none"
                            placeholder="https://doi.org/..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload PDF Document *</label>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary focus:outline-none"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Required (Max 10MB)</p>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/admin-dashboard')}
                        className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-primary text-white rounded-md hover:bg-green-800 transition"
                    >
                        Upload Publication
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminSubmitPublication;
