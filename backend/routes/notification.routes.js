import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { getMyNotifications, markNotificationAsRead, markAllNotificationsRead } from "../controllers/notification.controllers.js"

const notificationRouter = express.Router()

notificationRouter.get("/get-my-notifications", isAuth, getMyNotifications)
notificationRouter.post("/mark-as-read/:notificationId", isAuth, markNotificationAsRead)
notificationRouter.post("/mark-all-read", isAuth, markAllNotificationsRead)

export default notificationRouter