import { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './api';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

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
        try {
          const response = await axios.get(`${API_BASE_URL}/api/users/profile/${user.uid}`);
          
          // 4. SMART CHECK: Do they exist AND do they have preference data?
          if (response.data && response.data.success) {
            if (response.data.profileData && response.data.profileData.cleanliness) {
              navigate('/dashboard', { replace: true }); // Fully onboarded
            } else {
              navigate('/profile-setup', { replace: true }); // Partial profile, send back to setup
            }
          }
        
        } catch (dbError) {
          // 5. If MongoDB throws a 404 (Not Found), they haven't finished onboarding.
          if (dbError.response && dbError.response.status === 404) {
            navigate('/profile-setup', { replace: true });
          } else {
            console.error("Database connection error:", dbError);
            await auth.signOut();
            setError(`Could not connect to the deployed backend. Check Vercel VITE_API_BASE_URL and Render CORS settings. Current API: ${API_BASE_URL}`);
          }
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

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
