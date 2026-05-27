const User = require('../models/User');
const Preference = require('../models/Preference');
const Room = require('../models/Room');
const Review = require('../models/Review');
const { extractKeywords, keywordLabels, keywordSimilarity } = require('../services/nlpService');
const { isSameCity, normalizeCityName } = require('../utils/cityUtils');

// --- HELPER FUNCTION: Vector Math ---
const calculateMatchVector = (prefs) => {
    const clean = prefs.cleanliness / 10;
    const sleep = prefs.sleepSchedule / 23;
    const smoking = prefs.smoking ? 1.0 : 0.0;
    const pets = prefs.pets ? 1.0 : 0.0;
    const dietMap = { 'vegan': 0.0, 'veg': 0.2, 'any': 0.5, 'non-veg': 1.0 };
    const diet = dietMap[prefs.dietary] || 0.5;
    return [clean, sleep, smoking, pets, diet];
};

const averageRating = (reviews) => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((total / reviews.length).toFixed(1));
};

const getDisplayName = (user) => (
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'CoLivX User'
);

const buildProfilePayload = async (uid) => {
    const user = await User.findById(uid);
    if (!user) return null;

    const preferences = await Preference.findOne({ userId: uid });
    const postedRooms = await Room.find({ userId: uid }).sort({ createdAt: -1 });
    const reviewsReceived = await Review.find({ targetId: uid, targetType: 'user' }).sort({ createdAt: -1 });
    const reviewsWritten = await Review.find({ reviewerId: uid }).sort({ createdAt: -1 });

    const reviewerIds = reviewsReceived.map(review => review.reviewerId);
    const targetUserIds = reviewsWritten
        .filter(review => review.targetType === 'user')
        .map(review => review.targetId);
    const targetRoomIds = reviewsWritten
        .filter(review => review.targetType === 'room')
        .map(review => review.targetId);

    const [reviewers, targetUsers, targetRooms] = await Promise.all([
        User.find({ _id: { $in: reviewerIds } }),
        User.find({ _id: { $in: targetUserIds } }),
        Room.find({ _id: { $in: targetRoomIds } })
    ]);

    const reviewerMap = new Map(reviewers.map(reviewer => [reviewer._id, reviewer]));
    const targetUserMap = new Map(targetUsers.map(targetUser => [targetUser._id, targetUser]));
    const targetRoomMap = new Map(targetRooms.map(targetRoom => [String(targetRoom._id), targetRoom]));

    const enrichedReviewsReceived = reviewsReceived.map(review => ({
        ...review._doc,
        comment: review.comment || review.text || '',
        reviewerName: reviewerMap.get(review.reviewerId)?.displayName || 'CoLivX User'
    }));

    const enrichedReviewsWritten = reviewsWritten.map(review => {
        const targetName = review.targetType === 'room'
            ? targetRoomMap.get(String(review.targetId))?.title
            : targetUserMap.get(review.targetId)?.displayName;

        return {
            ...review._doc,
            comment: review.comment || review.text || '',
            targetName: targetName || 'CoLivX User'
        };
    });

    return {
        ...user._doc,
        ...(preferences?._doc || {}),
        _id: user._id,
        displayName: getDisplayName(user),
        preferenceId: preferences?._id,
        postedRooms,
        reviewsReceived: enrichedReviewsReceived,
        reviewsWritten: enrichedReviewsWritten,
        trustRating: averageRating(reviewsReceived),
        reviewsCount: reviewsReceived.length
    };
};

