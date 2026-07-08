import express from "express"
import { body, param, query } from "express-validator"
import validate from "../middlewares/validate.js"
import isAuth from "../middlewares/isAuth.js"
import {
    addItem, deleteItem, editItem,
    getAllItems, getItemById, getMyItems, rating, searchItems
} from "../controllers/item.controllers.js"
import { upload } from "../middlewares/multer.js"

const itemRouter = express.Router()

// Add item validation
itemRouter.post("/add-item",
    isAuth,
    upload.single("image"),
    [
        body("name")
            .trim()
            .notEmpty().withMessage("Item name is required")
            .isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters"),
        body("category")
            .notEmpty().withMessage("Category is required"),
        body("foodType")
            .notEmpty().withMessage("Food type is required")
            .isIn(["veg", "non veg"]).withMessage("Food type must be veg or non veg"),
        body("price")
            .notEmpty().withMessage("Price is required")
            .isFloat({ min: 1 }).withMessage("Price must be greater than 0")
    ],
    validate,
    addItem
)

// Edit item validation
itemRouter.post("/edit-item/:itemId",
    isAuth,
    upload.single("image"),
    [
        body("name")
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters"),
        body("price")
            .optional()
            .isFloat({ min: 1 }).withMessage("Price must be greater than 0"),
        body("foodType")
            .optional()
            .isIn(["veg", "non veg"]).withMessage("Food type must be veg or non veg")
    ],
    validate,
    editItem
)

itemRouter.get("/get-by-id/:itemId", isAuth, getItemById)
itemRouter.delete("/delete/:itemId", isAuth, deleteItem)

// Public route: guest aur logged-in user dono ko items dikhne chahiye — isAuth hata diya
itemRouter.get("/get-all", getAllItems)

itemRouter.get("/get-my-items", isAuth, getMyItems)

// Search validation — already public, no change
itemRouter.get("/search-items",
    [
        query("query")
            .trim()
            .notEmpty().withMessage("Search query is required")
            .isLength({ max: 100 }).withMessage("Query too long")
    ],
    validate,
    searchItems
)

// Rating validation
itemRouter.post("/rating",
    isAuth,
    [
        body("itemId")
            .notEmpty().withMessage("itemId is required"),
        body("rating")
            .notEmpty().withMessage("Rating is required")
            .isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5")
    ],
    validate,
    rating
)

export default itemRouter