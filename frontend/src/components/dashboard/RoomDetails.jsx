import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api';

const getRoomCoords = (targetRoom) => {
  const coordinates = targetRoom?.locationCoords?.coordinates;
  if (!coordinates || coordinates.length !== 2) return { latitude: '', longitude: '' };

  return {
    longitude: coordinates[0] ?? '',
    latitude: coordinates[1] ?? ''
  };
};

const getAvailabilityLabel = (allocation = {}) => {
  const status = allocation.status || 'available';
  if (status === 'available') return 'Available';

  const labelMap = {
    allocated: 'Allocated',
    booked: 'Booked',
    rented: 'Rented'
  };
  const label = labelMap[status] || 'Taken';
  return `${label}${allocation.durationValue ? ` for ${allocation.durationValue} ${allocation.durationUnit || 'months'}` : ''}`;
};

const isRoomTaken = (allocation = {}) => (allocation.status || 'available') !== 'available';

const RoomDetails = ({ 
  room, 
  onBack, 
  onMessageClick, 
  onViewPosterProfile,
  isLiked,
  isShortlisted,
  onToggleLike,
  onToggleShortlist,
  currentUid,
  onRoomUpdated
}) => {
  const buildEditData = (targetRoom) => ({
    ...getRoomCoords(targetRoom),
    title: targetRoom?.title || '',
    rent: targetRoom?.rent || '',
    location: targetRoom?.location || '',
    availableFrom: targetRoom?.availableFrom || '',
    leaseTerm: targetRoom?.leaseTerm || '',
    description: targetRoom?.description || '',
    amenities: targetRoom?.amenities?.join(', ') || '',
    ruleSmoking: Boolean(targetRoom?.rules?.smoking),
    rulePets: Boolean(targetRoom?.rules?.pets),
    ruleDietary: targetRoom?.rules?.dietary || 'any',
    preferredGender: targetRoom?.renterPreferences?.gender || 'any',
    preferredOccupation: targetRoom?.renterPreferences?.occupation || 'any',
    preferredBudgetMin: targetRoom?.renterPreferences?.budgetMin || '',
    preferredBudgetMax: targetRoom?.renterPreferences?.budgetMax || '',
    preferenceNotes: targetRoom?.renterPreferences?.notes || '',
    allocationStatus: targetRoom?.allocation?.status || 'available',
    allocationDurationValue: targetRoom?.allocation?.durationValue || '',
    allocationDurationUnit: targetRoom?.allocation?.durationUnit || 'months'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(buildEditData(room));
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  if (!room) return null;
  const roomImage = room.images?.[0] || room.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
  const posterName = room.posterName || 'CoLivX User';
  const posterId = room.poster?.id || room.userId;
  const posterProfileImage = room.poster?.profileImage;
  const isOwner = currentUid && room.userId === currentUid;
  const allocation = room.allocation || { status: 'available' };
  const renterPreferences = room.renterPreferences || {};
  const preferenceChips = [
    renterPreferences.gender && renterPreferences.gender !== 'any' ? `${renterPreferences.gender} preferred` : 'Any gender',
    renterPreferences.occupation && renterPreferences.occupation !== 'any' ? renterPreferences.occupation : 'Any occupation',
    renterPreferences.budgetMin || renterPreferences.budgetMax
      ? `Budget ₹${renterPreferences.budgetMin || 0}-₹${renterPreferences.budgetMax || room.rent}`
      : null
  ].filter(Boolean);

  const handleEditChange = (field, value) => {
    setEditData((previous) => ({ ...previous, [field]: value }));
  };

  const handleStartEdit = () => {
    setEditData(buildEditData(room));
    setEditError('');
    setIsEditing(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setEditError('');
    setSaving(true);

    try {
      const response = await axios.put(`${API_BASE_URL}/api/rooms/${room._id || room.id}`, {
        uid: currentUid,
        title: editData.title,
        rent: Number(editData.rent),
        location: editData.location,
        latitude: editData.latitude,
        longitude: editData.longitude,
        availableFrom: editData.availableFrom,
        leaseTerm: editData.leaseTerm,
        description: editData.description,
        amenities: editData.amenities.split(',').map((item) => item.trim()).filter(Boolean),
        images: room.images || [],
        renterPreferences: {
          gender: editData.preferredGender,
          occupation: editData.preferredOccupation,
          budgetMin: Number(editData.preferredBudgetMin) || 0,
          budgetMax: Number(editData.preferredBudgetMax) || 0,
          notes: editData.preferenceNotes
        },
        allocation: {
          status: editData.allocationStatus,
          durationValue: Number(editData.allocationDurationValue) || 0,
          durationUnit: editData.allocationDurationUnit
        },
        rules: {
          smoking: editData.ruleSmoking,
          pets: editData.rulePets,
          dietary: editData.ruleDietary
        }
      });

      if (response.data.success) {
        onRoomUpdated?.(response.data.room);
        setIsEditing(false);
      }
    } catch (error) {
      setEditError(error.response?.data?.message || error.message || 'Could not update room.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-10">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-4 mb-4">
        <button 
          onClick={onBack}
          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition font-bold"
        >
          ← Back to Rooms
        </button>
        {isOwner && !isEditing && (
          <button
            onClick={handleStartEdit}
            className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-700"
          >
            Edit Listing
          </button>
        )}
      </div>

      {isOwner && isEditing && (
        <form onSubmit={handleSaveRoom} className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Edit Room Listing</h2>
              <p className="text-sm font-medium text-slate-500">Update details or mark the room as booked or rented.</p>
            </div>
            <button type="button" onClick={() => setIsEditing(false)} className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700">
              Cancel
            </button>
          </div>

          {editError && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{editError}</p>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input className="clx-input md:col-span-2" value={editData.title} onChange={(e) => handleEditChange('title', e.target.value)} placeholder="Room title" required />
            <input className="clx-input" type="number" value={editData.rent} onChange={(e) => handleEditChange('rent', e.target.value)} placeholder="Monthly rent in INR" required />
            <input className="clx-input" value={editData.location} onChange={(e) => handleEditChange('location', e.target.value)} placeholder="Location" required />
            <input className="clx-input" type="number" step="any" value={editData.latitude} onChange={(e) => handleEditChange('latitude', e.target.value)} placeholder="Latitude" />
            <input className="clx-input" type="number" step="any" value={editData.longitude} onChange={(e) => handleEditChange('longitude', e.target.value)} placeholder="Longitude" />
            <input className="clx-input" type="date" value={editData.availableFrom} onChange={(e) => handleEditChange('availableFrom', e.target.value)} />
            <input className="clx-input" value={editData.leaseTerm} onChange={(e) => handleEditChange('leaseTerm', e.target.value)} placeholder="Lease term, e.g. 6+ months" />
            <textarea className="clx-input md:col-span-2" rows="3" value={editData.description} onChange={(e) => handleEditChange('description', e.target.value)} placeholder="Description" />
            <input className="clx-input md:col-span-2" value={editData.amenities} onChange={(e) => handleEditChange('amenities', e.target.value)} placeholder="Amenities, comma separated" />

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700">
              <input type="checkbox" checked={editData.ruleSmoking} onChange={(e) => handleEditChange('ruleSmoking', e.target.checked)} className="h-5 w-5 accent-blue-600" />
              Smoking allowed
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700">
              <input type="checkbox" checked={editData.rulePets} onChange={(e) => handleEditChange('rulePets', e.target.checked)} className="h-5 w-5 accent-blue-600" />
              Pets allowed
            </label>
            <select className="clx-input md:col-span-2" value={editData.ruleDietary} onChange={(e) => handleEditChange('ruleDietary', e.target.value)}>
              <option value="any">Any diet</option>
              <option value="veg">Vegetarian kitchen</option>
              <option value="non-veg">Non-veg allowed</option>
              <option value="vegan">Vegan preferred</option>
            </select>

            <select className="clx-input" value={editData.preferredGender} onChange={(e) => handleEditChange('preferredGender', e.target.value)}>
              <option value="any">Any gender</option>
              <option value="female">Female only</option>
              <option value="male">Male only</option>
              <option value="other">Other / inclusive</option>
            </select>
            <select className="clx-input" value={editData.preferredOccupation} onChange={(e) => handleEditChange('preferredOccupation', e.target.value)}>
              <option value="any">Any occupation</option>
              <option value="student">Students</option>
              <option value="working professional">Working professionals</option>
              <option value="looking for job">Looking for job</option>
            </select>
            <input className="clx-input" type="number" value={editData.preferredBudgetMin} onChange={(e) => handleEditChange('preferredBudgetMin', e.target.value)} placeholder="Preferred budget min ₹" />
            <input className="clx-input" type="number" value={editData.preferredBudgetMax} onChange={(e) => handleEditChange('preferredBudgetMax', e.target.value)} placeholder="Preferred budget max ₹" />
            <textarea className="clx-input md:col-span-2" rows="2" value={editData.preferenceNotes} onChange={(e) => handleEditChange('preferenceNotes', e.target.value)} placeholder="Preference notes" />

            <select className="clx-input" value={editData.allocationStatus} onChange={(e) => handleEditChange('allocationStatus', e.target.value)}>
              <option value="available">Available</option>
              <option value="booked">Booked / reserved</option>
              <option value="rented">Already rented</option>
              <option value="allocated">Allocated</option>
            </select>
            {editData.allocationStatus !== 'available' && (
              <div className="grid grid-cols-2 gap-3">
                <input className="clx-input" type="number" min="1" value={editData.allocationDurationValue} onChange={(e) => handleEditChange('allocationDurationValue', e.target.value)} placeholder="Duration" />
                <select className="clx-input" value={editData.allocationDurationUnit} onChange={(e) => handleEditChange('allocationDurationUnit', e.target.value)}>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            )}
          </div>

          <button type="submit" disabled={saving} className="clx-button-primary mt-6 w-full disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Listing'}
          </button>
        </form>
      )}

      {/* Hero Image */}
      <div className="relative h-72 w-full overflow-hidden rounded-3xl border border-gray-100 shadow-sm md:h-96">
        <img 
          src={roomImage} 
          alt={room.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/20 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm sm:inset-x-auto sm:left-6 sm:px-6">
          <h1 className="text-xl font-extrabold text-gray-900 sm:text-2xl">{room.title}</h1>
          <p className="text-gray-600 font-bold flex items-center gap-2 mt-1">
            <span>📍 {room.location}</span>
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Room Info (Takes up 2/3 space) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Details Bar */}
          <div className="flex flex-wrap gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex-1 min-w-[120px]">
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Monthly Rent</p>
              <p className="text-2xl font-extrabold text-blue-600">₹{room.rent}<span className="text-lg text-gray-500 font-medium">/mo</span></p>
            </div>
            <div className="flex-1 min-w-[120px] border-t border-gray-100 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Move-in Date</p>
              <p className="text-xl font-bold text-gray-900">{room.availableFrom || 'Immediate'}</p>
            </div>
            <div className="flex-1 min-w-[120px] border-t border-gray-100 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Lease Term</p>
              <p className="text-xl font-bold text-gray-900">{room.leaseTerm || '6+ Months'}</p>
            </div>
            <div className="flex-1 min-w-[120px] border-t border-gray-100 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Status</p>
              <p className={`text-xl font-bold ${isRoomTaken(allocation) ? 'text-amber-600' : 'text-emerald-600'}`}>
                {getAvailabilityLabel(allocation)}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-extrabold text-gray-900 mb-4">About the Space</h3>
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
              {room.description || "A beautiful, sunlit room in a quiet neighborhood. Perfect for a student or working professional looking for a peaceful environment."}
            </p>
            
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-8 mb-3">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {room.amenities?.map((amenity, idx) => (
                <span key={idx} className="px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-xl font-bold border border-blue-100">
                  {amenity}
                </span>
              ))}
            </div>
          </div>

          {/* House Rules & Preferences */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-extrabold text-gray-900 mb-4">House Rules & Vibe</h3>
            <div className="flex flex-wrap gap-3">
              <span className={`px-4 py-2 rounded-xl text-sm font-bold uppercase ${room.rules?.smoking ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {room.rules?.smoking ? '🚬 Smoking Allowed' : '🚭 No Smoking'}
              </span>
              <span className={`px-4 py-2 rounded-xl text-sm font-bold uppercase ${room.rules?.pets ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                {room.rules?.pets ? '🐾 Pets Allowed' : '🚫 No Pets'}
              </span>
              <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-bold uppercase">
                🍲 {room.rules?.dietary || 'Any Diet'}
              </span>
            </div>

            <h3 className="mt-8 text-xl font-extrabold text-gray-900 mb-4">Owner Preferences for Renters</h3>
            <div className="flex flex-wrap gap-3">
              {preferenceChips.map((chip) => (
                <span key={chip} className="rounded-xl bg-cyan-50 px-4 py-2 text-sm font-bold uppercase text-cyan-700">
                  {chip}
                </span>
              ))}
            </div>
            {renterPreferences.notes && (
              <p className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm font-semibold text-slate-600">
                {renterPreferences.notes}
              </p>
            )}
          </div>

        </div>

        {/* Right Column: Poster Details & Actions (Takes up 1/3 space) */}
        <div className="space-y-6">
          
          {/* Lister Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
            
            {/* Match Badge */}
            {room.poster?.match && (
              <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1.5 rounded-bl-xl font-extrabold text-sm shadow-sm">
                {room.poster.match}% Match
              </div>
            )}

            {posterProfileImage ? (
              <img
                src={posterProfileImage}
                alt={`${posterName} profile`}
                className="mb-4 mt-2 h-24 w-24 rounded-full object-cover shadow-md ring-4 ring-white"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-extrabold shadow-md mb-4 mt-2">
                {posterName.charAt(0)}
              </div>
            )}
            
            <h3 className="text-xl font-bold text-gray-900">{posterName}</h3>
            <p className="text-gray-500 font-medium text-sm mt-1">{room.poster?.role || 'Lister'}</p>
            
            <div className="mt-6 grid w-full grid-cols-2 gap-3">
              <button
                onClick={onToggleShortlist}
                className={`w-full rounded-xl py-2.5 font-bold transition ${
                  isShortlisted ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {isShortlisted ? 'Shortlisted' : 'Shortlist'}
              </button>
              <button
                onClick={onToggleLike}
                className={`w-full rounded-xl py-2.5 font-bold transition ${
                  isLiked ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {isLiked ? 'Liked' : 'Like'}
              </button>
              <button 
                onClick={() => onMessageClick({
                  _id: posterId,
                  id: posterId,
                  displayName: room.poster?.name || posterName,
                  name: room.poster?.name || posterName,
                  email: room.poster?.email
                })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow-md"
              >
                💬 Message
              </button>
              <button 
                onClick={() => onViewPosterProfile(room.poster)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-2.5 rounded-xl transition"
              >
                View Profile
              </button>
            </div>
          </div>

          {/* Trust Center / Reviews */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-extrabold text-gray-900 mb-4">Trust Center</h3>
            <div className="flex items-center gap-3 mb-4">
              <span className="p-2 bg-green-100 rounded-xl text-green-700 font-bold">✓</span>
              <span className="font-bold text-gray-700">Lister profile shared</span>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
               <div className="flex items-center justify-between mb-2">
                 <h4 className="font-bold text-gray-900">Lister Reviews</h4>
                 <div className="flex items-center text-yellow-400 text-sm">
                    ★★★★★ <span className="text-gray-500 font-medium ml-1">(4)</span>
                 </div>
               </div>
               <p className="text-sm text-gray-600 italic">"Great roommate, keeps the shared spaces very clean!"</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
