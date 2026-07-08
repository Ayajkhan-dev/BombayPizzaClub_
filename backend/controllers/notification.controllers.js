import Notification from "../models/notification.model.js"

export const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ owner: req.userId })
            .sort({ createdAt: -1 })
            .limit(50)

        const unreadCount = await Notification.countDocuments({
            owner: req.userId,
            isRead: false
        })

        return res.status(200).json({ notifications, unreadCount })
    } catch (error) {
        return res.status(500).json({ message: `get notifications error ${error}` })
    }
}

export const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, owner: req.userId },
            { isRead: true },
            { new: true }
        )

        if (!notification) {
            return res.status(404).json({ message: "notification not found" })
        }

        return res.status(200).json(notification)
    } catch (error) {
        return res.status(500).json({ message: `mark as read error ${error}` })
    }
}

export const markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { owner: req.userId, isRead: false },
            { isRead: true }
        )
        return res.status(200).json({ message: "all notifications marked as read" })
    } catch (error) {
        return res.status(500).json({ message: `mark all read error ${error}` })
    }
}