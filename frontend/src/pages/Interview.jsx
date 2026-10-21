import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Interview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);

    // Fetch the interview data when the page loads
    useEffect(() => {
        const fetchInterview = async () => {
            try {
                const res = await api.get(`/interview/${id}`);
                setQuestions(res.data.questions);
            } catch (err) {
                console.error("Failed to load interview", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInterview();
    }, [id]);

    const handleSubmitAnswer = async () => {
        if (selectedOption === null) return;
        
        setEvaluating(true);
        try {
            await api.post(`/interview/${id}/evaluate`, {
                questionIndex: currentIndex,
                selectedOption: selectedOption
            });

            if (currentIndex < questions.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setSelectedOption(null);
                setAnswer('');
            } else {
                // Finish interview
                await api.post(`/interview/${id}/finish`);
                navigate(`/result/${id}`);
            }
        } catch (error) {
            alert("Failed to submit answer");
        } finally {
            setEvaluating(false);
        }
    };

    if (loading) {
        return <div className="text-center mt-10 text-xl font-semibold">Loading questions...</div>;
    }

    if (!questions || questions.length === 0) {
        return <div className="text-center mt-10 text-xl font-semibold">No questions found!</div>;
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-300">Question {currentIndex + 1} of {questions.length}</h2>
                <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold border border-blue-700/50">Technical Mock</span>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-700 p-6 rounded-xl mb-8 shadow-inner">
                <p className="text-xl font-medium text-slate-100 leading-relaxed">{currentQuestion.question}</p>
            </div>

            <div className="space-y-4 mb-8">
                {currentQuestion.options.map((option, idx) => (
                    <label 
                        key={idx} 
                        className={`flex items-center p-5 border rounded-xl cursor-pointer transition-all ${
                            selectedOption === idx 
                                ? 'border-blue-500 bg-blue-900/30 ring-2 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                                : 'border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 hover:border-slate-600'
                        }`}
                    >
                        <input
                            type="radio"
                            name="mcq-option"
                            className="w-5 h-5 text-blue-500 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-offset-slate-800 mr-4 cursor-pointer"
                            checked={selectedOption === idx}
                            onChange={() => setSelectedOption(idx)}
                        />
                        <span className="text-lg text-slate-200">{option}</span>
                    </label>
                ))}
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSubmitAnswer}
                    disabled={evaluating || selectedOption === null}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/25"
                >
                    {evaluating ? 'Submitting...' : (currentIndex === questions.length - 1 ? 'Finish Interview' : 'Next Question')}
                </button>
            </div>
            <div className="clear-both"></div>
        </div>
    );
}
