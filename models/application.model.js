import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    title: String,
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    salary: Number,
    // other fields...
});

const applicationSchema = new mongoose.Schema({
    job:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Job',
        required:true
    },
    applicant:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    status:{
        type:String,
        enum:['pending', 'accepted', 'rejected'],
        default:'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid'],
        default: 'Pending'
    },
    rating: {
        score: {
            type: Number, // Rating score (e.g., out of 5)
            min: 1,
            max: 5,
            default: 1,
        },
        review: {
            type: String, // Optional review text
            default: '',
        }
    },

    feedback: {
        type: String,
        default: ''
    }
    
},{timestamps:true});
export const Application  = mongoose.model("Application", applicationSchema);