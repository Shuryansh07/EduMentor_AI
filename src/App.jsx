import { Routes, Route, Navigate } from 'react-router-dom';

import DashboardLayout from './components/DashboardLayout.jsx';
import { ProtectedRoute, RoleRoute, PublicOnlyRoute } from './components/guards.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Materials from './pages/Materials.jsx';
import QuizGenerator from './pages/QuizGenerator.jsx';
import Quizzes from './pages/Quizzes.jsx';
import QuizAttempt from './pages/QuizAttempt.jsx';
import AITutor from './pages/AITutor.jsx';
import Courses from './pages/Courses.jsx';
import Analytics from './pages/Analytics.jsx';
import Profile from './pages/Profile.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Authenticated app (shared sidebar/topbar layout) */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/quiz/generate" element={<QuizGenerator />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/quiz/:id" element={<QuizAttempt />} />
        <Route path="/tutor" element={<AITutor />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<RoleRoute roles={['admin']}><AdminPanel /></RoleRoute>} />
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
