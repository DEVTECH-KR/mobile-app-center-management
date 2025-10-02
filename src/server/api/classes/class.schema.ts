import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },

    description: {
        type: String,
        require: [true, 'Description is required'],
    },

    levels: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner',
        required: false,
    },

    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },    

    trainerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    imageUrl: {
        type: String,
        reauired: false,
    }
});

export const ClassModel = mongoose.models.Class || mongoose.model('Class', classSchema);
