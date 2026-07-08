import express from "express"
import { body } from "express-validator"
import validate from "../middlewares/validate.js"
import {
    googleAuth,
    resetPassword,
    sendOtp,
    signIn,
    signOut,
    signUp,
    verifyOtp
} from "../controllers/auth.controllers.js"

const authRouter = express.Router()

// SignUp validation
authRouter.post("/signup",
    [
        body("fullName")
            .trim()
            .notEmpty().withMessage("Full name is required")
            .isLength({ min: 2, max: 50 }).withMessage("Full name must be 2-50 characters"),
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Enter a valid email"),
        body("password")
            .notEmpty().withMessage("Password is required")
            .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
        body("mobile")
            .trim()
            .notEmpty().withMessage("Mobile is required")
            .isMobilePhone("en-IN").withMessage("Enter a valid Indian mobile number")
    ],
    validate,
    signUp
)

// SignIn validation
authRouter.post("/signin",
    [
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Enter a valid email"),
        body("password")
            .notEmpty().withMessage("Password is required")
    ],
    validate,
    signIn
)

authRouter.get("/signout", signOut)

// Send OTP validation
authRouter.post("/send-otp",
    [
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Enter a valid email")
    ],
    validate,
    sendOtp
)

// Verify OTP validation
authRouter.post("/verify-otp",
    [
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Enter a valid email"),
        body("otp")
            .notEmpty().withMessage("OTP is required")
            .isLength({ min: 4, max: 4 }).withMessage("OTP must be 4 digits")
            .isNumeric().withMessage("OTP must be numeric")
    ],
    validate,
    verifyOtp
)

// Reset Password validation
authRouter.post("/reset-password",
    [
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Enter a valid email"),
        body("newPassword")
            .notEmpty().withMessage("New password is required")
            .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    ],
    validate,
    resetPassword
)

// Google Auth validation
authRouter.post("/google-auth",
    [
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Enter a valid email"),
        body("fullName")
            .trim()
            .notEmpty().withMessage("Full name is required")
    ],
    validate,
    googleAuth
)

export default authRouter