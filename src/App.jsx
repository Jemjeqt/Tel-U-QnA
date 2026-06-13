import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import ForumPage from './pages/ForumPage';
import DetailPage from './pages/DetailPage';
import AskPage from './pages/AskPage';
import NotifPage from './pages/NotifPage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/forum/:postId" element={<DetailPage />} />
        <Route path="/tanya" element={<ProtectedRoute><AskPage /></ProtectedRoute>} />
        <Route path="/notifikasi" element={<ProtectedRoute><NotifPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/forum" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
