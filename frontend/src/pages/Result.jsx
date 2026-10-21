import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Result() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savedQuestionIds, setSavedQuestionIds] = useState(new Set());

    const handleSaveQuestion = async (qa, originalQuestion) => {
        try {
            await api.post('/saved-questions', {
                question: originalQuestion.question,
                options: originalQuestion.options,
                correctOption: originalQuestion.correctOption,
                explanation: originalQuestion.explanation
            });
            // Mark as saved in local state
            setSavedQuestionIds(prev => new Set(prev).add(qa.question));
        } catch (error) {
            console.error(error);
            alert("Failed to save question. It might already be saved!");
        }
    };

    useEffect(() => {
        const fetchInterview = async () => {
            try {
                const res = await api.get(`/interview/${id}`);
                setInterview(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInterview();
    }, [id]);

    if (loading) {
        return <div className="text-center mt-10 text-xl font-semibold">Loading results...</div>;
    }

    if (!interview) {
        return <div className="text-center mt-10 text-xl font-semibold text-red-500">Failed to load results</div>;
    }

    return (
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">Interview Results</h2>
                <div className="text-2xl font-bold bg-slate-900 px-6 py-2 rounded-lg border border-slate-700 shadow-inner">
                    Score: <span className={interview.overallScore >= 60 ? 'text-emerald-400' : 'text-red-400'}>{Math.round(interview.overallScore)}%</span>
                </div>
            </div>

            <div className="mb-6 px-4">
                {(() => {
                    const score = Math.round(interview.overallScore);
                    let message = "";
                    let bannerClass = "";

                    if (score >= 90) {
                        message = "Outstanding! You have a deep mastery of these technical topics. You are definitely interview ready!";
                        bannerClass = "bg-emerald-900/40 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                    } else if (score >= 80) {
                        message = "Great job! You have a solid grasp of these technologies. You are interview ready!";
                        bannerClass = "bg-green-900/40 text-green-300 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                    } else if (score >= 70) {
                        message = "Good effort, but you missed a few technical details. You should brush up on a few topics before the real interview.";
                        bannerClass = "bg-yellow-900/40 text-yellow-300 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]";
                    } else if (score >= 60) {
                        message = "Fair performance. You have basic knowledge, but you need to study these technologies a little more.";
                        bannerClass = "bg-orange-900/40 text-orange-300 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]";
                    } else if (score >= 50) {
                        message = "Below average. You should study these core concepts significantly more.";
                        bannerClass = "bg-red-900/40 text-red-300 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
                    } else {
                        message = "Needs improvement. We strongly recommend deep diving into these technical skills before interviewing.";
                        bannerClass = "bg-rose-900/40 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.1)]";
                    }

                    return (
                        <div className={`p-5 rounded-xl font-semibold text-lg border ${bannerClass}`}>
                            {message}
                        </div>
                    );
                })()}
            </div>

            <div className="text-left space-y-6 bg-slate-900/50 p-6 rounded-xl border border-slate-700 mb-8 max-h-[500px] overflow-y-auto shadow-inner">
                <h3 className="text-xl font-bold mb-4 text-slate-200">Detailed Feedback</h3>
                
                {interview.qaList.map((qa, index) => {
                    const originalQuestion = interview.questions.find(q => q.question === qa.question);
                    const selectedText = originalQuestion ? originalQuestion.options[qa.selectedOption] : "Unknown";
                    const correctText = originalQuestion ? originalQuestion.options[originalQuestion.correctOption] : "Unknown";
                    const explanationText = originalQuestion ? originalQuestion.explanation : null;

                    const isSaved = savedQuestionIds.has(qa.question);

                    return (
                        <div key={index} className={`p-5 rounded-xl border relative ${qa.isCorrect ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-rose-500/30 bg-rose-900/10'}`}>
                            <button 
                                onClick={() => handleSaveQuestion(qa, originalQuestion)}
                                disabled={isSaved}
                                className={`absolute top-4 right-4 px-3 py-1 rounded border text-sm font-semibold transition-all ${
                                    isSaved 
                                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 cursor-not-allowed' 
                                        : 'bg-slate-800 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/20'
                                }`}
                                title="Save this question for revision"
                            >
                                {isSaved ? '★ Saved' : '☆ Save'}
                            </button>
                            
                            <p className="font-semibold text-slate-200 mb-3 pr-24 text-lg">{index + 1}. {qa.question}</p>
                            <p className="text-sm mb-1">
                                <span className="font-medium text-slate-400">Your Answer: </span> 
                                <span className={qa.isCorrect ? 'text-emerald-400' : 'text-rose-400'}>{selectedText}</span>
                            </p>
                            {!qa.isCorrect && (
                                <p className="text-sm mb-3">
                                    <span className="font-medium text-slate-400">Correct Answer: </span> 
                                    <span className="text-emerald-400">{correctText}</span>
                                </p>
                            )}
                            
                            {/* Always show explanation if available */}
                            {explanationText && (
                                <div className="mt-4 p-4 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-300">
                                    <span className="font-bold text-blue-400">Explanation:</span> {explanationText}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-center">
                <button 
                    onClick={() => navigate('/')}
                    className="bg-slate-700 text-slate-200 px-8 py-3 rounded-xl border border-slate-600 hover:bg-slate-600 font-bold transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}
