const admin = require('firebase-admin');

// Initialize Firebase Admin using environment variables
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            // Fallback for local development if credentials are set via GOOGLE_APPLICATION_CREDENTIALS
            admin.initializeApp();
        }
        console.log("Firebase Admin initialized successfully");
    } catch (e) {
        console.error("Firebase Admin initialization error:", e);
    }
}

const db = admin.firestore();

module.exports = { db };
