// Firebase Cloud Messaging Service Worker
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js")

firebase.initializeApp({
    apiKey: "PASTE_YOUR_VITE_FIREBASE_APIKEY_HERE",
    authDomain: "bombaypizza-154bf.firebaseapp.com",
    projectId: "bombaypizza-154bf",
    storageBucket: "bombaypizza-154bf.firebasestorage.app",
    messagingSenderId: "750717628048",
    appId: "1:750717628048:web:26a1a75471b119f9f77215"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
    // FIX: title/body ab payload.data se aayenge (payload.notification se nahi),
    // kyunki backend ab "data-only" message bhejta hai. Isse Firebase khud
    // automatically popup nahi banata - sirf yahi manual showNotification() chalta
    // hai, isliye ab sirf EK notification aayegi.
    const notificationTitle = payload.data?.title || "New order received on Bombay Pizza Club"
    const notificationOptions = {
        body: payload.data?.body || "",
        icon: "/vite.svg",
        tag: payload.data?.notificationId,
        data: payload.data
    }
    self.registration.showNotification(notificationTitle, notificationOptions)
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const targetUrl = self.location.origin + "/my-orders"

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('/my-orders') && 'focus' in client) {
                    return client.focus()
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl)
            }
        })
    )
})