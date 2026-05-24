import { useCallback, useEffect, useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './api';

const hasCompletedPreferences = (profileData) => (
  Boolean(profileData?.preferenceId) ||
  profileData?.cleanliness !== undefined ||
  profileData?.city !== undefined
);

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(false);
  const navigate = useNavigate();

  const routeAfterBackendCheck = useCallback(async (user) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/profile/${user.uid}`);
      
      if (response.data && response.data.success) {
        if (hasCompletedPreferences(response.data.profileData)) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/profile-setup', { replace: true });
        }
      }
    } catch (dbError) {
      if (dbError.response && dbError.response.status === 404) {
        navigate('/profile-setup', { replace: true });
      } else {
        console.error("Database connection error:", dbError);
        await auth.signOut();
        setError(`Could not connect to the deployed backend. Check Vercel VITE_API_BASE_URL and Render CORS settings. Current API: ${API_BASE_URL}`);
      }
    }
  }, [navigate]);

  useEffect(() => {
    const existingUser = auth.currentUser;
    if (!existingUser) return;

    let cancelled = false;
    const checkExistingSession = async () => {
      setCheckingSession(true);
      await routeAfterBackendCheck(existingUser);
      if (!cancelled) setCheckingSession(false);
    };

    checkExistingSession();
    return () => {
      cancelled = true;
    };
  }, [routeAfterBackendCheck]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setCheckingSession(true);

    try {
      if (isSignUp) {
        // 1. Create a new user
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Account created successfully!");
        // Brand new users ALWAYS go to profile setup
        navigate('/profile-setup', { replace: true }); 
      } else {
        // 2. Log in an existing user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 3. Ask the database: "Does this user already exist in MongoDB?"
        await routeAfterBackendCheck(user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingSession(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="clx-app-bg flex min-h-dvh items-center justify-center px-4">
        <div className="clx-card px-8 py-6 text-center font-bold text-slate-600">
          Checking your saved profile...
        </div>
      </div>
    );
  }

  return (
    <div className="clx-app-bg flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl shadow-blue-900/10 backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-700 to-emerald-500 p-7 text-white sm:p-10">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-24 left-10 h-60 w-60 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative">
            <div className="text-3xl font-black tracking-tight">CoLivX.</div>
            <p className="mt-2 max-w-sm text-sm font-semibold text-cyan-50">
              Match with roommates, explore rooms nearby, review profiles and chat live from one place.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ['Smart', 'Preference and NLP matching'],
                ['Nearby', 'Radius-based room discovery'],
                ['Trusted', 'Reviews, ratings and photos']
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl bg-white/14 p-4 ring-1 ring-white/20 backdrop-blur">
                  <div className="font-black">{title}</div>
                  <div className="mt-1 text-xs font-semibold text-cyan-50">{copy}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <h2 className="clx-gradient-text text-3xl font-black text-center mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="mb-6 text-center text-sm font-medium text-slate-500">
            {isSignUp ? 'Start with your account, then set your roommate preferences.' : 'Log in and we will load your saved profile before opening the dashboard.'}
          </p>

          {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-600">{error}</p>}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="clx-input"
                required 
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="clx-input"
                required 
              />
            </div>
            <button 
              type="submit" 
              className="clx-button-primary w-full"
            >
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-bold text-cyan-700 hover:underline"
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
          <p className="mt-5 text-center text-xs font-medium text-slate-400">
            Questions or support? Contact the founder at{' '}
            <a href="mailto:djxeve19@gmail.com" className="font-bold text-slate-500 underline decoration-slate-300 underline-offset-4">
              djxeve19@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;
