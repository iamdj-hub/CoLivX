import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api';

const getDisplayName = (user) => (
  user?.displayName ||
  user?.email?.split('@')?.[0] ||
  'CoLivX User'
);

const renderMatchAvatar = (user, displayName) => {
  if (user?.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt={`${displayName} profile`}
        className="mb-4 h-20 w-20 rounded-full object-cover shadow-sm ring-4 ring-white"
      />
    );
  }

  return (
    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-3xl font-extrabold shadow-sm mb-4">
      {displayName.charAt(0)}
    </div>
  );
};

const Matches = ({ uid, onViewProfile }) => { // Assume uid is passed as a prop
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        // This calls the controller function we just wrote!
        const response = await fetch(`${API_BASE_URL}/api/users/matches/${uid}`);
        const data = await response.json();
        
        if (data.success) {
          setMatches(data.matches);
        }
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [uid]); // Re-run if uid changes

  if (loading) return <div>Loading your perfect roommates...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Your Top Matches</h2>
      
      {matches.length === 0 ? (
        <p>No matches found in your city yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((matchUser) => {
            const displayName = getDisplayName(matchUser.userId);

            return (
            <div key={matchUser.userId?._id || matchUser._id} className="clx-panel p-6 hover:shadow-md transition flex flex-col items-center text-center">
              
              {renderMatchAvatar(matchUser.userId, displayName)}
              
              <h3 className="text-xl font-bold text-gray-900">{displayName}</h3>
              <p className="text-gray-500 font-medium text-sm mt-1">{matchUser.userId?.age || 'Age not set'} yrs</p>
              
              {/* This is the real dynamic score from the backend! */}
              <span className="mt-3 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">
                {matchUser.matchPercentage}% Match
              </span>

              <div className="mt-3 flex gap-2 text-[11px] font-bold">
                <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                  Lifestyle {matchUser.lifestylePercentage ?? matchUser.matchPercentage}%
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                  Interests {matchUser.interestPercentage ?? 0}%
                </span>
              </div>

              {matchUser.sharedKeywords?.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {matchUser.sharedKeywords.slice(0, 4).map((keyword) => (
                    <span key={keyword} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}

              <button 
                onClick={() => onViewProfile(matchUser)} 
                className="mt-6 w-full bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold py-2.5 rounded-xl transition"
              >
                View Profile
              </button>
            </div>
          )})}
        </div>
      )}
    </div>
  );
};

export default Matches;
