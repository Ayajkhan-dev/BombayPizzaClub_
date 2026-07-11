import DeliveryAssignment from "../models/deliveryAssignment.model.js"
import Order from "../models/order.model.js"
import User from "../models/user.model.js"
import Item from "../models/item.model.js"
import Notification from "../models/notification.model.js"
import { messaging } from "../utils/firebaseAdmin.js"
import { sendDeliveryOtpMail } from "../utils/mail.js"
import RazorPay from "razorpay"
import crypto from "crypto"
import dotenv from "dotenv"

dotenv.config()

let instance = new RazorPay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ===== Order Notification System + FCM helper =====
// ===== Order Notification System + FCM helper =====
async function createOrderNotifications(io, order) {
    for (const shopOrder of order.shopOrders) {
        const ownerId = shopOrder.owner?._id || shopOrder.owner
        if (!ownerId) continue

        const notification = await Notification.create({
            owner: ownerId,
            order: order._id,
            shopOrderId: shopOrder._id,
            title: "New order received on Bombay Pizza Club",
            customerName: order.user?.fullName || "Customer",
            orderAmount: shopOrder.subtotal || 0
        })

        const ownerSocketId = shopOrder.owner?.socketId
        if (ownerSocketId) {
            io.to(ownerSocketId).emit('newOrderNotification', {
                _id: notification._id,
                title: notification.title,
                customerName: notification.customerName,
                orderId: order._id,
                shopOrderId: shopOrder._id,
                orderAmount: notification.orderAmount,
                createdAt: notification.createdAt,
                isRead: false
            })
        }

        try {
            const ownerUser = await User.findById(ownerId).select("fcmToken")
            if (messaging && ownerUser?.fcmToken) {
                await messaging.send({
                    token: ownerUser.fcmToken,
                    // FIX: title/body ab "data" ke andar hain, "notification" field
                    // mein nahi - warna Firebase khud automatically ek popup dikhata
                    // hai, aur humara service worker bhi dikhata hai -> 2 notifications
                    // ban jaati thi same order ke liye. "data" object mein bhejne se
                    // hum poori tarah control mein rehte hain, sirf ek popup aayega.
                    data: {
                        title: "New order received on Bombay Pizza Club",
                        body: `${notification.customerName} • ₹${notification.orderAmount}`,
                        orderId: String(order._id),
                        notificationId: String(notification._id)
                    },
                    webpush: {
                        fcmOptions: { link: "/my-orders" }
                    }
                })
            }
        } catch (fcmErr) {
            console.log(`fcm push error: ${fcmErr}`)
            // FIX: agar token invalid/expired/unregistered ho gaya hai (mobile pe
            // common hai - browser token rotate kar deta hai), to use DB se hata do.
            // Warna ye hamesha ke liye stuck reh jaata hai aur future ke saare
            // notifications isi dead token pe silently fail hote rahenge.
            const code = fcmErr?.errorInfo?.code || fcmErr?.code || ""
            if (
                code.includes("registration-token-not-registered") ||
                code.includes("invalid-argument") ||
                code.includes("invalid-registration-token")
            ) {
                await User.findByIdAndUpdate(ownerId, { $unset: { fcmToken: "" } })
            }
        }
    }
}
// Haversine formula
function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

