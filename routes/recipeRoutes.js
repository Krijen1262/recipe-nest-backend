const express = require("express");
const Recipe = require("../models/Recipe");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * PUBLIC: users see only approved + active recipes
 */
router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const sort = req.query.sort || "latest";
    const rating = req.query.rating;

    const query = {
      status: "approved",
      isActive: true,
    };

    if (rating) {
      query.averageRating = { $gte: Number(rating) };
    }

    let sortOption = { createdAt: -1 };

    if (sort === "rating") {
      sortOption = { averageRating: -1 };
    }

    const skip = (page - 1) * limit;

    const recipes = await Recipe.find(query)
      .populate("chef", "fullName speciality profileImage")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Recipe.countDocuments(query);

    res.json({
      data: recipes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recipes" });
  }
});

/**
 * CHEF: get own recipes
 * IMPORTANT: must be before /:id
 */
router.get("/my-recipes", protect, allowRoles("chef"), async (req, res) => {
  try {
    const recipes = await Recipe.find({ chef: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your recipes" });
  }
});

/**
 * PUBLIC: get single recipe
 * IMPORTANT: keep after /my-recipes
 */
router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate(
      "chef",
      "fullName profileImage speciality"
    );

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recipe" });
  }
});

/**
 * CHEF: create recipe
 */
router.post("/", protect, allowRoles("chef"), async (req, res) => {
  try {
    const { title, cuisine, description, ingredients, steps, image } = req.body;

    const recipe = await Recipe.create({
      title,
      cuisine,
      description,
      ingredients,
      steps,
      image,
      chef: req.user._id,
      status: "pending",
      isActive: true,
    });

    res.status(201).json({
      message: "Recipe submitted for admin verification",
      recipe,
    });
  } catch (error) {
    res.status(500).json({ message: "Recipe creation failed" });
  }
});

/**
 * CHEF: update own recipe only
 */
router.put("/:id", protect, allowRoles("chef"), async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    if (recipe.chef.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can edit only your recipe" });
    }

    const { title, cuisine, description, ingredients, steps, image } = req.body;

    recipe.title = title || recipe.title;
    recipe.cuisine = cuisine || recipe.cuisine;
    recipe.description = description || recipe.description;
    recipe.ingredients = ingredients || recipe.ingredients;
    recipe.steps = steps || recipe.steps;
    recipe.image = image || recipe.image;

    recipe.status = "pending";

    await recipe.save();

    res.json({
      message: "Recipe updated and sent for verification",
      recipe,
    });
  } catch (error) {
    res.status(500).json({ message: "Recipe update failed" });
  }
});

/**
 * CHEF: delete own recipe only
 */
router.delete("/:id", protect, allowRoles("chef"), async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    if (recipe.chef.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can delete only your recipe" });
    }

    await recipe.deleteOne();

    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Recipe delete failed" });
  }
});

/**
 * USER: rate approved recipe
 */
router.post("/:id/rate", protect, allowRoles("user"), async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const recipe = await Recipe.findOne({
      _id: req.params.id,
      status: "approved",
      isActive: true,
    });

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const existingRating = recipe.ratings.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingRating) {
      existingRating.rating = rating;
    } else {
      recipe.ratings.push({
        user: req.user._id,
        rating,
      });
    }

    recipe.averageRating =
      recipe.ratings.reduce((sum, item) => sum + item.rating, 0) /
      recipe.ratings.length;

    await recipe.save();

    res.json({
      message: "Rating saved",
      averageRating: recipe.averageRating,
      totalRatings: recipe.ratings.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Rating failed" });
  }
});

module.exports = router;