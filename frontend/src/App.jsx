import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentQuestions from './pages/StudentQuestions';
import NewQuestion from './pages/NewQuestion';
import QuestionDetail from './pages/QuestionDetail';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorQuestions from './pages/InstructorQuestions';
import EscalatedQuestions from './pages/EscalatedQuestions';
import KarmaLeaderboard from './pages/KarmaLeaderboard';

// Components
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/" element={currentUser ? (
        currentUser.role === 'student' 
          ? <Navigate to="/student/dashboard" replace />
          : <Navigate to="/instructor/dashboard" replace />
      ) : <LoginPage />} />
      
      {/* Student Routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute allowedRole="student">
          <Layout><StudentDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/student/questions" element={
        <ProtectedRoute allowedRole="student">
          <Layout><StudentQuestions /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/student/questions/new" element={
        <ProtectedRoute allowedRole="student">
          <Layout><NewQuestion /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/student/questions/:id" element={
        <ProtectedRoute allowedRole="student">
          <Layout><QuestionDetail /></Layout>
        </ProtectedRoute>
      } />
      
      {/* Instructor Routes */}
      <Route path="/instructor/dashboard" element={
        <ProtectedRoute allowedRole="instructor">
          <Layout><InstructorDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/instructor/questions" element={
        <ProtectedRoute allowedRole="instructor">
          <Layout><InstructorQuestions /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/instructor/questions/:id" element={
        <ProtectedRoute allowedRole="instructor">
          <Layout><QuestionDetail isInstructor /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/instructor/escalated" element={
        <ProtectedRoute allowedRole="instructor">
          <Layout><EscalatedQuestions /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/instructor/karma" element={
        <ProtectedRoute allowedRole="instructor">
          <Layout><KarmaLeaderboard /></Layout>
        </ProtectedRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
