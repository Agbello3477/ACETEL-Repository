import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminSubmitThesis = () => {
    const navigate = useNavigate();
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
        student_name: '', // New field
        matric_number: '',
        status: 'Approved'
    });
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const data = new FormData();
        // Combine supervisors
        const supervisors = [formData.supervisor1, formData.supervisor2, formData.degree === 'PhD' ? formData.supervisor3 : null]
            .filter(s => s && s.trim() !== '')
            .join(', ');

        data.append('title', formData.title);
        data.append('abstract', formData.abstract);
        data.append('keywords', formData.keywords);
        data.append('supervisors', supervisors); // backend expects 'supervisors'
        data.append('degree', formData.degree);
        data.append('programme', formData.programme);
        data.append('year', formData.year);
        data.append('student_name', formData.student_name); // New field
        data.append('matric_number', formData.matric_number);
        data.append('status', formData.status);
        if (file) {
            data.append('pdf', file);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/theses', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            const result = await response.json();

            if (response.ok) {
                setMessage('Legacy thesis uploaded successfully!');
                setTimeout(() => navigate('/admin-dashboard'), 2000);
            } else {
                setError(result.message || 'Upload failed');
            }
        } catch (err) {
            setError('Server error');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded shadow">
                <nav className="mb-6">
                    <button onClick={() => navigate('/admin-dashboard')} className="text-primary hover:underline">&larr; Back to Dashboard</button>
                </nav>
                <h2 className="text-2xl font-bold mb-6 text-primary">Upload Legacy Thesis</h2>
                <p className="text-gray-600 mb-6">Upload a thesis on behalf of a student. Ensure the student account exists (via Matric No).</p>

                {message && <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">{message}</div>}
                {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Student Name</label>
                            <input name="student_name" type="text" placeholder="Full Name" onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Student Matric No</label>
                            <input name="matric_number" type="text" placeholder="e.g. NOUN/24/1234" onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Thesis Title</label>
                        <input name="title" type="text" onChange={handleChange} className="w-full p-2 border rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Abstract</label>
                        <textarea name="abstract" rows="4" onChange={handleChange} className="w-full p-2 border rounded" required></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Keywords (comma separated)</label>
                        <input name="keywords" type="text" onChange={handleChange} className="w-full p-2 border rounded" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Degree Type</label>
                            <select name="degree" value={formData.degree} onChange={handleChange} className="w-full p-2 border rounded">
                                <option value="MSc">MSc (Master of Science)</option>
                                <option value="PhD">PhD (Doctor of Philosophy)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Programme</label>
                            <select name="programme" onChange={handleChange} className="w-full p-2 border rounded">
                                <option value="Artificial Intelligence">Artificial Intelligence</option>
                                <option value="Cyber Security">Cyber Security</option>
                                <option value="Management Information System">Management Information System</option>
                            </select>
                        </div>
                    </div>

                    {/* Supervisors based on Degree */}
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded border">
                        <div className="col-span-3 text-sm font-medium text-gray-700 mb-2">Supervisors</div>
                        <div>
                            <label className="block text-xs text-gray-500">Supervisor 1</label>
                            <input name="supervisor1" type="text" onChange={handleChange} className="w-full p-2 border rounded" required placeholder="Name" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">Supervisor 2</label>
                            <input name="supervisor2" type="text" onChange={handleChange} className="w-full p-2 border rounded" required placeholder="Name" />
                        </div>
                        {formData.degree === 'PhD' && (
                            <div>
                                <label className="block text-xs text-gray-500">Supervisor 3</label>
                                <input name="supervisor3" type="text" onChange={handleChange} className="w-full p-2 border rounded" required placeholder="Name" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Graduation Year</label>
                            <input name="year" type="number" value={formData.year} onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded">
                                <option value="Approved">Approved (Published)</option>
                                <option value="Submitted">Submitted (Pending Review)</option>
                                <option value="Locked">Locked (Archived)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Upload PDF Document</label>
                        <input type="file" accept="application/pdf" onChange={handleFileChange} className="w-full p-2 border rounded" required />
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={() => navigate('/admin-dashboard')} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-primary text-white rounded hover:bg-blue-800">Upload Thesis</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminSubmitThesis;
