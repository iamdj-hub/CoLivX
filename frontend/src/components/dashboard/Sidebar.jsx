const Sidebar = ({
  activeTab,
  handleSidebarClick,
  handleLogout
}) => {
  return (
    <div className="w-64 border-r border-white/70 bg-white/80 shadow-xl shadow-blue-900/10 backdrop-blur flex flex-col justify-between shrink-0">

      <div>
        <div className="p-6">
          <h1 className="clx-gradient-text text-3xl font-black tracking-tight">
            CoLivX.
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">Smart Co-Living</p>
        </div>

        <nav className="mt-2 px-4 space-y-2">
          {[
            { id: 'matches', label: '🤝 Roommate Matches' },
            { id: 'rooms', label: '🏠 Browse Rooms' },
            { id: 'post', label: '📸 Post a Room' },
            { id: 'messages', label: '💬 Messages' },
            { id: 'profile', label: '👤 My Profile' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleSidebarClick(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 font-bold ${
                (activeTab === item.id ||
                  (activeTab === 'publicProfile' && item.id === 'matches'))
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-600 hover:bg-white/80 hover:text-slate-950 hover:shadow-sm'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-3 text-red-600 font-bold rounded-xl bg-red-50/80 hover:bg-red-100 transition-colors"
        >
          Log Out
        </button>
      </div>

    </div>
  );
};

export default Sidebar;
