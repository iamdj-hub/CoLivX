const { getFirebaseAuth } = require('../config/firebaseAdmin');

const extractBearerToken = (req) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && token ? token : null;
};

const createFirebaseAuthMiddleware = ({ verifyIdToken } = {}) => {
    const verifyToken = verifyIdToken || ((token) => getFirebaseAuth().verifyIdToken(token));

    return async (req, res, next) => {
        try {
            const token = extractBearerToken(req);
            if (!token) {
                return res.status(401).json({ success: false, message: 'Authentication token is required.' });
            }

            const decodedToken = await verifyToken(token);
            if (!decodedToken?.uid) {
                return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
            }

            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                decodedToken
            };

            return next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is invalid or expired.'
            });
        }
    };
};

const requireSelfParam = (paramName = 'uid') => (req, res, next) => {
    if (req.user?.uid === req.params[paramName]) return next();

    return res.status(403).json({
        success: false,
        message: 'You can only access your own account.'
    });
};

const requireSelfBody = (fields = ['uid']) => (req, res, next) => {
    const mismatchedField = fields.find((field) => req.body[field] && req.body[field] !== req.user?.uid);
    if (!mismatchedField) return next();

    return res.status(403).json({
        success: false,
        message: `Field ${mismatchedField} must match the authenticated user.`
    });
};

const requireAdmin = (req, res, next) => {
    const adminUids = String(process.env.ADMIN_UIDS || '')
        .split(',')
        .map((uid) => uid.trim())
        .filter(Boolean);

    if (adminUids.includes(req.user?.uid)) return next();

    return res.status(403).json({
        success: false,
        message: 'Admin access is required.'
    });
};

module.exports = {
    createFirebaseAuthMiddleware,
    authenticateFirebase: createFirebaseAuthMiddleware(),
    requireSelfParam,
    requireSelfBody,
    requireAdmin
};