export const placeOrder = async (req, res) => {
    try {
        const { cartItems, paymentMethod, deliveryAddress } = req.body

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "cart is empty" })
        }
        if (!deliveryAddress?.text || !deliveryAddress?.latitude || !deliveryAddress?.longitude) {
            return res.status(400).json({ message: "send complete deliveryAddress" })
        }
        if (!["cod", "online"].includes(paymentMethod)) {
            return res.status(400).json({ message: "invalid payment method" })
        }

        // Delivery range check
        const shopLat = parseFloat(process.env.SHOP_LAT)
        const shopLng = parseFloat(process.env.SHOP_LNG)
        const deliveryRadiusKm = parseFloat(process.env.DELIVERY_RADIUS_KM) || 3

        if (!isNaN(shopLat) && !isNaN(shopLng)) {
            const userLat = parseFloat(deliveryAddress.latitude)
            const userLng = parseFloat(deliveryAddress.longitude)
            const distanceKm = haversineDistance(shopLat, shopLng, userLat, userLng)
            if (distanceKm > deliveryRadiusKm) {
                return res.status(400).json({
                    message: `Your location is outside our delivery range. Orders can only be placed within ${deliveryRadiusKm} km of the shop.`,
                    distanceKm: distanceKm.toFixed(2),
                    outsideRange: true
                })
            }
        }

        const groupItemsByOwner = {}
        for (const cartItem of cartItems) {
            const ownerId = cartItem.owner
            if (!ownerId || ownerId === "undefined" || ownerId === "null") continue

            const qty = parseInt(cartItem.quantity)
            if (!qty || qty < 1 || qty > 50) {
                return res.status(400).json({ message: "Invalid quantity in cart" })
            }

            const dbItem = await Item.findById(cartItem.id || cartItem._id)
            if (!dbItem) {
                return res.status(400).json({ message: `Item not found: ${cartItem.name}` })
            }

            if (!groupItemsByOwner[ownerId]) groupItemsByOwner[ownerId] = []
            groupItemsByOwner[ownerId].push({
                id: dbItem._id,
                name: dbItem.name,
                price: dbItem.price,
                quantity: qty,
                owner: ownerId
            })
        }

        if (Object.keys(groupItemsByOwner).length === 0) {
            return res.status(400).json({ message: "Unable to process order. Please clear cart and add items again." })
        }

        const shopOrders = await Promise.all(Object.keys(groupItemsByOwner).map(async (ownerId) => {
            const owner = await User.findById(ownerId)
            if (!owner) return res.status(400).json({ message: "owner not found" })
            const items = groupItemsByOwner[ownerId]
            const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
            return {
                owner: owner._id,
                subtotal,
                shopOrderItems: items.map((i) => ({
                    item: i.id,
                    price: i.price,
                    quantity: i.quantity,
                    name: i.name
                }))
            }
        }))

        const totalAmount = shopOrders.reduce((sum, so) => sum + so.subtotal, 0)

        if (totalAmount <= 0) {
            return res.status(400).json({ message: "Invalid order amount" })
        }

        if (paymentMethod === "online") {
            const razorOrder = await instance.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: 'INR',
                receipt: `receipt_${Date.now()}`
            })
            const newOrder = await Order.create({
                user: req.userId,
                paymentMethod,
                deliveryAddress,
                totalAmount,
                shopOrders,
                razorpayOrderId: razorOrder.id,
                payment: false
            })
            return res.status(200).json({ razorOrder, orderId: newOrder._id })
        }

        const newOrder = await Order.create({
            user: req.userId,
            paymentMethod,
            deliveryAddress,
            totalAmount,
            shopOrders
        })

        await newOrder.populate("shopOrders.shopOrderItems.item", "name image price")
        await newOrder.populate("shopOrders.owner", "fullName socketId")
        await newOrder.populate("user", "fullName email mobile")

        const io = req.app.get('io')
        if (io) {
            newOrder.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder.owner.socketId
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('newOrder', {
                        _id: newOrder._id,
                        paymentMethod: newOrder.paymentMethod,
                        user: newOrder.user,
                        shopOrders: shopOrder,
                        createdAt: newOrder.createdAt,
                        deliveryAddress: newOrder.deliveryAddress,
                        payment: newOrder.payment
                    })
                }
            })
            try {
                await createOrderNotifications(io, newOrder)
            } catch (notifyErr) {
                console.log(`notification create error: ${notifyErr}`)
            }
        }

        return res.status(201).json(newOrder)
    } catch (error) {
        return res.status(500).json({ message: "place order error" })
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex")

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Invalid payment signature" })
        }

        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(400).json({ message: "order not found" })
        }

        if (order.payment === true) {
            return res.status(400).json({ message: "Order already paid" })
        }

        const alreadyUsed = await Order.findOne({ razorpayPaymentId: razorpay_payment_id })
        if (alreadyUsed) {
            return res.status(400).json({ message: "Payment already used" })
        }

        if (order.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({ message: "Order ID mismatch" })
        }

        order.payment = true
        order.razorpayPaymentId = razorpay_payment_id
        await order.save()

        await order.populate("shopOrders.shopOrderItems.item", "name image price")
        await order.populate("shopOrders.owner", "fullName socketId")
        await order.populate("user", "fullName email mobile")

        const io = req.app.get('io')
        if (io) {
            order.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder.owner.socketId
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('newOrder', {
                        _id: order._id,
                        paymentMethod: order.paymentMethod,
                        user: order.user,
                        shopOrders: shopOrder,
                        createdAt: order.createdAt,
                        deliveryAddress: order.deliveryAddress,
                        payment: order.payment
                    })
                }
            })
            try {
                await createOrderNotifications(io, order)
            } catch (notifyErr) {
                console.log(`notification create error: ${notifyErr}`)
            }
        }

        return res.status(200).json(order)
    } catch (error) {
        return res.status(500).json({ message: "verify payment error" })
    }
}

