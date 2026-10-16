import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Attendance from './pages/Attendance';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QrScan from './pages/QrScan';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Attendance />} />
                <Route path="/scan" element={<QrScan />} />
                <Route path="/login" element={<Login />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
