import mongoose, { mongo, Schema } from "mongoose";

const subscriptionsSchema = new mongoose.Schema({
    subscriber:{
        type: mongoose.Schema.Types.ObjectId, //one who is subscribing
        ref: "User"
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId, //one to whom subscriber is subscribing
        ref: "User"
    }

},{timestamps: true});


const Subscription = mongoose.model("Subscription", subscriptionsSchema);

export {Subscription}