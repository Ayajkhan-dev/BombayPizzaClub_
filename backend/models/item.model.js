import mongoose from "mongoose"

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    category: {
        type: String,
        enum: [
            "Snacks", "Main Course", "Desserts", "Pizza", "Burgers",
            "Sandwiches", "South Indian", "North Indian", "Chinese",
            "Fast Food", "Others"
        ],
        required: true
    },
    price: {
        type: Number,
        min: 0,
        required: true
    },
    foodType: {
        type: String,
        enum: ["veg", "non veg"],
        required: true
    },
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    // FIX M7: Track karo kisne rating di - duplicate ratings prevent
    ratedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true })

const Item = mongoose.model("Item", itemSchema)
export default Item