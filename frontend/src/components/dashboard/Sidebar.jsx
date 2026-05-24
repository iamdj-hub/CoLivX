const Sidebar = ({
  activeTab,
  handleSidebarClick,
  handleLogout
}) => {
  const navItems = [
    { id: 'matches', label: 'Roommate Matches', shortLabel: 'Matches', icon: '🤝' },
    { id: 'rooms', label: 'Browse Rooms', shortLabel: 'Rooms', icon: '🏠' },
    { id: 'post', label: 'Post a Room', shortLabel: 'Post', icon: '📸' },
    { id: 'messages', label: 'Messages', shortLabel: 'Chat', icon: '💬' },
    { id: 'profile', label: 'My Profile', shortLabel: 'Profile', icon: '👤' }
  ];

  const isActive = (itemId) => (
    activeTab === itemId || (activeTab === 'publicProfile' && itemId === 'matches')
  );

  return (
    <>
      <div className="hidden w-64 shrink-0 flex-col justify-between border-r border-white/70 bg-white/80 shadow-xl shadow-blue-900/10 backdrop-blur md:flex">

        <div>
          <div className="p-6">
            <h1 className="clx-gradient-text text-3xl font-black tracking-tight">
              CoLivX.
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">Smart Co-Living</p>
          </div>

          <nav className="mt-2 space-y-2 px-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSidebarClick(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold transition-all duration-200 ${
                  isActive(item.id)
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-950 hover:shadow-sm'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-gray-100 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-xl bg-red-50/80 px-4 py-3 font-bold text-red-600 transition-colors hover:bg-red-100"
          >
            Log Out
          </button>
        </div>

      </div>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/70 bg-white/90 px-4 py-3 shadow-lg shadow-blue-900/5 backdrop-blur md:hidden">
        <div>
          <h1 className="clx-gradient-text text-2xl font-black tracking-tight">CoLivX.</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Smart Co-Living</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600"
        >
          Log Out
        </button>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-white/70 bg-white/92 p-2 shadow-2xl shadow-blue-900/20 backdrop-blur md:hidden">
        {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSidebarClick(item.id)}
              className={`flex min-w-0 flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-extrabold transition ${
                isActive(item.id)
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-500'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="mt-1 truncate">{item.shortLabel}</span>
            </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
