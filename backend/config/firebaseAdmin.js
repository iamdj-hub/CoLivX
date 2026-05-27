const admin = require('firebase-admin');

const parseServiceAccount = () => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        let serviceAccount;
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        } catch (error) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
        }

        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        return serviceAccount;
    }

    if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
    ) {
        return {
            project_id: process.env.FIREBASE_PROJECT_ID,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        };
    }

    return null;
};

const getFirebaseAuth = () => {
    if (!admin.apps.length) {
        const serviceAccount = parseServiceAccount();
        const projectId = serviceAccount?.project_id || process.env.FIREBASE_PROJECT_ID;

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                ...(projectId ? { projectId } : {})
            });
        } else if (projectId) {
            admin.initializeApp({ projectId });
        } else {
            throw new Error('Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID.');
        }
    }

    return admin.auth();
};

module.exports = { getFirebaseAuth };
