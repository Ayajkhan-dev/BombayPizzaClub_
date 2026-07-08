import { validationResult } from "express-validator"

// Validation errors check karo - agar errors hain toh 400 return karo
const validate = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
    }
    next()
}

export default validate