import mongoose from "mongoose";

const deliveryAssignmentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    shopOrderId:{
         type: mongoose.Schema.Types.ObjectId,
         required:true
    },
    brodcastedTo:[
        {
         type: mongoose.Schema.Types.ObjectId,
         ref:"User"
    }
    ],
    assignedTo:{
        type: mongoose.Schema.Types.ObjectId,
         ref:"User",
         default:null
    },
    status:{
        type:String,
        enum:["brodcasted","assigned","completed"],
        default:"brodcasted"
    }
    ,
    acceptedAt:Date
}, { timestamps: true })

const DeliveryAssignment=mongoose.model("DeliveryAssignment",deliveryAssignmentSchema)
export default DeliveryAssignment