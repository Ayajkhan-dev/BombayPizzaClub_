import User from "./models/user.model.js"
import jwt from "jsonwebtoken"

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(socket.id)

    socket.on('identity', async ({ userId }) => {
      try {
        const cookieHeader = socket.handshake.headers.cookie || ""
        const tokenMatch = cookieHeader.match(/token=([^;]+)/)
        if (tokenMatch) {
          const token = tokenMatch[1]
          const decoded = jwt.verify(token, process.env.JWT_SECRET)
          const verifiedUserId = decoded.userId
          await User.findByIdAndUpdate(verifiedUserId, {
            socketId: socket.id, isOnline: true
          }, { new: true })
        }
      } catch (error) {
        console.log("Socket identity error:", error.message)
      }
    })

    socket.on('updateLocation', async ({ latitude, longitude }) => {
      try {
        const cookieHeader = socket.handshake.headers.cookie || ""
        const tokenMatch = cookieHeader.match(/token=([^;]+)/)
        if (!tokenMatch) return

        const decoded = jwt.verify(tokenMatch[1], process.env.JWT_SECRET)
        const verifiedUserId = decoded.userId

        const user = await User.findById(verifiedUserId).select("role")

        // Delivery boy ki location hamesha shop wali rahegi
        let finalLat = latitude
        let finalLng = longitude

        if (user?.role === "deliveryBoy") {
          finalLat = parseFloat(process.env.SHOP_LAT)
          finalLng = parseFloat(process.env.SHOP_LNG)
        }

        await User.findByIdAndUpdate(verifiedUserId, {
          isOnline: true,
          socketId: socket.id,
          location: {
            type: 'Point',
            coordinates: [finalLng, finalLat]
          }
        })

        io.emit('updateDeliveryLocation', {
          deliveryBoyId: verifiedUserId,
          latitude: finalLat,
          longitude: finalLng
        })

      } catch (error) {
        console.log('updateLocation error:', error.message)
      }
    })

    socket.on('disconnect', async () => {
      try {
        await User.findOneAndUpdate({ socketId: socket.id }, {
          socketId: null,
          isOnline: false
        })
      } catch (error) {
        console.log(error)
      }
    })
  })
}