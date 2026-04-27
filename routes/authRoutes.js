const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, role, speciality } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      speciality: role === "chef" ? speciality : "",
    });

    res.status(201).json({
      message: "Signup successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        speciality: user.speciality,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.role !== role) {
      return res.status(400).json({ message: "Invalid login details" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid login details" });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        speciality: user.speciality,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;