import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminSubmitThesis from './pages/AdminSubmitThesis';
import AdminSubmitPublication from './pages/AdminSubmitPublication';
import AdminRegister from './pages/AdminRegister';
import LandingPage from './pages/LandingPage';
import ThesisDetails from './pages/ThesisDetails';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

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
          <Route path="/login" element={<Navigate to="/" state={{ openLogin: true }} replace />} />
          <Route path="/admin-register" element={<Navigate to="/" state={{ openRegister: true }} replace />} />
          
          <Route path="/admin-dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          
          <Route path="/admin/submit-thesis" element={
            <AdminRoute>
              <AdminSubmitThesis />
            </AdminRoute>
          } />
          
          <Route path="/admin/submit-publication" element={
            <AdminRoute>
              <AdminSubmitPublication />
            </AdminRoute>
          } />

          <Route path="/thesis/:id" element={<ThesisDetails />} />
          <Route path="/" element={<LandingPage />} />
          
          {/* Fallback for removed student routes */}
          <Route path="/dashboard" element={<Navigate to="/admin-dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/" state={{ openRegister: true }} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
