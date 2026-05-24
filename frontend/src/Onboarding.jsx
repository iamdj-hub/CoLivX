import { useState } from 'react';
import { auth } from './firebase';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './api';

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Fully synced with our complex Mongoose Schema
  const [formData, setFormData] = useState({
    city: '',
    gender: 'prefer not to say',
    occupation: 'student',
    budgetMin: 500,
    budgetMax: 2000,
    cleanliness: 5,
    sleepSchedule: 22, 
    dietary: 'veg',
    bio: '',
    smoking: false,
    pets: false,
    genderPreference: 'any',
    hobbiesInput: '', 
    dealbreakersInput: '' 
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Authentication lost. Please log in again.");
        navigate('/login', { replace: true });
        return;
      }

      const formattedHobbies = formData.hobbiesInput.split(',').map(item => item.trim()).filter(item => item !== "");
      const formattedDealbreakers = formData.dealbreakersInput.split(',').map(item => item.trim()).filter(item => item !== "");

      const payload = {
        uid: user.uid,
        email: user.email,
        displayName: location.state?.displayName,
        age: location.state?.age ? Number(location.state.age) : undefined,
        ...formData,
        hobbies: formattedHobbies,
        dealbreakers: formattedDealbreakers,
        locationCoords: { type: 'Point', coordinates: [0, 0] },
        budget: { min: Number(formData.budgetMin), max: Number(formData.budgetMax) },
      };

      const response = await axios.post(`${API_BASE_URL}/api/users/onboarding`, payload);
      
      if (response.data.success) {
        alert("Profile Built! Our algorithm is crunching your data.");
        // This drops the user straight into the Dashboard!
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data. Ensure your backend is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clx-app-bg flex min-h-dvh">
      
      {/* LEFT SIDE: Dynamic Visual Engine */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-blue-800 to-teal-600 text-white flex-col justify-between p-16 relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-emerald-300 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">CoLivX</h1>
          <p className="text-lg text-cyan-100 font-medium">The data-driven matching engine.</p>
        </div>
        
        <div className="relative z-10 mb-20">
          {step === 1 && (
            <div className="animate-fade-in-up">
              <h2 className="text-5xl font-extrabold leading-tight mb-6">Let's map out your<br/>logistics.</h2>
              <p className="text-xl text-cyan-50">We use this data to find roommates heading to the exact same area, within the exact same budget.</p>
            </div>
          )}
          {step === 2 && (
            <div className="animate-fade-in-up">
              <h2 className="text-5xl font-extrabold leading-tight mb-6">Define your vibe<br/>and lifestyle.</h2>
              <p className="text-xl text-cyan-50">This is where the magic happens. We convert your habits into mathematical vectors to find your perfect match.</p>
            </div>
          )}
          {step === 3 && (
            <div className="animate-fade-in-up">
              <h2 className="text-5xl font-extrabold leading-tight mb-6">Set your boundaries<br/>and dealbreakers.</h2>
              <p className="text-xl text-cyan-50">Protect your peace. Tell us what you absolutely will not tolerate, and we'll filter them out instantly.</p>
            </div>
          )}
        </div>

        <div className="relative z-10 flex items-center space-x-3 text-sm text-cyan-100 font-medium">
          <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
          <span>Secure Vector Engine Active</span>
        </div>
      </div>

      {/* RIGHT SIDE: The Form Engine */}
      <div className="flex w-full flex-col justify-center overflow-y-auto px-4 py-8 sm:px-10 lg:w-1/2 lg:px-16 lg:py-12">
        <div className="clx-card mx-auto w-full max-w-md p-5 sm:p-8">
          
          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex justify-between text-sm font-bold text-gray-400 mb-3">
              <span className={step >= 1 ? "text-cyan-600 transition-colors" : ""}>01 Basics</span>
              <span className={step >= 2 ? "text-cyan-600 transition-colors" : ""}>02 Vibe</span>
              <span className={step >= 3 ? "text-cyan-600 transition-colors" : ""}>03 Boundaries</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} className="space-y-6">
            
            {/* STEP 1: THE BASICS */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Target City</label>
                  <input type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full rounded-xl border-gray-300 border p-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white shadow-sm" placeholder="e.g., Bangalore, London, New York" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Occupation</label>
                  <select name="occupation" value={formData.occupation} onChange={handleChange} className="w-full rounded-xl border-gray-300 border p-3.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm">
                    <option value="student">Student</option>
                    <option value="working professional">Working Professional</option>
                    <option value="looking for job">Looking for a Job</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Your Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full rounded-xl border-gray-300 border p-3.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Monthly Budget (Min - Max)</label>
                  <div className="flex items-center space-x-3">
                    <input type="number" name="budgetMin" value={formData.budgetMin} onChange={handleChange} className="w-1/2 rounded-xl border-gray-300 border p-3.5 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Min" />
                    <span className="text-gray-400 font-bold">-</span>
                    <input type="number" name="budgetMax" value={formData.budgetMax} onChange={handleChange} className="w-1/2 rounded-xl border-gray-300 border p-3.5 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Max" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: THE VIBE */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cleanliness: <span className="text-blue-600">{formData.cleanliness}/10</span></label>
                  <input type="range" name="cleanliness" min="1" max="10" value={formData.cleanliness} onChange={handleChange} className="w-full accent-blue-600 cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-500 font-medium mt-1">
                    <span>Messy Genius</span>
                    <span>Surgical Room</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Average Bedtime: <span className="text-blue-600">{formData.sleepSchedule}:00</span></label>
                  <input type="range" name="sleepSchedule" min="0" max="23" value={formData.sleepSchedule} onChange={handleChange} className="w-full accent-blue-600 cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-500 font-medium mt-1">
                    <span>Midnight (0:00)</span>
                    <span>11 PM (23:00)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Dietary Preference</label>
                  <select name="dietary" value={formData.dietary} onChange={handleChange} className="w-full rounded-xl border-gray-300 border p-3.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm">
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Short Bio</label>
                  <textarea name="bio" rows="3" value={formData.bio} onChange={handleChange} className="w-full rounded-xl border-gray-300 border p-3.5 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm resize-none" placeholder="I love coding, gaming, and weekend hikes..."></textarea>
                  <p className="text-xs text-gray-500 mt-2">Our NLP algorithm extracts compatibility keywords from this text!</p>
                </div>
              </div>
            )}

            {/* STEP 3: THE BOUNDARIES */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-1 gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" name="smoking" checked={formData.smoking} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                    <span className="text-gray-800 font-medium text-sm">I smoke / Okay with smoking</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" name="pets" checked={formData.pets} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                    <span className="text-gray-800 font-medium text-sm">I have pets / Okay with pets</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Roommate Gender Preference</label>
                  <select name="genderPreference" value={formData.genderPreference} onChange={handleChange} className="w-full rounded-xl border-gray-300 border p-3.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm">
                    <option value="any">No Preference (Any)</option>
                    <option value="male">Male Only</option>
                    <option value="female">Female Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hobbies (Comma Separated)</label>
                  <input type="text" name="hobbiesInput" value={formData.hobbiesInput} onChange={handleChange} className="w-full rounded-xl border-gray-300 border p-3.5 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" placeholder="Gaming, Football, Reading..." />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Dealbreakers (Comma Separated)</label>
                  <input type="text" name="dealbreakersInput" value={formData.dealbreakersInput} onChange={handleChange} className="w-full rounded-xl border-gray-300 border p-3.5 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" placeholder="Loud music, Untidy, Smoking..." />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col gap-3 pt-8 sm:flex-row sm:justify-between">
              {step > 1 ? (
                <button type="button" onClick={prevStep} className="px-6 py-3.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition shadow-sm">
                  Back
                </button>
              ) : (
                <div className="hidden sm:block"></div>
              )}

              {step < 3 ? (
                <button type="button" onClick={nextStep} className="rounded-xl bg-blue-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 sm:ml-auto">
                  Continue
                </button>
              ) : (
                <button type="submit" disabled={loading} className="px-8 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200 disabled:bg-green-400 flex items-center justify-center">
                  {loading ? 'Crunching Data...' : 'Find My Match'}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
