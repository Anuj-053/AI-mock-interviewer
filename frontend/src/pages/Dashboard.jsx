import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // 1. Handle File Upload
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return alert("Please select a PDF");

        const formData = new FormData();
        formData.append('resume', file); // 'resume' must match the multer config

        try {
            await api.post('/resume/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Resume uploaded successfully!");
        } catch (error) {
            alert("Failed to upload resume");
        }
    };

    // 2. Handle Starting the Interview
    const handleStartInterview = async () => {
        setLoading(true);
        try {
            // This calls our massive RAG pipeline backend route!
            const { data } = await api.post('/interview/start');
            // Navigate to the interview page with the newly created interview ID
            navigate(`/interview/${data._id}`);
        } catch (error) {
            alert(error.response?.data?.message || "Failed to start. Did you upload a resume?");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    return (
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 relative">
            {loading && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-xl">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                    <h3 className="text-xl font-bold text-slate-100">Analyzing your resume...</h3>
                    <p className="text-slate-400 mt-2">Generating personalized interview questions</p>
                </div>
            )}
            
            <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                <h2 className="text-2xl font-bold text-slate-100">Candidate Dashboard</h2>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-medium transition-colors">Logout</button>
            </div>

            <div className="space-y-8">
                {/* Section 0: Revision */}
                <div className="bg-slate-700/50 border border-slate-600 p-6 rounded-xl flex justify-between items-center shadow-inner hover:bg-slate-700/80 transition-colors">
                    <div>
                        <h3 className="text-lg font-bold text-blue-300 drop-shadow-sm">⭐ Revision Dashboard</h3>
                        <p className="text-sm text-slate-300 mt-1">Review the tricky questions you saved from past interviews.</p>
                    </div>
                    <button onClick={() => navigate('/revision')} className="bg-blue-600/20 text-blue-300 border border-blue-500/50 font-bold px-6 py-2 rounded-lg shadow hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all">
                        Review Now
                    </button>
                </div>

                {/* Section 1: Upload */}
                <div className="border border-slate-700 p-6 rounded-xl bg-slate-800/50 shadow-inner">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">1. Upload your Resume (PDF)</h3>
                    <form onSubmit={handleUpload} className="flex gap-4">
                        <input 
                            type="file" accept="application/pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer"
                        />
                        <button type="submit" className="bg-slate-700 text-slate-200 px-6 py-2 rounded-lg border border-slate-600 hover:bg-slate-600 hover:text-white transition-colors font-medium">
                            Upload
                        </button>
                    </form>
                </div>

                {/* Section 2: Start Interview */}
                <div className="border border-slate-700 p-6 rounded-xl bg-slate-800/50 shadow-inner">
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">2. Take the AI Interview</h3>
                    <p className="text-sm text-slate-400 mb-6">
                        We will use RAG (Retrieval-Augmented Generation) to analyze your resume and generate 10 highly technical, personalized questions.
                    </p>
                    <button 
                        onClick={handleStartInterview} 
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] tracking-wide"
                    >
                        {loading ? "Generating Questions..." : "Start Interview"}
                    </button>
                </div>
            </div>
        </div>
    );
}
