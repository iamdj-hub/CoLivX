import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './Login';
import Onboarding from './Onboarding';
 // Import our new real component!
import ProfileSetup from './ProfileSetup';
import Dashboard from './Dashboard';

const Home = () => (
  <div className="clx-app-bg flex min-h-screen flex-col items-center justify-center px-4">
    <div className="clx-card max-w-3xl px-8 py-12 text-center">
    <h1 className="clx-gradient-text text-4xl md:text-6xl font-black text-center mb-4">
      Welcome to CoLivX
    </h1>
    <p className="text-lg md:text-xl text-slate-600 text-center max-w-2xl mb-8">
      The advanced, data-driven roommate matching platform.
    </p>
    <Link 
      to="/login" 
      className="clx-button-primary inline-block w-full text-center md:w-auto"
    >
      Join Now
    </Link>
    </div>
  </div>
);

const AuthLoading = () => (
  <div className="clx-app-bg flex min-h-screen items-center justify-center">
    <div className="clx-card px-8 py-6 text-center font-bold text-slate-600">
      Checking your session...
    </div>
  </div>
);

const ProtectedRoute = ({ user, loading, children }) => {
  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnlyRoute = ({ user, loading, children }) => {
  if (loading) return <AuthLoading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  const [authState, setAuthState] = useState({
    user: null,
    loading: true
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({ user, loading: false });
    });

    return unsubscribe;
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <PublicOnlyRoute user={authState.user} loading={authState.loading}>
            <Home />
          </PublicOnlyRoute>
        } />
        <Route path="/login" element={
          authState.loading ? <AuthLoading /> : <Login />
        } />
        <Route path="/onboarding" element={
          <ProtectedRoute user={authState.user} loading={authState.loading}>
            <Onboarding />
          </ProtectedRoute>
        } />
        <Route path="/profile-setup" element={
          <ProtectedRoute user={authState.user} loading={authState.loading}>
            <ProfileSetup />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute user={authState.user} loading={authState.loading}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={
          authState.loading
            ? <AuthLoading />
            : <Navigate to={authState.user ? "/dashboard" : "/login"} replace />
        } />
      </Routes>
    </Router>
  );
}

export default App;
