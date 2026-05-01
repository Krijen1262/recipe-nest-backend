const express = require("express");
const User = require("../models/User");
const Recipe = require("../models/Recipe");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    const query = { role: "chef" };

    const chefs = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      data: chefs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch chefs" });
  }
});


router.get("/profile/me", protect, allowRoles("chef"), async (req, res) => {
  try {
    const chef = await User.findById(req.user._id).select("-password");

    res.json(chef);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.put("/profile/me", protect, allowRoles("chef"), async (req, res) => {
  try {
    const { fullName, speciality, bio, profileImage, socialLinks } = req.body;

    const chef = await User.findById(req.user._id);

    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }

    chef.fullName = fullName ?? chef.fullName;
    chef.speciality = speciality ?? chef.speciality;
    chef.bio = bio ?? chef.bio;
    chef.profileImage = profileImage ?? chef.profileImage;

    chef.socialLinks = {
      instagram: socialLinks?.instagram ?? chef.socialLinks?.instagram ?? "",
      facebook: socialLinks?.facebook ?? chef.socialLinks?.facebook ?? "",
      youtube: socialLinks?.youtube ?? chef.socialLinks?.youtube ?? "",
    };

    await chef.save();

    const updatedChef = await User.findById(chef._id).select("-password");

    res.json({
      message: "Profile updated",
      chef: updatedChef,
    });
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const chef = await User.findById(req.params.id).select("-password");

    if (!chef || chef.role !== "chef") {
      return res.status(404).json({ message: "Chef not found" });
    }

    const recipes = await Recipe.find({
      chef: chef._id,
      status: "approved",
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      ...chef.toObject(),
      recipes,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch chef" });
  }
});

router.post("/:id/rate", protect, allowRoles("user"), async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const chef = await User.findById(req.params.id);

    if (!chef || chef.role !== "chef") {
      return res.status(404).json({ message: "Chef not found" });
    }

    if (!chef.ratings) chef.ratings = [];

    const existingRating = chef.ratings.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingRating) {
      existingRating.rating = rating;
    } else {
      chef.ratings.push({
        user: req.user._id,
        rating,
      });
    }

    chef.averageRating =
      chef.ratings.reduce((sum, r) => sum + r.rating, 0) / chef.ratings.length;

    await chef.save();

    res.json({
      message: "Chef rated successfully",
      averageRating: chef.averageRating,
      totalRatings: chef.ratings.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Rating failed" });
  }
});

module.exports = router;