const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const chefRoutes = require("./routes/chefRoutes");
const adminRecipeRoutes = require("./routes/adminRecipeRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// 🔥 FIRST: middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 THEN: routes
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/chefs", chefRoutes);
app.use("/api/admin", adminRecipeRoutes);
app.use("/api/user", userRoutes);

// DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.log(err));