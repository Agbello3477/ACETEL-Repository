import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const EditThesis = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();

    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        keywords: '',
        supervisor: '',
        programme: '',
        year: new Date().getFullYear(),
        status: 'Submitted'
    });
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchThesis = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/theses/my-theses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    // Find the specific thesis since our API returns all currently
                    // Ideally we should have GET /api/theses/:id for student but my-theses works for now
                    const thesis = data.find(t => t.thesis_id === parseInt(id));
                    if (thesis) {
                        if (['Approved', 'Locked'].includes(thesis.status)) {
                            setError("You cannot edit this thesis because it is already Approved or Locked.");
                            setLoading(false);
                            return;
                        }
                        setFormData({
                            title: thesis.title,
                            abstract: thesis.abstract,
                            keywords: Array.isArray(thesis.keywords) ? thesis.keywords.join(', ') : thesis.keywords || '',
                            supervisor: Array.isArray(thesis.supervisors) ? thesis.supervisors.join(', ') : thesis.supervisors,
                            programme: thesis.programme,
                            year: thesis.graduation_year,
                            status: thesis.status
                        });
                    } else {
                        setError("Thesis not found.");
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Failed to fetch thesis details.");
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchThesis();
    }, [user, id]);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        const data = new FormData();
        data.append('title', formData.title);
        data.append('abstract', formData.abstract);
        data.append('keywords', formData.keywords);
        data.append('supervisors', formData.supervisor); // Backend expects 'supervisors' but logic supports parsing string
        data.append('programme', formData.programme);
        data.append('year', formData.year);
        // We do not send status here, usually editing keeps status or stays Draft.
        // But let's say editing a 'Submitted' thesis keeps it 'Submitted' unless we allow revert to Draft?
        // For simplicity, we won't change status via edit form yet, just content.

        if (file) {
            data.append('pdf', file);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/theses/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            if (response.ok) {
                setMessage('Thesis updated successfully!');
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                const result = await response.json();
                setError(result.message || 'Update failed');
            }
        } catch (err) {
            setError('Server error');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    if (error && !formData.title) return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow text-center">
                <h2 className="text-xl text-red-600 mb-4">{error}</h2>
                <button onClick={() => navigate('/dashboard')} className="text-primary hover:underline">Back to Dashboard</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow">
                <h2 className="text-2xl font-bold mb-6 text-primary">Edit Thesis</h2>

                {message && <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">{message}</div>}
                {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Display Only Fields */}
                    <div className="bg-gray-50 p-4 rounded mb-4">
                        <p className="text-sm text-gray-500">Degree & Programme</p>
                        <p className="font-semibold">{user?.degree} {formData.programme}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Thesis Title</label>
                        <input name="title" type="text" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Abstract</label>
                        <textarea name="abstract" rows="4" value={formData.abstract} onChange={handleChange} className="w-full p-2 border rounded" required></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Keywords (comma separated)</label>
                        <input name="keywords" type="text" value={formData.keywords} onChange={handleChange} className="w-full p-2 border rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Supervisor(s) (comma separated)</label>
                        <input name="supervisor" type="text" value={formData.supervisor} onChange={handleChange} className="w-full p-2 border rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Graduation Year</label>
                        <input name="year" type="number" value={formData.year} onChange={handleChange} className="w-full p-2 border rounded" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Replace PDF Document (Optional)</label>
                        <input type="file" accept="application/pdf" onChange={handleFileChange} className="w-full p-2 border rounded" />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing file.</p>
                    </div>

                    <div className="flex justify-end pt-4 space-x-4">
                        <button type="button" onClick={() => navigate('/dashboard')} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-primary text-white rounded hover:bg-blue-800">Update Thesis</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditThesis;
