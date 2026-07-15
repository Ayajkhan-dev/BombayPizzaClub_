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
            "Snacks", "Ice Cream", "Main Course", "Desserts", "Pizza", "Burgers",
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
    // NEW FEATURE: sirf "Pizza" category ke items ke liye optional hai. Jab
    // present hai, frontend size-selector dikhata hai aur price yahi se aata
    // hai. Baaki categories ke liye ye field hamesha empty rahega aur upar
    // wala single `price` field hi pehle jaisa kaam karta rahega.
    sizes: {
        type: [{
            label: { type: String, enum: ["Regular", "Medium", "Large"], required: true },
            inches: { type: Number, required: true },
            price: { type: Number, min: 0, required: true }
        }],
        default: undefined
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
    ratedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true })

const Item = mongoose.model("Item", itemSchema)
export default Item