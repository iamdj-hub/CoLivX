const admin = require('firebase-admin');

const parseServiceAccount = () => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
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

        admin.initializeApp({
            credential: serviceAccount
                ? admin.credential.cert(serviceAccount)
                : admin.credential.applicationDefault(),
            ...(projectId ? { projectId } : {})
        });
    }

    return admin.auth();
};

module.exports = { getFirebaseAuth };
