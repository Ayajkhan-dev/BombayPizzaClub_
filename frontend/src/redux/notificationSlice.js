import { createSlice } from "@reduxjs/toolkit";

// NEW: Order Notification System
const notificationSlice = createSlice({
    name: "notification",
    initialState: {
        notifications: [],
        unreadCount: 0
    },
    reducers: {
        setNotifications: (state, action) => {
            state.notifications = action.payload.notifications
            state.unreadCount = action.payload.unreadCount
        },
        addNotification: (state, action) => {
            state.notifications = [action.payload, ...state.notifications]
            state.unreadCount += 1
        },
        markAsRead: (state, action) => {
            const notification = state.notifications.find(n => n._id === action.payload)
            if (notification && !notification.isRead) {
                notification.isRead = true
                state.unreadCount = Math.max(0, state.unreadCount - 1)
            }
        },
        markAllAsRead: (state) => {
            state.notifications.forEach(n => { n.isRead = true })
            state.unreadCount = 0
        }
    }
})

export const { setNotifications, addNotification, markAsRead, markAllAsRead } = notificationSlice.actions
export default notificationSlice.reducer