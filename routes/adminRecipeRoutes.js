const express = require("express");
const User = require("../models/User");
const Recipe = require("../models/Recipe");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats", protect, allowRoles("admin"), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalChefs = await User.countDocuments({ role: "chef" });
    const totalRecipes = await Recipe.countDocuments();
    const pendingRecipes = await Recipe.countDocuments({ status: "pending" });

    res.json({
      totalUsers,
      totalChefs,
      totalRecipes,
      pendingRecipes,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.get("/users", protect, allowRoles("admin"), async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.get("/chefs", protect, allowRoles("admin"), async (req, res) => {
  try {
    const chefs = await User.find({ role: "chef" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(chefs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch chefs" });
  }
});
router.get("/recipes", protect, allowRoles("admin"), async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate("chef", "fullName email speciality profileImage")
      .sort({ createdAt: -1 });

    res.json(recipes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch recipes" });
  }
});

module.exports = router;