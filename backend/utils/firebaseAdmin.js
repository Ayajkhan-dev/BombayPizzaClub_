import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { createRequire } from "module"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const backendRoot = join(__dirname, "..")

let firebaseReady = false
let messaging = null

try {
    let serviceAccount = null

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    } else {
        const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json"
        const fullPath = join(backendRoot, path.replace("./", ""))
        const require = createRequire(import.meta.url)
        serviceAccount = require(fullPath)
    }

    if (getApps().length === 0) {
        initializeApp({
            credential: cert(serviceAccount)
        })
    }

    messaging = getMessaging()
    firebaseReady = true
} catch (error) {
    console.log("⚠️  Firebase Admin not initialized (FCM push notifications disabled).")
    console.log("   REAL ERROR:", error.message)
}

export { messaging }