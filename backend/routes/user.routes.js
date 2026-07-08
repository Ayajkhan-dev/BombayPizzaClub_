import express from "express"
import { getCurrentUser, updateUserLocation, updateFcmToken } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"


const userRouter=express.Router()

userRouter.get("/current",isAuth,getCurrentUser)
userRouter.post('/update-location',isAuth,updateUserLocation)
userRouter.post('/update-fcm-token',isAuth,updateFcmToken) // NEW: Firebase Cloud Messaging
export default userRouter