import User from "../models/user.model.js"

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId
        if (!userId) {
            return res.status(400).json({ message: "userId is not found" })
        }
        // FIX H1: Sensitive fields response mein nahi aane chahiye
        const user = await User.findById(userId).select(
            "-password -resetOtp -otpExpires -isOtpVerified -fcmTokens -socketId"
        )
        if (!user) {
            return res.status(400).json({ message: "user is not found" })
        }
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({ message: "get current user error" })
    }
}

export const updateUserLocation = async (req, res) => {
    try {
        const { lat, lon } = req.body
        const user = await User.findByIdAndUpdate(req.userId, {
            location: {
                type: 'Point',
                coordinates: [lon, lat]
            }
        }, { new: true })
        if (!user) {
            return res.status(400).json({ message: "user is not found" })
        }
        return res.status(200).json({ message: 'location updated' })
    } catch (error) {
        return res.status(500).json({ message: "update location user error" })
    }
}

export const updateFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body
        if (!fcmToken) {
            return res.status(400).json({ message: "fcmToken is required" })
        }
        // FIX: $addToSet se token array mein add hota hai (agar already nahi hai),
        // purane devices ke tokens overwrite/delete nahi hote - isse laptop aur
        // mobile dono ek saath push notification pa sakte hain.
        const user = await User.findByIdAndUpdate(
            req.userId,
            { $addToSet: { fcmTokens: fcmToken } },
            { new: true }
        )
        if (!user) {
            return res.status(400).json({ message: "user is not found" })
        }
        return res.status(200).json({ message: "fcm token saved" })
    } catch (error) {
        return res.status(500).json({ message: "update fcm token error" })
    }
}