export const getMyOrders = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (user.role === "user") {
            const orders = await Order.find({ user: req.userId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.owner", "fullName email mobile")
                .populate("shopOrders.shopOrderItems.item", "name image price")
            return res.status(200).json(orders)
        } else if (user.role === "owner") {
            const orders = await Order.find({ "shopOrders.owner": req.userId })
                .sort({ createdAt: -1 })
                .populate("user")
                .populate("shopOrders.shopOrderItems.item", "name image price")
                .populate("shopOrders.assignedDeliveryBoy", "fullName mobile")

            const filteredOrders = orders.map((order) => ({
                _id: order._id,
                paymentMethod: order.paymentMethod,
                user: order.user,
                shopOrders: order.shopOrders.find(o => o.owner._id == req.userId),
                createdAt: order.createdAt,
                deliveryAddress: order.deliveryAddress,
                payment: order.payment
            }))
            return res.status(200).json(filteredOrders)
        }
    } catch (error) {
        return res.status(500).json({ message: "get order error" })
    }
}

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, ownerId } = req.params
        const { status } = req.body

        if (req.userId !== ownerId) {
            return res.status(403).json({ message: "Unauthorized" })
        }
        const requestingUser = await User.findById(req.userId).select("role")
        if (!requestingUser || requestingUser.role !== "owner") {
            return res.status(403).json({ message: "Only owners can update order status" })
        }

        const order = await Order.findById(orderId)
        if (!order) return res.status(400).json({ message: "order not found" })

        const shopOrder = order.shopOrders.find(o => o.owner.toString() === ownerId)
        if (!shopOrder) {
            return res.status(400).json({ message: "shop order not found" })
        }

        // Delivery boy assignment/broadcast system removed - owner ab directly
        // status change karta hai, koi automatic delivery boy assignment nahi hoti.
        shopOrder.status = status
        if (status === "delivered" && !shopOrder.deliveredAt) {
            shopOrder.deliveredAt = new Date()
        }

        await order.save()
        const updatedShopOrder = order.shopOrders.find(o => o.owner.toString() === ownerId)
        await order.populate("shopOrders.owner", "fullName")
        await order.populate("shopOrders.assignedDeliveryBoy", "fullName email mobile")
        await order.populate("user", "socketId")

        const io = req.app.get('io')
        if (io) {
            const userSocketId = order.user.socketId
            if (userSocketId) {
                io.to(userSocketId).emit('update-status', {
                    orderId: order._id,
                    ownerId: updatedShopOrder.owner._id || updatedShopOrder.owner,
                    status: updatedShopOrder.status,
                    userId: order.user._id
                })
            }
        }

        return res.status(200).json({
            shopOrder: updatedShopOrder
        })
    } catch (error) {
        return res.status(500).json({ message: "order status error" })
    }
}

