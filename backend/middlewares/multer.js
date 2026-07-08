import multer from "multer"
import path from "path"

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public")
    },
    filename: (req, file, cb) => {
        // FIX H4: Original filename use nahi karte - path traversal risk
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
    }
})

// FIX H3: Sirf images allow karo + 5MB limit
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error("Only image files are allowed (jpeg, png, webp)"), false)
    }
}

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
})