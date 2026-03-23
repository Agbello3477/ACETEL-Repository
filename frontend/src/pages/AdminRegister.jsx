import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LogoFlipper from '../components/LogoFlipper';

const AdminRegister = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [staffId, setStaffId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!email.endsWith('@noun.edu.ng')) {
            setError('Email must be a valid @noun.edu.ng address');
            return;
        }
        
        if (!/^\d{5}$/.test(staffId)) {
            setError('Staff ID must be exactly 5 digits');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role: 'centre_admin',
                    staff_id: staffId
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('System error during registration.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
                <div className="flex justify-center mb-4">
                    <LogoFlipper />
                </div>
                <h2 className="text-2xl font-bold text-center text-primary">ATPRS</h2>
                <h3 className="text-lg text-center text-gray-500">Admin Registration</h3>
                
                {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded border border-red-200">{error}</p>}
                {success && <p className="text-green-600 text-sm text-center bg-green-50 p-2 rounded border border-green-200">Registration successful! Redirecting to login...</p>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring focus:ring-primary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">NOUN Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="xyz@noun.edu.ng"
                            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring focus:ring-primary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Staff ID (5 Digits)</label>
                        <input
                            type="text"
                            value={staffId}
                            onChange={(e) => setStaffId(e.target.value)}
                            maxLength="5"
                            placeholder="12345"
                            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring focus:ring-primary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring focus:ring-primary"
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        className="w-full px-4 py-2 font-bold text-white bg-primary rounded hover:bg-green-800 transition disabled:opacity-50"
                        disabled={success}
                    >
                        Register Admin
                    </button>
                </form>
                <div className="text-center text-sm">
                    Already have an account? <Link to="/login" className="text-primary hover:underline font-semibold">Login</Link>
                </div>
            </div>

            {/* Branding Footer */}
            <div className="absolute bottom-4 w-full text-center">
                <p className="text-xs text-gray-500 font-medium tracking-wide">
                    Powered by: <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-blue-600 font-bold">MaSha Secure Tech</span>
                </p>
            </div>
        </div>
    );
};

export default AdminRegister;
