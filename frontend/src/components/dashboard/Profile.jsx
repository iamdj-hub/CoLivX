import { useState } from 'react';
import axios from 'axios';
import { auth } from '../../firebase';
import { API_BASE_URL } from '../../api';

const Profile = ({ 
  profileData, 
  setProfileData,
  isEditingProfile, 
  setIsEditingProfile, 
  editFormData, 
  setEditFormData, 
  handleUpdateProfile 
}) => {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);

  const renderAvatar = (url, name) => {
    if (url) return <img src={url} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-md" />;
    return (
      <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-extrabold shadow-md">
        {name ? name.charAt(0).toUpperCase() : "U"}
      </div>
    );
  };

  const handleProfilePhotoChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setProfilePhoto(selectedFile);
    setProfilePhotoPreview(URL.createObjectURL(selectedFile));
  };

  const handleProfilePhotoUpload = async () => {
    const user = auth.currentUser;
    if (!user || !profilePhoto) return;

    try {
      setUploadingProfilePhoto(true);
      const imageData = new FormData();
      imageData.append('image', profilePhoto);
      imageData.append('email', user.email || '');
      imageData.append('displayName', editFormData?.displayName || profileData?.displayName || '');
      const response = await axios.post(`${API_BASE_URL}/api/uploads/profile/${user.uid}`, imageData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setEditFormData((previous) => ({
          ...previous,
          profileImage: response.data.profileImage
        }));
        setProfileData?.((previous) => ({
          ...previous,
          profileImage: response.data.profileImage
        }));
        setProfilePhoto(null);
        setProfilePhotoPreview('');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload profile photo.');
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  // ==========================================
  // EDIT MODE UI
  // ==========================================
  if (isEditingProfile) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-10">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-extrabold text-gray-900">Edit My Profile</h2>
          <button onClick={() => setIsEditingProfile(false)} className="text-gray-500 hover:text-gray-900 font-bold px-4 py-2 bg-gray-100 rounded-xl transition">
            Cancel
          </button>
        </div>
        
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* Identity & Bio */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Identity & Bio</h3>
            <div className="flex items-center gap-4 rounded-2xl bg-cyan-50/60 p-4 border border-cyan-100">
              {renderAvatar(profilePhotoPreview || editFormData?.profileImage, editFormData?.displayName)}
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="w-full rounded-xl border border-cyan-100 bg-white p-3 font-medium text-gray-700"
                />
                <button
                  type="button"
                  onClick={handleProfilePhotoUpload}
                  disabled={!profilePhoto || uploadingProfilePhoto}
                  className="mt-3 rounded-xl bg-cyan-600 px-4 py-2 font-bold text-white transition hover:bg-cyan-700 disabled:opacity-50"
                >
                  {uploadingProfilePhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Display Name</label>
                <input type="text" value={editFormData?.displayName || ''} onChange={(e) => setEditFormData({...editFormData, displayName: e.target.value})} className="w-full px-4 py-3 border rounded-xl" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
                <input type="number" value={editFormData?.age || ''} onChange={(e) => setEditFormData({...editFormData, age: e.target.value})} className="w-full px-4 py-3 border rounded-xl" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                <input type="text" value={editFormData?.city || ''} onChange={(e) => setEditFormData({...editFormData, city: e.target.value})} className="w-full px-4 py-3 border rounded-xl" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">My Gender</label>
                <select value={editFormData?.gender || 'other'} onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})} className="w-full px-4 py-3 border rounded-xl bg-white">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Looking for (Gender)</label>
                <select value={editFormData?.genderPreference || 'any'} onChange={(e) => setEditFormData({...editFormData, genderPreference: e.target.value})} className="w-full px-4 py-3 border rounded-xl bg-white">
                  <option value="any">Any Gender</option>
                  <option value="male">Males</option>
                  <option value="female">Females</option>
                </select>
              </div>
            </div>
            <textarea value={editFormData?.bio || ''} onChange={(e) => setEditFormData({...editFormData, bio: e.target.value})} className="w-full px-4 py-3 border rounded-xl mt-2" rows="3" placeholder="Tell potential roommates about yourself..." />
          </div>

          {/* Hard Preferences (Diet, Smoking, Pets) */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Habits & Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Dietary</label>
                <select value={editFormData?.dietary || 'any'} onChange={(e) => setEditFormData({...editFormData, dietary: e.target.value})} className="w-full px-4 py-3 border rounded-xl bg-white">
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Veg</option>
                  <option value="vegan">Vegan</option>
                  <option value="any">Any / No Preference</option>
                </select>
              </div>
              
              <div className="flex flex-col justify-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="flex items-center cursor-pointer gap-3">
                  <input type="checkbox" checked={editFormData?.smoking || false} onChange={(e) => setEditFormData({...editFormData, smoking: e.target.checked})} className="w-5 h-5 accent-blue-600 rounded" />
                  <span className="font-bold text-gray-700">I Smoke</span>
                </label>
              </div>

              <div className="flex flex-col justify-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="flex items-center cursor-pointer gap-3">
                  <input type="checkbox" checked={editFormData?.pets || false} onChange={(e) => setEditFormData({...editFormData, pets: e.target.checked})} className="w-5 h-5 accent-blue-600 rounded" />
                  <span className="font-bold text-gray-700">I Have Pets</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sliders: Vibe & Lifestyle */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Lifestyle Sliders</h3>
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-bold text-gray-700">Cleanliness Level</label>
                <span className="font-bold text-blue-600">{editFormData?.cleanliness || 5}/10</span>
              </div>
              <input type="range" min="1" max="10" value={editFormData?.cleanliness || 5} onChange={(e) => setEditFormData({...editFormData, cleanliness: Number(e.target.value)})} className="w-full accent-blue-600 cursor-pointer" />
              <div className="flex justify-between text-xs text-gray-400 mt-1 font-medium">
                <span>Messy</span><span>Neat Freak</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-bold text-gray-700">Sleep Schedule</label>
                <span className="font-bold text-purple-600">{editFormData?.sleepSchedule || 22}:00</span>
              </div>
              <input type="range" min="0" max="23" value={editFormData?.sleepSchedule || 22} onChange={(e) => setEditFormData({...editFormData, sleepSchedule: Number(e.target.value)})} className="w-full accent-purple-600 cursor-pointer" />
              <div className="flex justify-between text-xs text-gray-400 mt-1 font-medium">
                <span>Early Bird</span><span>Night Owl</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Preferences</h3>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Hobbies (Comma separated)</label>
              <input type="text" value={editFormData?.hobbiesInput || ''} onChange={(e) => setEditFormData({...editFormData, hobbiesInput: e.target.value})} className="w-full px-4 py-3 border rounded-xl" placeholder="e.g. Gym, Gaming, Cooking" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Dealbreakers (Comma separated)</label>
              <input type="text" value={editFormData?.dealbreakersInput || ''} onChange={(e) => setEditFormData({...editFormData, dealbreakersInput: e.target.value})} className="w-full px-4 py-3 border rounded-xl" placeholder="e.g. Smoking, Loud Music, Pets" />
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-gray-900 text-white text-lg font-bold rounded-xl hover:bg-black transition shadow-lg">
            💾 Save Profile & Recalculate Matches
          </button>
        </form>
      </div>
    );
  }

  // ==========================================
  // READ MODE UI (The Dashboard View)
  // ==========================================
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
      
      {/* Header Card */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6">
          <button onClick={() => setIsEditingProfile(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-2 px-6 rounded-xl transition">
            ✏️ Edit Profile
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          {renderAvatar(profileData?.profileImage, profileData?.displayName)}
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              {profileData?.displayName || "Anonymous User"}
              {profileData?.gender === 'male' && <span className="text-blue-500 text-xl" title="Male">♂</span>}
              {profileData?.gender === 'female' && <span className="text-pink-500 text-xl" title="Female">♀</span>}
            </h2>
            <p className="text-lg text-gray-500 font-medium mt-1">
              {profileData?.age ? `${profileData.age} yrs` : ''} • {profileData?.occupation || 'Student'} • 📍 {profileData?.city || 'No City Set'}
            </p>
            <p className="text-sm font-bold text-yellow-600 mt-2">
              {profileData?.trustRating ? `${profileData.trustRating}/5 average rating` : 'No ratings yet'} • {profileData?.reviewsCount || 0} reviews
            </p>
            <div className="flex gap-2 mt-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${profileData?.smoking ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {profileData?.smoking ? '🚬 Smoker' : '🚭 Non-Smoker'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${profileData?.pets ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                {profileData?.pets ? '🐾 Has Pets' : '🚫 No Pets'}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase">
                🍲 {profileData?.dietary || 'Diet Not Set'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">About Me</h3>
          <p className="text-gray-800 text-lg italic">"{profileData?.bio || 'No bio added yet. Tell people about your vibe!'}"</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sliders Display */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-6">Lifestyle Profile</h3>
          
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-gray-700">Cleanliness</span>
              <span className="font-bold text-blue-600">{profileData?.cleanliness || 5}/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(profileData?.cleanliness || 5) * 10}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="font-bold text-gray-700">Sleep Schedule</span>
              <span className="font-bold text-purple-600">{profileData?.sleepSchedule || 22}:00</span>
            </div>
             <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${((profileData?.sleepSchedule || 22) / 24) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Tags Display */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-6">Interests & Dealbreakers</h3>
          
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Hobbies</h4>
            <div className="flex flex-wrap gap-2">
              {profileData?.hobbies?.length > 0 ? profileData.hobbies.map((hobby, i) => (
                <span key={i} className="px-4 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-lg text-sm border border-blue-100">{hobby}</span>
              )) : <span className="text-gray-400 text-sm">No hobbies listed.</span>}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Dealbreakers</h4>
            <div className="flex flex-wrap gap-2">
              {profileData?.dealbreakers?.length > 0 ? profileData.dealbreakers.map((db, i) => (
                <span key={i} className="px-4 py-1.5 bg-red-50 text-red-700 font-bold rounded-lg text-sm border border-red-100">{db}</span>
              )) : <span className="text-gray-400 text-sm">No dealbreakers listed.</span>}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">NLP Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {profileData?.keywordLabels?.length > 0 ? profileData.keywordLabels.map((keyword) => (
                <span key={keyword} className="px-4 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-sm border border-emerald-100">{keyword}</span>
              )) : <span className="text-gray-400 text-sm">Keywords will appear after saving your profile.</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* NEW: ROOMS POSTED & REVIEWS SECTIONS */}
      {/* ========================================== */}
      
      {/* Rooms Posted by User */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mt-6">
        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
          🏠 Rooms Posted
        </h3>
        {profileData?.postedRooms?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profileData.postedRooms.map((room, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition">
                <div className="bg-gray-100 h-32 rounded-lg w-full flex items-center justify-center text-gray-400 font-bold overflow-hidden">
                  {room.images && room.images.length > 0 ? (
                    <img src={room.images[0]} className="h-full w-full object-cover" alt="Room" />
                  ) : (
                    <span>No Image</span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg truncate">{room.title || 'Room Listing'}</h4>
                  <p className="text-blue-600 font-extrabold">${room.rent || room.rentPerMonth || '0'}/mo</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">You haven't posted any rooms yet.</p>
          </div>
        )}
      </div>

      {/* Trust Center: Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* Reviews Received (What others say about them) */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
            ⭐ Reviews Received
          </h3>
          {profileData?.reviewsReceived?.length > 0 ? (
            <div className="space-y-5">
              {profileData.reviewsReceived.map((review, index) => (
                <div key={index} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">{review.reviewerName || 'Former Roommate'}</span>
                    <span className="text-yellow-400 text-lg">{'★'.repeat(review.rating || 5)}{'☆'.repeat(5 - (review.rating || 5))}</span>
                  </div>
                  <p className="text-gray-600 italic">"{review.comment || review.text || 'Great person to live with!'}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">No reviews received yet.</p>
            </div>
          )}
        </div>

        {/* Reviews Written (What they say about others/rooms) */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
            ✍️ Reviews Written
          </h3>
          {profileData?.reviewsWritten?.length > 0 ? (
            <div className="space-y-5">
              {profileData.reviewsWritten.map((review, index) => (
                <div key={index} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">For: {review.targetName || 'Room/User'}</span>
                    <span className="text-yellow-400 text-lg">{'★'.repeat(review.rating || 5)}{'☆'.repeat(5 - (review.rating || 5))}</span>
                  </div>
                  <p className="text-gray-600 italic">"{review.comment || review.text || 'Had a good experience.'}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">You haven't written any reviews yet.</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default Profile;
