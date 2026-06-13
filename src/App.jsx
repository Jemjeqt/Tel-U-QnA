import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import ForumPage from './pages/ForumPage';
import DetailPage from './pages/DetailPage';
import AskPage from './pages/AskPage';
import NotifPage from './pages/NotifPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import PostManagement from './pages/admin/PostManagement';
import CommentManagement from './pages/admin/CommentManagement';
import CategoryManagement from './pages/admin/CategoryManagement';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token) return <Navigate to="/login" replace />;
  if (!user || user.role !== 'admin') return <Navigate to="/forum" replace />;

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

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
        <Route path="/admin/posts" element={<AdminRoute><PostManagement /></AdminRoute>} />
        <Route path="/admin/comments" element={<AdminRoute><CommentManagement /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><CategoryManagement /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/forum" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
