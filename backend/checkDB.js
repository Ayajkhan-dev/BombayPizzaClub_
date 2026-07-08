import mongoose from "mongoose";
import dotenv from "dotenv";
import Item from "./models/item.model.js";

dotenv.config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
    console.log("Connected to DB");
    const items = await Item.find({});
    console.log(`Total items: ${items.length}`);
    const itemsWithoutOwner = items.filter(i => !i.owner);
    console.log(`Items without owner: ${itemsWithoutOwner.length}`);

    if (itemsWithoutOwner.length > 0) {
        console.log("Deleting items without owner to clean up legacy data...");
        for (const item of itemsWithoutOwner) {
            await Item.findByIdAndDelete(item._id);
        }
        console.log("Deleted legacy items.");
    }

    process.exit(0);
}).catch(err => {
    console.log(err);
    process.exit(1);
});
