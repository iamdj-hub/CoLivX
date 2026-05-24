const RoomDetails = ({ 
  room, 
  onBack, 
  onMessageClick, 
  onViewPosterProfile 
}) => {
  if (!room) return null;
  const roomImage = room.images?.[0] || room.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
  const posterName = room.posterName || 'CoLivX User';
  const posterId = room.poster?.id || room.userId;

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
      </div>

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
              <p className="text-2xl font-extrabold text-blue-600">${room.rent}<span className="text-lg text-gray-500 font-medium">/mo</span></p>
            </div>
            <div className="flex-1 min-w-[120px] border-t border-gray-100 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Move-in Date</p>
              <p className="text-xl font-bold text-gray-900">{room.availableFrom || 'Immediate'}</p>
            </div>
            <div className="flex-1 min-w-[120px] border-t border-gray-100 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Lease Term</p>
              <p className="text-xl font-bold text-gray-900">{room.leaseTerm || '6+ Months'}</p>
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

            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-extrabold shadow-md mb-4 mt-2">
              {posterName.charAt(0)}
            </div>
            
            <h3 className="text-xl font-bold text-gray-900">{posterName}</h3>
            <p className="text-gray-500 font-medium text-sm mt-1">{room.poster?.role || 'Lister'}</p>
            
            <div className="w-full grid grid-cols-2 gap-3 mt-6">
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
