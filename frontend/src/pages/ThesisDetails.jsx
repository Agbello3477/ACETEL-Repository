import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const ThesisDetails = () => {
    const { id } = useParams();
    const [thesis, setThesis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Anti-Piracy DRM Hooks
    useEffect(() => {
        const handleContextMenu = (e) => {
            e.preventDefault();
        };

        const handleKeyDown = (e) => {
            // Block Ctrl+P (Print), Ctrl+S (Save), Cmd+P, Cmd+S
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
                    setError('Thesis not found or restricted.');
                }
            } catch (err) {
                setError('Failed to load thesis.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchThesis();
    }, [id]);

    if (loading) return <div className="p-10 text-center">Loading thesis details...</div>;
    if (error) return (
        <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
            <Link to="/" className="text-primary hover:underline">&larr; Back to Repository</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold text-primary">ACETEL TPRS</Link>
                    <Link to="/" className="text-gray-600 hover:text-primary">Back to Search</Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-grow">
                <div className="bg-white rounded shadow-sm p-8 mb-8">
                    <div className="mb-6">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">{thesis.degree} {thesis.programme}</span>
                        <span className="ml-2 text-gray-500 text-sm">{thesis.graduation_year}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{thesis.title}</h1>
                    <div className="text-gray-600 mb-8">
                        By <span className="font-semibold text-gray-900">{thesis.author_name}</span> | Supervised by {thesis.supervisor_name}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Metadata */}
                        <div className="lg:col-span-1 space-y-6">
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">Abstract</h3>
                                <div className="text-gray-700 leading-relaxed text-sm bg-gray-50 p-4 rounded border border-gray-100" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                                    {thesis.abstract}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">Keywords</h3>
                                <div className="flex flex-wrap gap-2">
                                    {thesis.keywords && thesis.keywords.map((k, i) => (
                                        <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{k}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: PDF Viewer */}
                        <div className="lg:col-span-2">
                            <h3 className="font-bold text-gray-900 mb-4">Document Preview</h3>
                            {thesis.pdf_url ? (
                                <div className="border rounded h-[800px] bg-gray-100">
                                    <iframe
                                        src={`/${thesis.pdf_url}#toolbar=0`}
                                        className="w-full h-full rounded"
                                        title="PDF Preview"
                                    >
                                        <p>Your browser does not support PDFs. <a href={`/${thesis.pdf_url}`}>Download the PDF</a>.</p>
                                    </iframe>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center bg-gray-100 rounded text-gray-500">
                                    No PDF Document Available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ThesisDetails;
