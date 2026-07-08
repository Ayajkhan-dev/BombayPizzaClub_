import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice"
import ownerSlice from "./ownerSlice"
import mapSlice from "./mapSlice"
import notificationSlice from "./notificationSlice" // NEW: order notification system
export const store=configureStore({
    reducer:{
        user:userSlice,
        owner:ownerSlice,
        map:mapSlice,
        notification:notificationSlice // NEW: order notification system
    }
})