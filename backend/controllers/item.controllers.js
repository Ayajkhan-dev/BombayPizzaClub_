import Item from "../models/item.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import User from "../models/user.model.js";

export const addItem = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("role")
        if (!user || user.role !== "owner") {
            return res.status(403).json({ message: "Only owners can add items" })
        }

        const { name, category, foodType, price, sizes } = req.body
        let image;
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path)
        }

        // NEW FEATURE: Pizza ke liye 3 sizes (Regular/Medium/Large) optional
        // support - baaki categories ke liye ye poori tarah skip ho jaata hai,
        // koi existing behaviour change nahi hota.
        let parsedSizes = undefined
        let finalPrice = price
        if (category === "Pizza" && sizes) {
            try {
                parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes
            } catch (e) {
                return res.status(400).json({ message: "invalid sizes format" })
            }
            if (!Array.isArray(parsedSizes) || parsedSizes.length !== 3) {
                return res.status(400).json({ message: "pizza must have exactly 3 sizes" })
            }
            for (const s of parsedSizes) {
                if (!s.label || !s.price || Number(s.price) <= 0) {
                    return res.status(400).json({ message: "each size needs a valid label and price" })
                }
            }
            // Regular size ka price hi item ka base `price` rehta hai, taaki
            // baaki poori app (search, category listing, sorting) bina kisi
            // change ke pehle jaisa hi kaam karti rahe.
            const regularSize = parsedSizes.find(s => s.label === "Regular")
            finalPrice = regularSize ? regularSize.price : parsedSizes[0].price
        }

        const item = await Item.create({
            name, category, foodType, price: finalPrice, image, owner: req.userId,
            ...(parsedSizes ? { sizes: parsedSizes } : {})
        })
        return res.status(201).json({ item, message: "Item saved successfully." })
    } catch (error) {
        return res.status(500).json({ message: "add item error" })
    }
}

export const editItem = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const { name, category, foodType, price, sizes } = req.body

        const item = await Item.findOne({ _id: itemId, owner: req.userId })
        if (!item) {
            return res.status(403).json({ message: "Item not found or unauthorized" })
        }

        let image;
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path)
        }

        // NEW FEATURE: same Pizza sizes handling as addItem
        let parsedSizes = undefined
        let finalPrice = price
        if (category === "Pizza" && sizes) {
            try {
                parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes
            } catch (e) {
                return res.status(400).json({ message: "invalid sizes format" })
            }
            if (!Array.isArray(parsedSizes) || parsedSizes.length !== 3) {
                return res.status(400).json({ message: "pizza must have exactly 3 sizes" })
            }
            for (const s of parsedSizes) {
                if (!s.label || !s.price || Number(s.price) <= 0) {
                    return res.status(400).json({ message: "each size needs a valid label and price" })
                }
            }
            const regularSize = parsedSizes.find(s => s.label === "Regular")
            finalPrice = regularSize ? regularSize.price : parsedSizes[0].price
        }

        const setData = { name, category, foodType, price: finalPrice }
        if (image) setData.image = image
        let updateData
        if (parsedSizes) {
            setData.sizes = parsedSizes
            updateData = { $set: setData }
        } else if (category && category !== "Pizza") {
            // Agar category Pizza se hatakar kuch aur select ki gayi hai,
            // to purani sizes hata do taaki stale data na reh jaaye.
            updateData = { $set: setData, $unset: { sizes: 1 } }
        } else {
            updateData = setData
        }

        const updatedItem = await Item.findByIdAndUpdate(itemId, updateData, { new: true })
        return res.status(200).json({ item: updatedItem, message: "Item updated successfully." })
    } catch (error) {
        return res.status(500).json({ message: "edit item error" })
    }
}

export const getItemById = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const item = await Item.findById(itemId)
        if (!item) return res.status(400).json({ message: "item not found" })
        return res.status(200).json(item)
    } catch (error) {
        return res.status(500).json({ message: "get item error" })
    }
}

export const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.itemId

        const item = await Item.findOne({ _id: itemId, owner: req.userId })
        if (!item) {
            return res.status(403).json({ message: "Item not found or unauthorized" })
        }

        await Item.findByIdAndDelete(itemId)
        return res.status(200).json({ message: "Item deleted successfully." })
    } catch (error) {
        return res.status(500).json({ message: "delete item error" })
    }
}

export const getAllItems = async (req, res) => {
    try {
        const items = await Item.find({}).populate("owner", "fullName _id")
        const validItems = items.filter(item => item.owner != null)
        return res.status(200).json(validItems)
    } catch (error) {
        return res.status(500).json({ message: "get all items error" })
    }
}

export const getMyItems = async (req, res) => {
    try {
        const items = await Item.find({ owner: req.userId }).sort({ updatedAt: -1 })
        return res.status(200).json(items)
    } catch (error) {
        return res.status(500).json({ message: "get my items error" })
    }
}

export const searchItems = async (req, res) => {
    try {
        const { query } = req.query
        if (!query) return res.status(400).json({ message: "query is required" })

        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

        const items = await Item.find({
            $or: [
                { name: { $regex: escapedQuery, $options: "i" } },
                { category: { $regex: escapedQuery, $options: "i" } }
            ]
        }).populate("owner", "fullName _id")

        const validItems = items.filter(item => item.owner != null)
        return res.status(200).json(validItems)
    } catch (error) {
        return res.status(500).json({ message: "search item error" })
    }
}

export const rating = async (req, res) => {
    try {
        const { itemId, rating } = req.body
        if (!itemId || !rating) {
            return res.status(400).json({ message: "itemId and rating is required" })
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "rating must be between 1 to 5" })
        }
        const item = await Item.findById(itemId)
        if (!item) return res.status(400).json({ message: "item not found" })

        const alreadyRated = item.ratedBy?.some(id => id.toString() === req.userId)
        if (alreadyRated) {
            return res.status(400).json({ message: "You have already rated this item" })
        }

        const newCount = item.rating.count + 1
        const newAverage = (item.rating.average * item.rating.count + rating) / newCount
        item.rating.count = newCount
        item.rating.average = newAverage
        item.ratedBy.push(req.userId)
        await item.save()
        return res.status(200).json({ rating: item.rating })
    } catch (error) {
        return res.status(500).json({ message: "rating error" })
    }
}