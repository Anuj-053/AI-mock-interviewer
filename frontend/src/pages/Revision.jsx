import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Revision() {
    const [savedQuestions, setSavedQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    useEffect(() => {
        fetchSavedQuestions();
    }, []);

    const fetchSavedQuestions = async () => {
        try {
            const res = await api.get('/saved-questions');
            setSavedQuestions(res.data);
        } catch (error) {
            console.error("Failed to load saved questions");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id) => {
        try {
            await api.delete(`/saved-questions/${id}`);
            setSavedQuestions(savedQuestions.filter(q => q._id !== id));
        } catch (error) {
            console.error("Failed to delete question");
            alert("Failed to remove question.");
        }
    };

    if (loading) {
        return <div className="text-center mt-10 text-xl font-semibold text-slate-300">Loading revision data...</div>;
    }

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = savedQuestions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(savedQuestions.length / itemsPerPage);

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    return (
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">⭐ Revision Dashboard</h2>
                <Link to="/" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Back to Home</Link>
            </div>

            {savedQuestions.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/50 rounded-xl border border-slate-700">
                    <p className="text-2xl text-slate-300 font-bold mb-2">You haven't saved any questions yet.</p>
                    <p className="text-slate-400">Take an interview and save tricky questions to review them here!</p>
                </div>
            ) : (
                <>
                    <div className="space-y-6">
                        {currentItems.map((q, idx) => (
                            <div key={q._id} className="border border-slate-700 rounded-xl p-6 relative bg-slate-900/50 shadow-inner">
                                <button 
                                    onClick={() => handleRemove(q._id)}
                                    className="absolute top-4 right-4 text-rose-400 hover:text-white hover:bg-rose-500/80 px-3 py-1 rounded transition-colors text-sm font-semibold border border-rose-500/30"
                                >
                                    Remove
                                </button>
                                
                                <h3 className="text-lg font-bold text-slate-200 mb-5 pr-20">{indexOfFirstItem + idx + 1}. {q.question}</h3>
                                
                                <div className="space-y-3 mb-4">
                                    {q.options.map((opt, i) => (
                                        <div key={i} className={`p-4 rounded-lg border ${i === q.correctOption ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-100 font-medium shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-slate-800/80 border-slate-700 text-slate-300'}`}>
                                            <span className="mr-3 font-bold text-slate-400">{String.fromCharCode(65 + i)}.</span> {opt}
                                            {i === q.correctOption && <span className="ml-3 text-emerald-400 text-sm font-bold tracking-wide">✓ Correct Answer</span>}
                                        </div>
                                    ))}
                                </div>

                                {q.explanation && (
                                    <div className="mt-5 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                        <h4 className="font-bold text-blue-400 mb-2 tracking-wide uppercase text-xs">Explanation</h4>
                                        <p className="text-blue-100 text-sm leading-relaxed">{q.explanation}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-700">
                            <button 
                                onClick={handlePrev} 
                                disabled={currentPage === 1}
                                className="px-6 py-2 rounded-lg bg-slate-700 text-slate-200 font-semibold hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-slate-400 font-medium">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button 
                                onClick={handleNext} 
                                disabled={currentPage === totalPages}
                                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