export const getDeliveryBoyAssignment = async (req, res) => {
    try {
        const deliveryBoyId = req.userId
        const assignments = await DeliveryAssignment.find({
            brodcastedTo: deliveryBoyId,
            status: "brodcasted"
        })
            .populate("order")
            .populate("owner", "fullName")

        const formated = assignments.map(a => ({
            assignmentId: a._id,
            orderId: a.order._id,
            ownerName: a.owner.fullName,
            deliveryAddress: a.order.deliveryAddress,
            items: a.order.shopOrders.find(so => so._id.equals(a.shopOrderId)).shopOrderItems || [],
            subtotal: a.order.shopOrders.find(so => so._id.equals(a.shopOrderId))?.subtotal
        }))

        return res.status(200).json(formated)
    } catch (error) {
        return res.status(500).json({ message: "get Assignment error" })
    }
}

export const acceptOrder = async (req, res) => {
    try {
        const { assignmentId } = req.params
        const assignment = await DeliveryAssignment.findById(assignmentId)
        if (!assignment) return res.status(400).json({ message: "assignment not found" })
        if (assignment.status !== "brodcasted") {
            return res.status(400).json({ message: "assignment is expired" })
        }

        const isBroadcasted = assignment.brodcastedTo.some(id => id.toString() === req.userId)
        if (!isBroadcasted) {
            return res.status(403).json({ message: "Unauthorized" })
        }

        const alreadyAssigned = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: { $nin: ["brodcasted", "completed"] }
        })
        if (alreadyAssigned) {
            return res.status(400).json({ message: "You are already assigned to another order" })
        }

        assignment.assignedTo = req.userId
        assignment.status = 'assigned'
        assignment.acceptedAt = new Date()
        await assignment.save()

        const order = await Order.findById(assignment.order)
        if (!order) return res.status(400).json({ message: "order not found" })

        let shopOrder = order.shopOrders.id(assignment.shopOrderId)
        shopOrder.assignedDeliveryBoy = req.userId
        await order.save()

        return res.status(200).json({ message: 'order accepted' })
    } catch (error) {
        return res.status(500).json({ message: "accept order error" })
    }
}

export const getCurrentOrder = async (req, res) => {
    try {
        const assignment = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: "assigned"
        })
            .populate("owner", "fullName email mobile")
            .populate("assignedTo", "fullName email mobile location")
            .populate({
                path: "order",
                populate: [{ path: "user", select: "fullName email location mobile" }]
            })

        if (!assignment) return res.status(400).json({ message: "assignment not found" })
        if (!assignment.order) return res.status(400).json({ message: "order not found" })

        const shopOrder = assignment.order.shopOrders.find(so => String(so._id) === String(assignment.shopOrderId))
        if (!shopOrder) return res.status(400).json({ message: "shopOrder not found" })

        let deliveryBoyLocation = { lat: null, lon: null }
        if (assignment.assignedTo.location.coordinates.length === 2) {
            deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1]
            deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0]
        }

        let customerLocation = { lat: null, lon: null }
        if (assignment.order.deliveryAddress) {
            customerLocation.lat = assignment.order.deliveryAddress.latitude
            customerLocation.lon = assignment.order.deliveryAddress.longitude
        }

        return res.status(200).json({
            _id: assignment.order._id,
            user: assignment.order.user,
            shopOrder,
            deliveryAddress: assignment.order.deliveryAddress,
            deliveryBoyLocation,
            customerLocation
        })
    } catch (error) {
        return res.status(500).json({ message: "get current order error" })
    }
}

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params
        const order = await Order.findById(orderId)
            .populate("user")
            .populate({ path: "shopOrders.owner", model: "User", select: "fullName email mobile" })
            .populate({ path: "shopOrders.assignedDeliveryBoy", model: "User" })
            .populate({ path: "shopOrders.shopOrderItems.item", model: "Item" })
            .lean()

        if (!order) return res.status(400).json({ message: "order not found" })

        const isOwner = order.shopOrders.some(so => so.owner?._id?.toString() === req.userId || so.owner?.toString() === req.userId)
        const isUser = order.user?._id?.toString() === req.userId || order.user?.toString() === req.userId

        if (!isOwner && !isUser) {
            return res.status(403).json({ message: "Unauthorized" })
        }

        return res.status(200).json(order)
    } catch (error) {
        return res.status(500).json({ message: "get by id order error" })
    }
}

