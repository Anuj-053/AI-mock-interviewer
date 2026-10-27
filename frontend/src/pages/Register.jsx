import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/');
        } catch (error) {
            const serverMsg = error.response?.data?.message;
            if (serverMsg) {
                setError(serverMsg);
            } else if (error.code === 'ERR_NETWORK' || !error.response) {
                setError('Cannot reach backend server. Please verify backend is running and VITE_API_BASE_URL is set.');
            } else {
                setError(error.message || 'Registration failed');
            }
        }
    };

    return (
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md mx-auto mt-20">
            <h2 className="text-3xl font-extrabold text-slate-100 mb-8 text-center tracking-tight">Create Account</h2>
            {error && <div className="bg-rose-900/30 text-rose-400 p-3 rounded-lg border border-rose-500/50 mb-6 text-sm text-center">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
                    <input 
                        type="text" 
                        required
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="John Doe"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
                    <input 
                        type="email" 
                        required
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
                    <input 
                        type="password" 
                        required
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-500 transition-all shadow-lg hover:shadow-blue-500/25">
                    Sign Up
                </button>
            </form>

            <p className="mt-8 text-center text-slate-400">
                Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Sign in</Link>
            </p>
        </div>
    );
}
