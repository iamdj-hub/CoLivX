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
      <div className="clx-app-bg flex min-h-screen items-center justify-center px-4">
        <div className="clx-card px-8 py-6 text-center font-bold text-slate-600">
          Checking your saved profile...
        </div>
      </div>
    );
  }

  return (
    <div className="clx-app-bg flex min-h-screen items-center justify-center px-4">
      <div className="clx-card w-full max-w-md p-8">
        <h2 className="clx-gradient-text text-3xl font-black text-center mb-6">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="clx-input"
              required 
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
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
            className="text-blue-600 font-semibold hover:underline"
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
