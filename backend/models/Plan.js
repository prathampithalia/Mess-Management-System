const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    planType: {
        type: String,
        enum: [
            "2_home",
            "2_dine",
            "1_home",
            "1_dine"
        ]
    },

    mealPreference: {
        type: String,
        enum: ["lunch", "dinner"]
    },

    totalMeals: Number,

    mealsRemaining: Number,

    startDate: Date,

    expiryDate: Date,

    maxExpiryDate: Date

});

module.exports = mongoose.model("Plan", planSchema);