import mongoose from "mongoose"
import dns from "dns"

const connectDb=async () => {
    try {
        // Use a reliable public DNS for SRV resolution (works around local resolver blocks)
        dns.setServers(["8.8.8.8"])
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("db connected")
    } catch (error) {
        console.error("db connection error:", error.message || error)
    }
}

export default connectDb