// --- 1. SAVE ONBOARDING DATA ---
exports.saveOnboardingData = async (req, res) => {
    try {
        const { 
            uid, email, displayName, age, gender, occupation, city, 
            budget, cleanliness, sleepSchedule, dietary, smoking, pets, 
            hobbies, dealbreakers, locationCoords, bio, genderPreference
        } = req.body;

        // 1. Calculate the Vector + NLP keyword layer
        const vector = calculateMatchVector({
            cleanliness: Number(cleanliness),
            sleepSchedule: Number(sleepSchedule),
            smoking: Boolean(smoking),
            pets: Boolean(pets),
            dietary
        });
        const nlpKeywords = extractKeywords({ bio, hobbies, dealbreakers, dietary, occupation });

        // 2. Upsert Identity
        const safeDisplayName = displayName || email?.split('@')[0] || 'CoLivX User';
        const updatedUser = await User.findByIdAndUpdate(
            uid,
            { email, displayName: safeDisplayName, age, accountStatus: 'active' },
            { upsert: true, new: true, runValidators: true }
        );

        // 3. Upsert Preferences
        const updatedPreferences = await Preference.findOneAndUpdate(
            { userId: uid },
            { 
                gender, genderPreference, occupation, city: normalizeCityName(city), budget, cleanliness,
                sleepSchedule, dietary, smoking, pets, bio, hobbies,
                dealbreakers, locationCoords,
                matchVector: vector,
                nlpKeywords,
                keywordLabels: keywordLabels(nlpKeywords)
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(201).json({ 
            success: true, 
            message: 'Onboarding complete!',
            user: updatedUser,
            preferences: updatedPreferences
        });
    } catch (error) {
        console.error("Error saving onboarding data:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 2. GET USER PROFILE ---
exports.getUserProfile = async (req, res) => {
    try {
        const { uid } = req.params;
        
        const profileData = await buildProfilePayload(uid);

        if (!profileData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            profileData
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.getPublicProfile = async (req, res) => {
    try {
        const { uid } = req.params;
        const profileData = await buildProfilePayload(uid);

        if (!profileData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, profileData });
    } catch (error) {
        console.error("Error fetching public profile:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// --- 3. UPDATE USER FULL PROFILE ---
exports.updateUserFullProfile = async (req, res) => {
    try {
        const {
            uid, email, displayName, age, profileImage, 
            gender, genderPreference, occupation, city, budget, cleanliness, 
            sleepSchedule, dietary, smoking, pets, bio, hobbies, dealbreakers 
        } = req.body;

        // 1. Update Identity
        const existingUser = await User.findById(uid);
        const safeEmail = email || existingUser?.email;
        if (!safeEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email is required to create a profile for this user.'
            });
        }

        const safeDisplayName = displayName || existingUser?.displayName || safeEmail.split('@')[0] || 'CoLivX User';
        const updatedUser = await User.findByIdAndUpdate(
            uid,
            {
                email: safeEmail,
                displayName: safeDisplayName,
                age: Number(age) || existingUser?.age,
                profileImage,
                accountStatus: 'active'
            },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );

        // 2. Calculate the Vector + NLP keyword layer
        const vector = calculateMatchVector({
            cleanliness: Number(cleanliness),
            sleepSchedule: Number(sleepSchedule),
            smoking: Boolean(smoking),
            pets: Boolean(pets),
            dietary
        });
        const nlpKeywords = extractKeywords({ bio, hobbies, dealbreakers, dietary, occupation });

        // 3. Update Preferences
        const updatedPreferences = await Preference.findOneAndUpdate(
            { userId: uid },
            { 
                gender, genderPreference, occupation, city: normalizeCityName(city), budget,
                cleanliness: Number(cleanliness),
                sleepSchedule: Number(sleepSchedule),
                dietary, smoking, pets, bio, hobbies, dealbreakers,
                matchVector: vector,
                nlpKeywords,
                keywordLabels: keywordLabels(nlpKeywords)
            },
            { upsert: true, new: true, runValidators: true }
        );

        const profileData = await buildProfilePayload(uid);

        res.status(200).json({ 
            success: true, 
            profileData: profileData || { ...updatedUser._doc, ...updatedPreferences._doc } 
        });
    } catch (error) {
        console.error("Error updating full profile:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 4. NEW MATCHING ENGINE ---

// Helper: Cosine Similarity Math
const cosineSimilarity = (vecA, vecB) => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
};

exports.getMatches = async (req, res) => {
    try {
        const { uid } = req.params;
        
        // 1. Get current user
        const currentUser = await Preference.findOne({ userId: uid });
        if (!currentUser) return res.status(404).json({ message: "User profile not found" });

        // 2. Find Candidates (has matchVector, isn't current user)
        const candidates = await Preference.find({
            userId: { $ne: uid },
            matchVector: { $exists: true } 
        }).populate('userId', 'displayName age email profileImage');

        // 3. Rank: Calculate Similarity
        const rankedMatches = candidates.map(candidate => {
            const lifestyleScore = cosineSimilarity(currentUser.matchVector, candidate.matchVector);
            const nlpScore = keywordSimilarity(currentUser.nlpKeywords, candidate.nlpKeywords);
            const score = (lifestyleScore * 0.75) + (nlpScore.score * 0.25);
            const candidateUser = candidate.userId?._doc || candidate.userId;
            return {
                ...candidate._doc,
                userId: candidateUser ? {
                    ...candidateUser,
                    displayName: getDisplayName(candidateUser)
                } : candidate.userId,
                matchPercentage: Math.round(score * 100),
                lifestylePercentage: Math.round(lifestyleScore * 100),
                interestPercentage: Math.round(nlpScore.score * 100),
                sharedKeywords: nlpScore.sharedKeywords
            };
        });

        // 4. Sort: Highest first
        rankedMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);

        const currentCity = String(currentUser.city || '').trim();
        const sameCityMatches = rankedMatches.filter(match => isSameCity(currentCity, match.city));
        const globalMatches = rankedMatches.filter(match => !isSameCity(currentCity, match.city));

        res.status(200).json({
            success: true,
            matches: sameCityMatches,
            sameCityMatches,
            globalMatches
        });
    } catch (error) {
        console.error("Match error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.rebuildNlpKeywords = async (req, res) => {
    try {
        const preferences = await Preference.find();

        const updates = await Promise.all(preferences.map((preference) => {
            const nlpKeywords = extractKeywords({
                bio: preference.bio,
                hobbies: preference.hobbies,
                dealbreakers: preference.dealbreakers,
                dietary: preference.dietary,
                occupation: preference.occupation
            });

            preference.nlpKeywords = nlpKeywords;
            preference.keywordLabels = keywordLabels(nlpKeywords);
            return preference.save();
        }));

        res.status(200).json({
            success: true,
            message: 'NLP keywords rebuilt successfully.',
            updatedProfiles: updates.length
        });
    } catch (error) {
        console.error("NLP rebuild error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
