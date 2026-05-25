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

const MatchCard = ({ matchUser, onViewProfile }) => {
  const displayName = getDisplayName(matchUser.userId);

  return (
    <div className="clx-panel p-6 hover:shadow-md transition flex flex-col items-center text-center">
      {renderMatchAvatar(matchUser.userId, displayName)}

      <h3 className="text-xl font-bold text-gray-900">{displayName}</h3>
      <p className="text-gray-500 font-medium text-sm mt-1">
        {matchUser.userId?.age || 'Age not set'} yrs
        {matchUser.city ? ` • ${matchUser.city}` : ''}
      </p>

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
  );
};

const Matches = ({ uid, onViewProfile }) => { // Assume uid is passed as a prop
  const [cityMatches, setCityMatches] = useState([]);
  const [globalMatches, setGlobalMatches] = useState([]);
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
          setCityMatches(data.sameCityMatches || data.matches || []);
          setGlobalMatches(data.globalMatches || []);
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
  const hasMatches = cityMatches.length > 0 || globalMatches.length > 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <h2 className="text-2xl font-extrabold text-gray-900">Your Top Matches</h2>
      
      {!hasMatches ? (
        <p>No matches found yet.</p>
      ) : (
        <>
          <section className="space-y-4">
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">Top Matches in Your City</h3>
              <p className="text-sm font-medium text-gray-500">Same-city roommates are shown first.</p>
            </div>
            {cityMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cityMatches.map((matchUser) => (
                  <MatchCard key={matchUser.userId?._id || matchUser._id} matchUser={matchUser} onViewProfile={onViewProfile} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center font-medium text-gray-500">
                No same-city matches yet.
              </p>
            )}
          </section>

          {globalMatches.length > 0 && (
            <section className="space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Global Matches</h3>
                <p className="text-sm font-medium text-gray-500">Highest compatibility outside your city.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {globalMatches.map((matchUser) => (
                  <MatchCard key={matchUser.userId?._id || matchUser._id} matchUser={matchUser} onViewProfile={onViewProfile} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Matches;
