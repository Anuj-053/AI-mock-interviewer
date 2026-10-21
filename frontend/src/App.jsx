import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import Result from './pages/Result';
import Revision from './pages/Revision';

// A simple wrapper to protect private routes
const PrivateRoute = ({ children }) => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-10">
        {/* Simple Navbar */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-blue-400 drop-shadow-md tracking-tight">AI Resume Interviewer</h1>
          <p className="text-slate-400 mt-2 text-lg">Master your tech interviews with personalized AI grilling</p>
        </header>

        {/* Page Content */}
        <main className="w-full max-w-3xl px-4">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/interview/:id" element={<PrivateRoute><Interview /></PrivateRoute>} />
            <Route path="/result/:id" element={<PrivateRoute><Result /></PrivateRoute>} />
            <Route path="/revision" element={<PrivateRoute><Revision /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
