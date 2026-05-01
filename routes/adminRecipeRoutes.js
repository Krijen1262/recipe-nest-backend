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
    console.log(error);
    res.status(500).json({ message: "Failed to fetch stats" });
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


router.patch("/recipes/:id/status", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.json({
      message: "Recipe status updated",
      recipe,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Status update failed" });
  }
});


router.patch("/recipes/:id/active", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { isActive } = req.body;

    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.json({
      message: "Recipe active status updated",
      recipe,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Active status update failed" });
  }
});


router.get("/users", protect, allowRoles("admin"), async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.log(error);
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
    console.log(error);
    res.status(500).json({ message: "Failed to fetch chefs" });
  }
});


router.get("/test", (req, res) => {
  res.json({ message: "Admin routes working ✅" });
});


module.exports = router;