export const sendDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.body
        const order = await Order.findById(orderId).populate("user")
        const shopOrder = order?.shopOrders.id(shopOrderId)
        if (!order || !shopOrder) {
            return res.status(400).json({ message: "enter valid order/shopOrderid" })
        }

        if (shopOrder.assignedDeliveryBoy?.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized" })
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        shopOrder.deliveryOtp = otp
        shopOrder.otpExpires = Date.now() + 5 * 60 * 1000
        await order.save()
        await sendDeliveryOtpMail(order.user, otp)
        return res.status(200).json({ message: `Otp sent Successfully to ${order?.user?.fullName}` })
    } catch (error) {
        return res.status(500).json({ message: "delivery otp error" })
    }
}

export const verifyDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId, otp } = req.body
        const order = await Order.findById(orderId).populate("user")
        const shopOrder = order?.shopOrders.id(shopOrderId)
        if (!order || !shopOrder) {
            return res.status(400).json({ message: "enter valid order/shopOrderid" })
        }

        if (shopOrder.assignedDeliveryBoy?.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized" })
        }

        if (shopOrder.deliveryOtp !== otp || !shopOrder.otpExpires || shopOrder.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid/Expired Otp" })
        }

        shopOrder.status = "delivered"
        shopOrder.deliveredAt = Date.now()
        await order.save()
        await DeliveryAssignment.deleteOne({
            shopOrderId: shopOrder._id,
            order: order._id,
            assignedTo: shopOrder.assignedDeliveryBoy
        })

        return res.status(200).json({ message: "Order Delivered Successfully!" })
    } catch (error) {
        return res.status(500).json({ message: "verify delivery otp error" })
    }
}

export const getTodayDeliveries = async (req, res) => {
    try {
        const deliveryBoyId = req.userId
        const startsOfDay = new Date()
        startsOfDay.setHours(0, 0, 0, 0)

        const orders = await Order.find({
            "shopOrders.assignedDeliveryBoy": deliveryBoyId,
            "shopOrders.status": "delivered",
            "shopOrders.deliveredAt": { $gte: startsOfDay }
        }).lean()

        let todaysDeliveries = []
        orders.forEach(order => {
            order.shopOrders.forEach(shopOrder => {
                if (shopOrder.assignedDeliveryBoy == deliveryBoyId &&
                    shopOrder.status === "delivered" &&
                    shopOrder.deliveredAt &&
                    shopOrder.deliveredAt >= startsOfDay
                ) {
                    todaysDeliveries.push(shopOrder)
                }
            })
        })

        let stats = {}
        todaysDeliveries.forEach(shopOrder => {
            const hour = new Date(shopOrder.deliveredAt).getHours()
            stats[hour] = (stats[hour] || 0) + 1
        })

        let formattedStats = Object.keys(stats).map(hour => ({
            hour: parseInt(hour),
            count: stats[hour]
        }))
        formattedStats.sort((a, b) => a.hour - b.hour)

        return res.status(200).json(formattedStats)
    } catch (error) {
        return res.status(500).json({ message: "today deliveries error" })
    }
}