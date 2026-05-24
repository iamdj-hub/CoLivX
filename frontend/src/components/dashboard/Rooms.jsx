import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../api';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getRoomCoordinates = (room) => {
  const coords = room.locationCoords?.coordinates;
  if (!coords || coords.length !== 2) return null;

  return {
    lng: Number(coords[0]),
    lat: Number(coords[1])
  };
};

const RadiusMap = ({ rooms, center }) => {
  if (!center?.lat || !center?.lng) {
    return null;
  }

  const centerLat = toNumber(center.lat);
  const centerLng = toNumber(center.lng);
  const radiusKm = Math.max(toNumber(center.radiusKm) || 10, 1);
  const plottedRooms = rooms
    .map((room) => {
      const coords = getRoomCoordinates(room);
      if (!coords) return null;

      const kmPerLatDegree = 110.574;
      const kmPerLngDegree = 111.32 * Math.cos(centerLat * Math.PI / 180);
      const offsetXKm = (coords.lng - centerLng) * kmPerLngDegree;
      const offsetYKm = (coords.lat - centerLat) * kmPerLatDegree;
      const distanceRatio = Math.sqrt((offsetXKm ** 2) + (offsetYKm ** 2)) / radiusKm;
      const plotRadius = 42;

      return {
        room,
        x: 50 + (offsetXKm / radiusKm) * plotRadius,
        y: 50 - (offsetYKm / radiusKm) * plotRadius,
        inside: distanceRatio <= 1
      };
    })
    .filter(Boolean);

  return (
    <div className="clx-panel overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
        <div className="relative min-h-[360px] bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 p-6">
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: 'linear-gradient(rgba(14,165,233,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.18) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} />
          <svg viewBox="0 0 100 100" className="relative z-10 h-full min-h-[320px] w-full">
            <defs>
              <radialGradient id="radiusFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
              </radialGradient>
            </defs>

            <circle cx="50" cy="50" r="42" fill="url(#radiusFill)" stroke="#0891b2" strokeWidth="0.7" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="28" fill="none" stroke="#67e8f9" strokeWidth="0.35" />
            <circle cx="50" cy="50" r="14" fill="none" stroke="#a7f3d0" strokeWidth="0.35" />

            <line x1="8" y1="50" x2="92" y2="50" stroke="#38bdf8" strokeWidth="0.25" opacity="0.65" />
            <line x1="50" y1="8" x2="50" y2="92" stroke="#38bdf8" strokeWidth="0.25" opacity="0.65" />

            <circle cx="50" cy="50" r="2.6" fill="#0f172a" />
            <text x="50" y="46" textAnchor="middle" fontSize="3" fill="#0f172a" fontWeight="800">You</text>

            {plottedRooms.map(({ room, x, y, inside }) => (
              <g key={room._id || room.id} opacity={inside ? 1 : 0.45}>
                <circle cx={x} cy={y} r="2.6" fill={inside ? '#2563eb' : '#94a3b8'} stroke="white" strokeWidth="0.8" />
                <text x={x} y={y - 4} textAnchor="middle" fontSize="2.6" fill="#0f172a" fontWeight="800">
                  ${room.rent}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="border-l border-cyan-100 bg-white/80 p-6">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-600">2dsphere Radius Map</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{radiusKm} km search circle</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Centered at {centerLat.toFixed(4)}, {centerLng.toFixed(4)}. Pins are plotted from MongoDB GeoJSON coordinates.
          </p>

          <div className="mt-6 space-y-3">
            {plottedRooms.length > 0 ? plottedRooms.slice(0, 5).map(({ room }) => (
              <div key={room._id || room.id} className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-900 truncate">{room.title}</span>
                  <span className="shrink-0 text-xs font-black text-cyan-700">
                    {room.distanceKm !== undefined ? `${room.distanceKm} km` : 'nearby'}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500 truncate">{room.location}</p>
              </div>
            )) : (
              <p className="rounded-xl border border-dashed border-cyan-200 bg-cyan-50/60 p-4 text-sm font-bold text-slate-500">
                Nearby results will appear here when rooms have saved coordinates.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 1. Accept the prop
const Rooms = ({ onViewRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSearchCenter, setActiveSearchCenter] = useState(null);
  const [geoFilters, setGeoFilters] = useState({
    lat: '',
    lng: '',
    radiusKm: 10
  });

  const buildRoomsUrl = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.lat && filters.lng) {
      params.set('lat', filters.lat);
      params.set('lng', filters.lng);
      params.set('radiusKm', filters.radiusKm || 10);
    }

    const query = params.toString();
    return `${API_BASE_URL}/api/rooms${query ? `?${query}` : ''}`;
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(buildRoomsUrl());
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to load rooms.');
        }

        setRooms(data.rooms || []);
        setActiveSearchCenter(data.searchCenter || null);
      } catch (err) {
        console.error('Error loading rooms:', err);
        setError('Could not load room listings. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleGeoSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(buildRoomsUrl(geoFilters));
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load nearby rooms.');
      }

      setRooms(data.rooms || []);
      setActiveSearchCenter(data.searchCenter || {
        lat: Number(geoFilters.lat),
        lng: Number(geoFilters.lng),
        radiusKm: Number(geoFilters.radiusKm) || 10
      });
    } catch (err) {
      console.error('Error loading nearby rooms:', err);
      setError(err.message || 'Could not load nearby rooms.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoFilters((previous) => ({
          ...previous,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6)
        }));
      },
      () => setError('Could not access your current location.')
    );
  };

  const getRoomImage = (room) => (
    room.images?.[0] ||
    room.image ||
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Available Rooms</h2>
          <p className="text-gray-500 font-medium mt-1">Find your perfect space.</p>
        </div>
      </div>

      <form onSubmit={handleGeoSearch} className="clx-panel p-5 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={geoFilters.lat}
            onChange={(e) => setGeoFilters({ ...geoFilters, lat: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="25.7771"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={geoFilters.lng}
            onChange={(e) => setGeoFilters({ ...geoFilters, lng: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="87.4753"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Radius (km)</label>
          <input
            type="number"
            min="1"
            value={geoFilters.radiusKm}
            onChange={(e) => setGeoFilters({ ...geoFilters, radiusKm: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button type="button" onClick={handleUseCurrentLocation} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition">
          Use My Location
        </button>
        <button type="submit" className="clx-button-primary px-4 py-2.5">
          Search Nearby
        </button>
      </form>

      <RadiusMap rooms={rooms} center={activeSearchCenter} />

      {loading && <p className="text-gray-500 font-medium">Loading rooms...</p>}
      {error && <p className="text-red-500 font-medium">{error}</p>}
      {!loading && !error && rooms.length === 0 && (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-500 font-medium">
          No rooms have been posted yet.
        </div>
      )}

      {!loading && !error && rooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rooms.map((room) => (
          
          <div 
            key={room._id || room.id} 
            onClick={() => onViewRoom(room)}
            className="clx-panel overflow-hidden hover:shadow-lg transition group cursor-pointer"
          >
            <div className="h-48 overflow-hidden relative">
              <img src={getRoomImage(room)} alt={room.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg font-extrabold text-gray-900 shadow-sm">
                ${room.rent}<span className="text-sm text-gray-500 font-medium">/mo</span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 font-bold">
                <span>📍 {room.location}</span>
              </div>
              {room.distanceKm !== undefined && (
                <div className="mb-3 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                  {room.distanceKm} km from search center
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-1">{room.title}</h3>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {(room.posterName || 'U').charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-gray-700">Listed by {room.posterName || 'CoLivX User'}</span>
                </div>
                {/* Match Badge Preview */}
                {room.poster?.match && (
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">{room.poster.match}% Match</span>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default Rooms;
