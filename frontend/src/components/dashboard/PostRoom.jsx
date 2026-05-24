import { useState } from 'react';
import axios from 'axios';
import { auth } from '../../firebase';
import { API_BASE_URL } from '../../api';

const PostRoom = ({ onPosted }) => {
  const [formData, setFormData] = useState({
    title: '',
    rent: '',
    location: '',
    latitude: '',
    longitude: '',
    description: '',
    amenities: '',
    preferredGender: 'any',
    preferredOccupation: 'any',
    preferredBudgetMin: '',
    preferredBudgetMax: '',
    preferenceNotes: '',
  });
  const [roomPhotos, setRoomPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState('');

  const handleSubmit = async (e) => {
  e.preventDefault();
  setPostError('');
  setPostSuccess('');
  setSubmitting(true);
  try {
    const user = auth.currentUser;
    if (!user) {
      setPostError('Please log in again before posting a room.');
      return;
    }

    const rent = Number(formData.rent);
    if (!Number.isFinite(rent) || rent <= 0) {
      setPostError('Monthly rent must be greater than 0.');
      return;
    }

    let uploadedImages = [];
    if (roomPhotos.length > 0) {
      setUploadingImages(true);
      const imageData = new FormData();
      roomPhotos.forEach((photo) => imageData.append('images', photo));
      const uploadRes = await axios.post(`${API_BASE_URL}/api/uploads/rooms`, imageData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000
      });
      uploadedImages = uploadRes.data.images || [];
    }

    // Prepare the payload
    const payload = {
      uid: user.uid,
      userId: user.uid,
      title: formData.title,
      rent,
      location: formData.location,
      latitude: formData.latitude,
      longitude: formData.longitude,
      description: formData.description,
      amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean),
      rules: {
        smoking: false,
        pets: false,
        dietary: 'any'
      },
      renterPreferences: {
        gender: formData.preferredGender,
        occupation: formData.preferredOccupation,
        budgetMin: Number(formData.preferredBudgetMin) || 0,
        budgetMax: Number(formData.preferredBudgetMax) || 0,
        notes: formData.preferenceNotes
      },
      images: uploadedImages
    };

    // Send to backend
    const res = await axios.post(`${API_BASE_URL}/api/rooms`, payload, { timeout: 20000 });
    
    if (res.data.success) {
      setPostSuccess('Room listed successfully. Opening Browse Rooms...');
      setFormData({
        title: '',
        rent: '',
        location: '',
        latitude: '',
        longitude: '',
        description: '',
        amenities: '',
        preferredGender: 'any',
        preferredOccupation: 'any',
        preferredBudgetMin: '',
        preferredBudgetMax: '',
        preferenceNotes: '',
      });
      setRoomPhotos([]);
      setPhotoPreviews([]);
      window.setTimeout(() => onPosted?.(res.data.room), 500);
    }
  } catch (error) {
    console.error("Error posting room:", error);
    setPostError(error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'Posting took too long. Try smaller photos or post without photos first.' : error.message) || 'Failed to post room. Please try again.');
  } finally {
    setUploadingImages(false);
    setSubmitting(false);
  }
};

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        });
      },
      () => alert('Could not access your current location.')
    );
  };

  const handleRoomPhotosChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []).slice(0, 6);
    setRoomPhotos(selectedFiles);
    setPhotoPreviews(selectedFiles.map((file) => URL.createObjectURL(file)));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="clx-panel p-8">
        <h2 className="clx-gradient-text text-3xl font-black mb-2">🏠 Post a Room</h2>
        <p className="text-gray-500 font-medium mb-8">Got a spare room? Find the perfect roommate by listing it here.</p>
        {postError && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {postError}
          </div>
        )}
        {postSuccess && (
          <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {postSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Catchy Title</label>
              <input 
                type="text" 
                placeholder="e.g. Sunny Master Bedroom in Downtown Appt" 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Monthly Rent ($)</label>
              <input 
                type="number" 
                placeholder="800" 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.rent}
                onChange={(e) => setFormData({...formData, rent: e.target.value})}
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Location / Neighborhood</label>
              <input 
                type="text" 
                placeholder="e.g. Brooklyn, NY" 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                placeholder="25.7771"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.latitude}
                onChange={(e) => setFormData({...formData, latitude: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                placeholder="87.4753"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.longitude}
                onChange={(e) => setFormData({...formData, longitude: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition"
              >
                Use My Current Coordinates
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea 
              rows="4" 
              placeholder="Describe the room, the apartment vibe, and what you're looking for..." 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required 
            />
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Amenities (Comma separated)</label>
            <input 
              type="text" 
              placeholder="e.g. In-unit washer, Gym, Balcony" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.amenities}
              onChange={(e) => setFormData({...formData, amenities: e.target.value})}
            />
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-5">
            <h3 className="mb-4 text-lg font-black text-slate-900">Renter Preferences</h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Preferred Gender</label>
                <select
                  value={formData.preferredGender}
                  onChange={(e) => setFormData({...formData, preferredGender: e.target.value})}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="any">Any</option>
                  <option value="female">Female only</option>
                  <option value="male">Male only</option>
                  <option value="other">Other / inclusive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Preferred Occupation</label>
                <select
                  value={formData.preferredOccupation}
                  onChange={(e) => setFormData({...formData, preferredOccupation: e.target.value})}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="any">Any</option>
                  <option value="student">Students</option>
                  <option value="working professional">Working professionals</option>
                  <option value="looking for job">Looking for job</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Preferred Budget Min ($)</label>
                <input
                  type="number"
                  placeholder="500"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.preferredBudgetMin}
                  onChange={(e) => setFormData({...formData, preferredBudgetMin: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Preferred Budget Max ($)</label>
                <input
                  type="number"
                  placeholder="1200"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.preferredBudgetMax}
                  onChange={(e) => setFormData({...formData, preferredBudgetMax: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Additional Preference Notes</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Quiet renter, no late-night parties, student preferred..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.preferenceNotes}
                  onChange={(e) => setFormData({...formData, preferenceNotes: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="border-2 border-dashed border-cyan-200 rounded-2xl p-6 bg-cyan-50/50">
            <label className="block text-sm font-bold text-gray-700 mb-2">Room Photos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleRoomPhotosChange}
              className="w-full rounded-xl border border-cyan-100 bg-white p-3 font-medium text-gray-700"
            />
            <p className="mt-2 text-sm text-gray-500">Upload up to 6 photos. They will be stored in Cloudinary.</p>
            {photoPreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {photoPreviews.map((preview, index) => (
                  <img key={preview} src={preview} alt={`Room preview ${index + 1}`} className="h-28 w-full rounded-xl object-cover shadow-sm" />
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="clx-button-primary w-full py-4 text-lg disabled:opacity-60">
            {uploadingImages ? 'Uploading Photos...' : submitting ? 'Posting Listing...' : 'Post Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostRoom;
