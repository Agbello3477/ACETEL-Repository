import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import LogoFlipper from '../components/LogoFlipper';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secretCode, setSecretCode] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const location = useLocation();

    // Check if we have a saved location from before redirect
    const from = location.state?.from?.pathname;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (secretCode !== 'ACE2019') {
            setError("Security Error: Invalid Secret Code. Access Denied.");
            return;
        }

        console.log("Login Form Submitted", { email });
        try {
            const result = await login(email, password);
            console.log("Login Result:", result);
            if (result.success) {
                // Respect the saved location if it exists
                if (from) {
                    navigate(from, { replace: true });
                } else {
                    console.log("Login User Role:", result.data.role); // Debug
                    if (result.data.role === 'Centre Admin' || result.data.role === 'Super Admin') {
                        console.log("Redirecting to Admin Dashboard");
                        navigate('/admin-dashboard');
                    } else {
                        console.log("Redirecting to Student Dashboard");
                        navigate('/dashboard');
                    }
                }
            } else {
                setError(result.message);
            }
        } catch (err) {
            console.error("Login HandleSubmit Error:", err);
            setError("Unexpected error during login.");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
                <div className="flex justify-center mb-4">
                    <LogoFlipper />
                </div>
                <h2 className="text-2xl font-bold text-center text-primary">ACETEL Thesis and Publication Repository System</h2>
                <h3 className="text-lg text-center text-gray-500">Login</h3>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Secret Code</label>
                        <input
                            type="password"
                            value={secretCode}
                            onChange={(e) => setSecretCode(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring focus:ring-primary"
                            placeholder="Enter Security Code"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 font-bold text-white bg-primary rounded hover:bg-green-800 transition"
                    >
                        Login
                    </button>
                </form>
                <div className="text-center text-sm">
                    New Administrator? <Link to="/admin-register" className="text-primary hover:underline font-semibold">Register Here</Link>
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

export default Login;
