import axios from 'axios'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { serverUrl } from '../App'
import { addNotification, setNotifications } from '../redux/notificationSlice'
import { messaging } from '../../firebase'
import { getToken, onMessage } from 'firebase/messaging'

function useNotifications() {
    const dispatch = useDispatch()
    const { userData, socket } = useSelector(state => state.user)

    const handledOrderIds = useRef(new Set())
    const pendingSocketTimers = useRef(new Map())

    const playNotificationSound = () => {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext
            const audioCtx = new AudioContextClass()
            const oscillator = audioCtx.createOscillator()
            const gainNode = audioCtx.createGain()

            oscillator.type = 'sine'
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
            oscillator.frequency.setValueAtTime(660, audioCtx.currentTime + 0.15)

            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4)

            oscillator.connect(gainNode)
            gainNode.connect(audioCtx.destination)

            oscillator.start(audioCtx.currentTime)
            oscillator.stop(audioCtx.currentTime + 0.4)
        } catch (error) {
            console.log("notification sound error", error)
        }
    }

    useEffect(() => {
        if (userData?.role !== "owner" || !messaging) return

        const setupFcm = async () => {
            try {
                if (!("Notification" in window)) return

                let permission = Notification.permission
                if (permission === "default") {
                    permission = await Notification.requestPermission()
                }
                if (permission !== "granted") return

                const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")

                const fcmToken = await getToken(messaging, {
                    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                    serviceWorkerRegistration: registration
                })

                if (fcmToken) {
                    await axios.post(`${serverUrl}/api/user/update-fcm-token`, { fcmToken }, { withCredentials: true })
                }
            } catch (error) {
                console.log("[FCM] setup error:", error)
            }
        }

        setupFcm()
    }, [userData?.role, userData?._id])

    useEffect(() => {
        if (userData?.role !== "owner" || !messaging) return

        const unsubscribe = onMessage(messaging, (payload) => {
            const orderId = payload.data?.orderId
            if (!orderId || handledOrderIds.current.has(orderId)) return
            handledOrderIds.current.add(orderId)

            if (pendingSocketTimers.current.has(orderId)) {
                clearTimeout(pendingSocketTimers.current.get(orderId))
                pendingSocketTimers.current.delete(orderId)
            }

            // FIX: ab payload.data se title/body/customerName/amount aayenge
            // (payload.notification se nahi), kyunki backend ab data-only bhejta hai
            const bodyText = payload.data?.body || ""
            const [customerNamePart, amountPart] = bodyText.split(' • ₹')

            dispatch(addNotification({
                _id: payload.data?.notificationId || orderId,
                title: payload.data?.title || "New order received",
                customerName: customerNamePart || "Customer",
                orderId,
                orderAmount: amountPart ? Number(amountPart) : 0,
                createdAt: new Date().toISOString(),
                isRead: false
            }))
            playNotificationSound()
        })

        return () => unsubscribe()
    }, [userData?.role, userData?._id])

    useEffect(() => {
        if (userData?.role !== "owner") return

        const fetchNotifications = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/notification/get-my-notifications`, { withCredentials: true })
                dispatch(setNotifications(result.data))
            } catch (error) {
                console.log("fetch notifications error", error)
            }
        }
        fetchNotifications()
    }, [userData?._id])

    useEffect(() => {
        if (!socket || userData?.role !== "owner") return

        const handleNewOrderNotification = (data) => {
            const orderId = data.orderId
            if (!orderId || handledOrderIds.current.has(orderId)) return

            const timerId = setTimeout(() => {
                if (handledOrderIds.current.has(orderId)) {
                    pendingSocketTimers.current.delete(orderId)
                    return
                }
                handledOrderIds.current.add(orderId)
                pendingSocketTimers.current.delete(orderId)

                dispatch(addNotification(data))
                playNotificationSound()
            }, 2000)

            pendingSocketTimers.current.set(orderId, timerId)
        }

        socket.on('newOrderNotification', handleNewOrderNotification)

        return () => {
            socket.off('newOrderNotification', handleNewOrderNotification)
            pendingSocketTimers.current.forEach(timerId => clearTimeout(timerId))
            pendingSocketTimers.current.clear()
        }
    }, [socket, userData?._id])
}

export default useNotifications