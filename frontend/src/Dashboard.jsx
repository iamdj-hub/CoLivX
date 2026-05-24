import { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';

// Import our modular components
import Matches from './components/dashboard/Matches';
import PublicProfile from './components/dashboard/PublicProfile';
import Rooms from './components/dashboard/Rooms';
import Profile from './components/dashboard/Profile';
import Messages from './components/dashboard/Messages';
import PostRoom from './components/dashboard/PostRoom';
import Sidebar from './components/dashboard/Sidebar';
import RoomDetails from './components/dashboard/RoomDetails';
import { API_BASE_URL } from './api';

const buildEditFormData = (profileData) => ({
  ...profileData,
  budgetMin: profileData.budget?.min || 500,
  budgetMax: profileData.budget?.max || 2000,
  hobbiesInput: profileData.hobbies ? profileData.hobbies.join(', ') : '',
  dealbreakersInput: profileData.dealbreakers ? profileData.dealbreakers.join(', ') : ''
});

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('matches');

  const [selectedRoom, setSelectedRoom] = useState(null);
  // Core Data States
  const [currentUid, setCurrentUid] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Public Profile & Shortlist States
  const [selectedUser, setSelectedUser] = useState(null);
  const [shortlistedUsers, setShortlistedUsers] = useState([]);
  const [messagingRecipient, setMessagingRecipient] = useState(null);

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const handleToggleShortlist = (userId) => {
    if (!userId) return;
    setShortlistedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) // Remove if already shortlisted
        : [...prev, userId]                // Add if not shortlisted
    );
  };

  const handleViewRoom = (room) => {
  setSelectedRoom(room);
  setActiveTab('roomDetails');
};

// This allows jumping from a Room straight to the Poster's profile!
const handleViewPosterProfile = (posterObj) => {
  setSelectedUser(posterObj);
  setActiveTab('publicProfile');
};

  const handleMessageClick = (recipient) => {
    if (recipient) {
      setMessagingRecipient(recipient);
    } else if (selectedUser?.userId || selectedUser?.id || selectedUser?._id) {
      setMessagingRecipient(selectedUser.userId || selectedUser);
    }
    setActiveTab('messages'); // Teleport to messages tab
  };

  // 1. Fetch User Data on Mount
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        setCurrentUid(user.uid);
        setProfileError('');
        try {
          const res = await axios.get(`${API_BASE_URL}/api/users/profile/${user.uid}`);
          if (res.data.success) {
            setProfileData(res.data.profileData);
          }
        } catch (err) {
          console.error("Failed to fetch profile", err);
          if (err.response?.status === 404) {
            navigate('/profile-setup', { replace: true });
            return;
          }
          setProfileError(`Could not load your saved profile from the deployed backend. Current API: ${API_BASE_URL}`);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login', { replace: true });
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) return;

      // 1. Format strings into Arrays safely
      const formattedHobbies = editFormData.hobbiesInput 
        ? editFormData.hobbiesInput.split(',').map(i => i.trim()).filter(Boolean) 
        : [];
      const formattedDealbreakers = editFormData.dealbreakersInput 
        ? editFormData.dealbreakersInput.split(',').map(i => i.trim()).filter(Boolean) 
        : [];

      // 2. Build a Bulletproof Payload matching our strict backend
      const payload = {
        uid: user.uid,
        email: user.email,
        ...editFormData,
        
        // Ensure dropdowns send a valid ENUM even if the user didn't click them
        gender: editFormData.gender || 'other',
        genderPreference: editFormData.genderPreference || 'any',
        dietary: editFormData.dietary || 'any',
        
        // Repackage budget into the strict Object format MongoDB expects
        budget: { 
          min: Number(editFormData.budgetMin) || 0, 
          max: Number(editFormData.budgetMax) || 0 
        },

        hobbies: formattedHobbies,
        dealbreakers: formattedDealbreakers
      };

      // 3. Send to the Master Route
      const res = await axios.put(`${API_BASE_URL}/api/users/update-profile`, payload);
      
      if (res.data.success) {
        setProfileData(res.data.profileData);
        setEditFormData(buildEditFormData(res.data.profileData));
        setIsEditingProfile(false);
        alert("Profile updated & Math Vector calculated successfully!");
      }
    } catch (error) {
      // PRO-TIP: Log the exact backend error to the browser console
      console.error("Failed to update profile:", error.response?.data?.message || error.message);
      alert(`Error: ${error.response?.data?.message || "Check console for details."}`);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login', { replace: true });
  };

  // Safe tab switching to prevent data leaks between views
  const handleSidebarClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId !== 'publicProfile') setSelectedUser(null);
  };

  // Helper function triggered by the Matches component
  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setActiveTab('publicProfile');
  };

  const handleSetIsEditingProfile = (editing) => {
    if (editing && profileData) {
      setEditFormData(buildEditFormData(profileData));
    }
    setIsEditingProfile(editing);
  };

  // --- UI RENDERER ---
  const renderContent = () => {
    if (loading) return <div className="flex items-center justify-center h-full text-gray-500 font-bold">Loading Dashboard...</div>;
    if (profileError) {
      return (
        <div className="clx-card max-w-2xl p-8">
          <h2 className="text-2xl font-black text-gray-900 mb-3">Backend connection issue</h2>
          <p className="text-gray-700 mb-6">{profileError}</p>
          <div className="flex flex-wrap gap-3">
            <button className="clx-button-primary" onClick={() => window.location.reload()}>
              Try Again
            </button>
            <button className="clx-button-dark" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'matches': 
        return <Matches uid={currentUid} onViewProfile={handleViewProfile} />;
      case 'rooms': 
        return <Rooms onViewRoom={handleViewRoom} />; // <--- Pass prop here
   case 'roomDetails':                             // <--- Add this case
     return (
       <RoomDetails 
         room={selectedRoom} 
         onBack={() => setActiveTab('rooms')} 
         onMessageClick={handleMessageClick}
         onViewPosterProfile={handleViewPosterProfile}
       />
     );
      case 'post': 
        return <PostRoom />;
      case 'messages': 
        return <Messages currentUid={currentUid} initialRecipient={messagingRecipient} />;
      case 'publicProfile': 
        return  (<PublicProfile 
            user={selectedUser} 
            isShortlisted={shortlistedUsers.includes(selectedUser?.userId?._id || selectedUser?.id)}
            onToggleShortlist={() => handleToggleShortlist(selectedUser?.userId?._id || selectedUser?.id)}
            onMessageClick={handleMessageClick}
          />
        );
      case 'profile': 
        return <Profile 
                 profileData={profileData} 
                 setProfileData={setProfileData}
                 isEditingProfile={isEditingProfile} 
                 setIsEditingProfile={handleSetIsEditingProfile} 
                 editFormData={editFormData} 
                 setEditFormData={setEditFormData} 
                 handleUpdateProfile={handleUpdateProfile} 
               />;
      default: 
        return <Matches uid={currentUid} onViewProfile={handleViewProfile} />;
    }
  };

  return (
    <div className="clx-dashboard-bg flex min-h-dvh flex-col font-sans md:h-screen md:flex-row md:overflow-hidden">
      
      {/* MODULAR SIDEBAR */}
      <Sidebar 
        activeTab={activeTab} 
        handleSidebarClick={handleSidebarClick} 
        handleLogout={handleLogout} 
      />

      {/* MAIN CONTENT AREA */}
      <div className="relative flex-1 overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8 md:pb-8">
        {renderContent()}
      </div>
      
    </div>
  );
};

export default Dashboard;
