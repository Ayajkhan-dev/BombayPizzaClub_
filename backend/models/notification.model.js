import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    shopOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    title: {
        type: String,
        default: "New order received on Bambay Pizza Club"
    },
    customerName: {
        type: String,
        default: ""
    },
    orderAmount: {
        type: Number,
        default: 0
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

notificationSchema.index({ owner: 1, createdAt: -1 })

const Notification = mongoose.model("Notification", notificationSchema)
export default Notification