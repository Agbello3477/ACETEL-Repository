import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';
import ThesisDetails from './pages/ThesisDetails';
import PublicationDetails from './pages/PublicationDetails';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }
  // If a legacy student session somehow exists, block them
  if (user.role === 'Student' || user.role === 'student') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/admin-dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          
          <Route path="/thesis/:id" element={<ThesisDetails />} />
          <Route path="/publication/:id" element={<PublicationDetails />} />
          <Route path="/" element={<LandingPage />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
