const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    date: Date,

    lunch: {
        type: String,
        enum: ["eaten", "cancelled", "pending"],
        default: "pending"
    },

    dinner: {
        type: String,
        enum: ["eaten", "cancelled", "pending"],
        default: "pending"
    }

});

module.exports = mongoose.model("Meal", mealSchema);