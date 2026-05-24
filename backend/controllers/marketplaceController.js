const Room = require('../models/Room');
const Review = require('../models/Review');
const User = require('../models/User');

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const buildGeoPoint = ({ latitude, longitude, locationCoords }) => {
    if (locationCoords?.coordinates?.length === 2) {
        const [lng, lat] = locationCoords.coordinates.map(Number);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return { type: 'Point', coordinates: [lng, lat] };
        }
    }

    const lat = toNumber(latitude);
    const lng = toNumber(longitude);

    if (lat === null || lng === null) return undefined;

    return { type: 'Point', coordinates: [lng, lat] };
};

const haversineKm = ([lngA, latA], [lngB, latB]) => {
    const toRadians = (degree) => degree * (Math.PI / 180);
    const earthRadiusKm = 6371;
    const deltaLat = toRadians(latB - latA);
    const deltaLng = toRadians(lngB - lngA);
    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) *
        Math.sin(deltaLng / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

exports.postRoom = async (req, res) => {
    try {
        const userId = req.body.userId || req.body.uid;
        const title = String(req.body.title || '').trim();
        const location = String(req.body.location || '').trim();
        const rent = toNumber(req.body.rent);

        if (!userId) {
            return res.status(400).json({ success: false, message: 'You must be logged in to post a room.' });
        }

        if (!title) {
            return res.status(400).json({ success: false, message: 'Room title is required.' });
        }

        if (!location) {
            return res.status(400).json({ success: false, message: 'Room location is required.' });
        }

        if (rent === null || rent <= 0) {
            return res.status(400).json({ success: false, message: 'Monthly rent must be greater than 0.' });
        }

        const locationCoords = buildGeoPoint(req.body);
        const amenities = Array.isArray(req.body.amenities)
            ? req.body.amenities
            : String(req.body.amenities || '').split(',');
        const images = Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : [];
        const renterPreferences = req.body.renterPreferences || {};
        const budgetMin = toNumber(renterPreferences.budgetMin) || 0;
        const budgetMax = toNumber(renterPreferences.budgetMax) || 0;

        const newRoom = new Room({
            userId,
            title,
            rent,
            location,
            description: req.body.description || '',
            amenities: amenities.map((amenity) => String(amenity).trim()).filter(Boolean),
            rules: {
                smoking: Boolean(req.body.rules?.smoking),
                pets: Boolean(req.body.rules?.pets),
                dietary: req.body.rules?.dietary || 'any'
            },
            renterPreferences: {
                gender: renterPreferences.gender || 'any',
                occupation: renterPreferences.occupation || 'any',
                budgetMin,
                budgetMax,
                notes: renterPreferences.notes || ''
            },
            images,
            ...(locationCoords ? { locationCoords } : {})
        });
        await newRoom.save();
        res.status(201).json({ success: true, room: newRoom });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllRooms = async (req, res) => {
    try {
        const lat = toNumber(req.query.lat);
        const lng = toNumber(req.query.lng);
        const radiusKm = toNumber(req.query.radiusKm) || 10;
        const hasGeoSearch = req.query.lat !== undefined || req.query.lng !== undefined;

        if (hasGeoSearch && (lat === null || lng === null)) {
            return res.status(400).json({
                success: false,
                message: 'Both valid lat and lng query parameters are required for geospatial search.'
            });
        }

        const query = hasGeoSearch ? {
            locationCoords: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: Math.max(radiusKm, 1) * 1000
                }
            }
        } : {};

        const roomsQuery = Room.find(query);
        if (!hasGeoSearch) {
            roomsQuery.sort({ createdAt: -1 });
        }

        const rooms = await roomsQuery;
        const users = await User.find({ _id: { $in: rooms.map(room => room.userId) } });
        const userMap = new Map(users.map(user => [user._id, user]));
        const enrichedRooms = rooms.map(room => {
            const poster = userMap.get(room.userId);
            const coordinates = room.locationCoords?.coordinates;
            const distanceKm = hasGeoSearch && coordinates?.length === 2
                ? Number(haversineKm([lng, lat], coordinates).toFixed(2))
                : undefined;

            return {
                ...room._doc,
                ...(distanceKm !== undefined ? { distanceKm } : {}),
                posterName: poster?.displayName || 'CoLivX User',
                poster: poster ? {
                    id: poster._id,
                    name: poster.displayName,
                    age: poster.age,
                    email: poster.email,
                    profileImage: poster.profileImage
                } : null
            };
        });

        res.status(200).json({
            success: true,
            rooms: enrichedRooms,
            searchCenter: hasGeoSearch ? { lat, lng, radiusKm } : null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.submitReview = async (req, res) => {
    try {
        const newReview = new Review({
            ...req.body,
            comment: req.body.comment || req.body.text || '',
            text: req.body.text || req.body.comment || ''
        });
        await newReview.save();
        res.status(201).json({ success: true, review: newReview });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
