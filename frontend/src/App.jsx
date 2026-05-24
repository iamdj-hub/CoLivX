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
  <div className="clx-app-bg min-h-dvh px-4 py-5 sm:px-6 lg:px-8">
    <header className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-lg shadow-blue-900/5 backdrop-blur">
      <div>
        <div className="clx-gradient-text text-2xl font-black tracking-tight">CoLivX.</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Smart Co-Living</div>
      </div>
      <Link to="/login" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-slate-900/15">
        Log In
      </Link>
    </header>

    <main className="mx-auto grid min-h-[calc(100dvh-5.5rem)] max-w-6xl items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
      <section className="text-center lg:text-left">
        <div className="mx-auto mb-5 inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700 shadow-sm lg:mx-0">
          Live matching, rooms, reviews and chat
        </div>
        <h1 className="clx-gradient-text text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
          Find a room and roommate that actually fit your life.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg lg:mx-0">
          CoLivX combines preferences, location radius, profile reviews, room photos and live messaging so moving in feels less random.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
          <Link to="/login" className="clx-button-primary text-center">
            Get Started
          </Link>
          <a href="#features" className="rounded-xl border border-cyan-100 bg-white/85 px-6 py-3 text-center font-bold text-slate-700 shadow-lg shadow-blue-900/5">
            See Features
          </a>
        </div>
      </section>

      <section className="clx-card overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 p-5 text-white sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-cyan-50">Match Preview</div>
              <div className="mt-1 text-3xl font-black">92% compatible</div>
            </div>
            <div className="rounded-2xl bg-white/20 px-4 py-3 text-center backdrop-blur">
              <div className="text-2xl font-black">5 star</div>
              <div className="text-xs font-bold">Reviews</div>
            </div>
          </div>
        </div>
        <div id="features" className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
          {[
            ['Radius Map', 'Search rooms around your ideal area.'],
            ['Live Chat', 'Message matches without leaving the app.'],
            ['Photo Uploads', 'Profiles and rooms look real.'],
            ['Reputation', 'Ratings and comments build confidence.']
          ].map(([title, copy]) => (
            <div key={title} className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/70 p-4">
              <div className="font-black text-slate-900">{title}</div>
              <p className="mt-1 text-sm font-medium text-slate-500">{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
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
