import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ displayName: '', age: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the data forward using 'state' in navigate
    navigate('/onboarding', { replace: true, state: { displayName: formData.displayName, age: formData.age } });
  };

  return (
    <div className="clx-app-bg min-h-screen flex items-center justify-center p-4">
      <div className="clx-card max-w-md w-full p-8">
        <h2 className="clx-gradient-text text-3xl font-black mb-2">Let's get to know you</h2>
        <p className="text-slate-500 font-medium mb-6">A name and age help matches feel more human from the start.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="displayName" placeholder="Display Name" required onChange={handleChange} className="clx-input" />
          <input type="number" name="age" placeholder="Age" required onChange={handleChange} className="clx-input" />
          <button type="submit" className="clx-button-primary w-full">Continue</button>
        </form>
      </div>
    </div>
  );
};
export default ProfileSetup;
