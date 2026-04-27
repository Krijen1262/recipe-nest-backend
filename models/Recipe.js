const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
  },
  { timestamps: true }
);

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    cuisine: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    ingredients: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    steps: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    ratings: [ratingSchema],

    averageRating: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", recipeSchema);