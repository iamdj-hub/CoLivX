import { useEffect, useState } from 'react';
import axios from 'axios';
import { auth } from '../../firebase';
import { API_BASE_URL } from '../../api';

const fetchPublicProfileData = async (profileUid) => {
  const response = await axios.get(`${API_BASE_URL}/api/users/public/${profileUid}`);
  return response.data.success ? response.data.profileData : null;
};

const getNameFromProfile = (profile) => (
  profile?.displayName ||
  profile?.name ||
  profile?.email?.split('@')?.[0] ||
  'CoLivX User'
);

const PublicProfile = ({ 
  user, 
  isShortlisted, 
  onToggleShortlist, 
  onMessageClick 
}) => {
  const [profileData, setProfileData] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const profileUid = user?.userId?._id || user?.id || user?._id;
  const profile = profileData?._id === profileUid ? profileData : user;
  const identity = typeof profile?.userId === 'object' && profile.userId !== null ? profile.userId : profile || {};
  const name = getNameFromProfile(identity) || getNameFromProfile(profile);
  const match = profile?.matchPercentage || user?.matchPercentage || profile?.match || user?.match;
  const role = profile?.occupation || profile?.role || 'Student';
  const cleanLabel = profile?.cleanliness ? `${profile.cleanliness}/10` : (profile?.clean || 'Not set');
  const sleepLabel = profile?.sleepSchedule !== undefined ? `${profile.sleepSchedule}:00` : (profile?.vibe || 'Not set');
  const reviewsReceived = profile?.reviewsReceived || [];
  const reviewsWritten = profile?.reviewsWritten || [];
  const postedRooms = profile?.postedRooms || [];
  const keywordLabels = profile?.keywordLabels || profile?.sharedKeywords || [];
  const trustRating = profile?.trustRating || 0;
  const reviewsCount = profile?.reviewsCount || reviewsReceived.length;
  const isOwnProfile = auth.currentUser?.uid && profileUid === auth.currentUser.uid;

  useEffect(() => {
    let shouldIgnore = false;
    if (!profileUid || String(profileUid).startsWith('p')) return undefined;

    const loadProfile = async () => {
      try {
        const loadedProfile = await fetchPublicProfileData(profileUid);
        if (!shouldIgnore && loadedProfile) {
          setProfileData(loadedProfile);
        }
      } catch (error) {
        console.error('Failed to load public profile:', error);
      }
    };

    loadProfile();
    return () => {
      shouldIgnore = true;
    };
  }, [profileUid]);

  // Failsafe in case no user data is passed
  if (!user) {
    return <div className="p-10 text-center font-bold text-gray-500">No profile selected.</div>;
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setReviewError('Please log in to write a review.');
      return;
    }

    if (!profileUid) {
      setReviewError('This profile cannot receive reviews yet.');
      return;
    }

    if (isOwnProfile) {
      setReviewError('You cannot review your own profile.');
      return;
    }

    try {
      setReviewSubmitting(true);
      await axios.post(`${API_BASE_URL}/api/reviews`, {
        reviewerId: currentUser.uid,
        targetId: profileUid,
        targetType: 'user',
        rating: reviewRating,
        comment: reviewComment
      });

      setReviewComment('');
      setReviewRating(5);
      const loadedProfile = await fetchPublicProfileData(profileUid);
      if (loadedProfile) {
        setProfileData(loadedProfile);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      setReviewError(error.response?.data?.message || 'Could not submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Header & Actions */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        
        {/* Top Right: Shortlist Heart */}
        <div className="absolute top-0 right-0 p-6 flex gap-3">
          <button 
            onClick={onToggleShortlist} 
            className={`flex items-center gap-2 font-bold py-2 px-5 rounded-xl transition border ${
              isShortlisted 
                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {isShortlisted ? '❤️ Shortlisted' : '🤍 Shortlist'}
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-5xl font-extrabold shadow-md">
            {name.charAt(0).toUpperCase()}
          </div>
          
          {/* Identity */}
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              {name}
              {match && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-bold">
                  {match}% Match
                </span>
              )}
            </h2>
            <p className="text-lg text-gray-500 font-medium mt-1">
              {identity.age || 'Age not set'} yrs • {role} • 📍 {profile.city || 'Local Area'}
            </p>
            
            {/* Contact Action Buttons */}
            <div className="flex gap-3 mt-5">
              <button 
                onClick={() => onMessageClick({
                  _id: profileUid,
                  id: profileUid,
                  displayName: name,
                  name,
                  email: identity.email
                })}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md flex items-center gap-2"
              >
                💬 Message
              </button>
              <a 
                href={`mailto:${identity.email || 'user@example.com'}?subject=Saw your profile on CoLivX!`}
                className="bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md flex items-center gap-2"
              >
                ✉️ Email
              </a>
            </div>
          </div>
        </div>
        
        {/* Bio */}
        <div className="mt-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">About Them</h3>
          <p className="text-gray-800 text-lg italic">"{profile.bio || 'Looking for a great roommate to share a space with! Very chill and easy going.'}"</p>
        </div>
      </div>

      {keywordLabels.length > 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-4">NLP Compatibility Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {keywordLabels.map((keyword) => (
              <span key={keyword} className="rounded-full bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-2 text-sm font-bold text-cyan-700 border border-cyan-100">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lifestyle Overview */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-6">Lifestyle Profile</h3>
          
          <div className="mb-6 border-b border-gray-100 pb-4">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-gray-500">Cleanliness Standard</span>
              <span className="font-bold text-blue-600">{cleanLabel}</span>
            </div>
          </div>

          <div className="border-b border-gray-100 pb-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-gray-500">Typical Vibe / Sleep</span>
              <span className="font-bold text-purple-600">{sleepLabel}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {profile.smoking ? (
               <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">🚬 Smoker</span>
            ) : (
               <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">🚭 Non-Smoker</span>
            )}
            
            {profile.pets ? (
               <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase">🐾 Has Pets</span>
            ) : (
               <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase">🚫 No Pets</span>
            )}
          </div>
        </div>

        {/* Trust Center / Verifications */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-6">Profile Reputation</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-green-100 rounded-xl text-green-700 font-bold">✓</span>
              <span className="font-bold text-gray-700">Profile information shared</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-blue-100 rounded-xl text-blue-700 font-bold">💼</span>
              <span className="font-bold text-gray-700">Occupation or student status shared</span>
            </div>
            
            {/* Reviews Preview */}
            <div className="mt-6 pt-6 border-t border-gray-100">
               <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Roommate Reviews</h4>
               <div className="flex items-center gap-2 text-yellow-400 text-lg">
                  {'★'.repeat(Math.round(trustRating || 0))}{'☆'.repeat(5 - Math.round(trustRating || 0))}
                  <span className="text-gray-900 font-bold text-sm ml-2">
                    {trustRating ? `${trustRating}/5` : 'No rating yet'} ({reviewsCount})
                  </span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-extrabold text-gray-900 mb-6">Rooms Posted</h3>
        {postedRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {postedRooms.map((room) => (
              <div key={room._id} className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 truncate">{room.title}</h4>
                <p className="text-blue-600 font-extrabold mt-1">${room.rent}/mo</p>
                <p className="text-gray-500 text-sm mt-1">{room.location}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 font-medium bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
            No rooms posted yet.
          </p>
        )}
      </div>

      {!isOwnProfile && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-4">Write a Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`text-3xl transition ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}
                    aria-label={`${star} star rating`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows="4"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder={`Share your experience with ${name}...`}
            />
            {reviewError && <p className="text-red-500 font-medium">{reviewError}</p>}
            <button
              type="submit"
              disabled={reviewSubmitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl transition"
            >
              {reviewSubmitting ? 'Posting Review...' : 'Post Review'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-6">Reviews Received</h3>
          {reviewsReceived.length > 0 ? (
            <div className="space-y-5">
              {reviewsReceived.map((review) => (
                <div key={review._id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">{review.reviewerName || 'CoLivX User'}</span>
                    <span className="text-yellow-400 text-lg">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </div>
                  <p className="text-gray-600 italic">"{review.comment || review.text || 'No comment added.'}"</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 font-medium bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
              No reviews received yet.
            </p>
          )}
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-6">Reviews Written</h3>
          {reviewsWritten.length > 0 ? (
            <div className="space-y-5">
              {reviewsWritten.map((review) => (
                <div key={review._id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">For: {review.targetName || 'CoLivX User'}</span>
                    <span className="text-yellow-400 text-lg">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </div>
                  <p className="text-gray-600 italic">"{review.comment || review.text || 'No comment added.'}"</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 font-medium bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
              No reviews written yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
