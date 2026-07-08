import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import userRouter from "./routes/user.routes.js"
import itemRouter from "./routes/item.routes.js"
import orderRouter from "./routes/order.routes.js"
import notificationRouter from "./routes/notification.routes.js"
import http from "http"
import { Server } from "socket.io"
import { socketHandler } from "./socket.js"
import rateLimit from "express-rate-limit"

const app = express()
const server = http.createServer(app)

// FIX M2: CORS origin env se lo - hardcoded nahi
const allowedOriginEnv = process.env.ALLOWED_ORIGIN || "http://localhost:5173"
const allowedOrigins = allowedOriginEnv.split(",").map(origin => origin.trim())

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        callback(new Error(`CORS policy blocked origin: ${origin}`))
    },
    credentials: true
}

const io = new Server(server, {
    cors: corsOptions
})

app.set("io", io)

const port = process.env.PORT || 5000

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

// FIX H2: Rate limiting

// Auth routes - strict limit (brute force prevent)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { message: "Too many attempts. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false
})

// OTP routes - extra strict
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Too many OTP requests. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false
})

// Order routes - prevent spam
const orderLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: { message: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false
})

app.use("/api/auth/signin", authLimiter)
app.use("/api/auth/signup", authLimiter)
app.use("/api/auth/send-otp", otpLimiter)
app.use("/api/auth/verify-otp", otpLimiter)
app.use("/api/order/place-order", orderLimiter)

app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/item", itemRouter)
app.use("/api/order", orderRouter)
app.use("/api/notification", notificationRouter)

socketHandler(io)
server.listen(port, () => {
    connectDb()
    console.log(`server started at ${port}`)
})