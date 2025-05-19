import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String, 
    },
    website:{
        type:String 
    },
    location:{
        type:String 
    },
    logo:{
        type:String // URL to company logo
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
},{timestamps:true})

// Define unique index for user field
companySchema.index({ user: 1 }, { unique: true });

export const Company = mongoose.model("Company", companySchema);