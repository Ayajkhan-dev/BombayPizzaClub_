import express from "express"
import { body } from "express-validator"
import validate from "../middlewares/validate.js"
import isAuth from "../middlewares/isAuth.js"
import {
    acceptOrder, getCurrentOrder, getDeliveryBoyAssignment,
    getMyOrders, getOrderById, getTodayDeliveries,
    placeOrder, sendDeliveryOtp, updateOrderStatus,
    verifyDeliveryOtp, verifyPayment
} from "../controllers/order.controllers.js"

const orderRouter = express.Router()

// Place order validation
orderRouter.post("/place-order",
    isAuth,
    [
        body("cartItems")
            .isArray({ min: 1 }).withMessage("Cart cannot be empty"),
        body("paymentMethod")
            .notEmpty().withMessage("Payment method is required")
            .isIn(["cod", "online"]).withMessage("Invalid payment method"),
        body("deliveryAddress.text")
            .trim()
            .notEmpty().withMessage("Delivery address text is required"),
        body("deliveryAddress.latitude")
            .notEmpty().withMessage("Delivery latitude is required")
            .isFloat().withMessage("Invalid latitude"),
        body("deliveryAddress.longitude")
            .notEmpty().withMessage("Delivery longitude is required")
            .isFloat().withMessage("Invalid longitude")
    ],
    validate,
    placeOrder
)

// Verify payment validation
orderRouter.post("/verify-payment",
    isAuth,
    [
        body("razorpay_payment_id").notEmpty().withMessage("Payment ID is required"),
        body("razorpay_order_id").notEmpty().withMessage("Order ID is required"),
        body("razorpay_signature").notEmpty().withMessage("Signature is required"),
        body("orderId").notEmpty().withMessage("orderId is required")
    ],
    validate,
    verifyPayment
)

orderRouter.get("/my-orders", isAuth, getMyOrders)
orderRouter.get("/get-assignments", isAuth, getDeliveryBoyAssignment)
orderRouter.get("/get-current-order", isAuth, getCurrentOrder)

// Send delivery OTP validation
orderRouter.post("/send-delivery-otp",
    isAuth,
    [
        body("orderId").notEmpty().withMessage("orderId is required"),
        body("shopOrderId").notEmpty().withMessage("shopOrderId is required")
    ],
    validate,
    sendDeliveryOtp
)

// Verify delivery OTP validation
orderRouter.post("/verify-delivery-otp",
    isAuth,
    [
        body("orderId").notEmpty().withMessage("orderId is required"),
        body("shopOrderId").notEmpty().withMessage("shopOrderId is required"),
        body("otp")
            .notEmpty().withMessage("OTP is required")
            .isLength({ min: 4, max: 4 }).withMessage("OTP must be 4 digits")
    ],
    validate,
    verifyDeliveryOtp
)

// Update status validation
orderRouter.post("/update-status/:orderId/:ownerId",
    isAuth,
    [
        body("status").notEmpty().withMessage("Status is required")
    ],
    validate,
    updateOrderStatus
)

orderRouter.post('/accept-order/:assignmentId', isAuth, acceptOrder)
orderRouter.get('/get-order-by-id/:orderId', isAuth, getOrderById)
orderRouter.get('/get-today-deliveries', isAuth, getTodayDeliveries)

export default orderRouter