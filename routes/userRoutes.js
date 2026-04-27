const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.json({
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.put("/update-profile", protect, async (req, res) => {
  try {
const { fullName, speciality, bio, profileImage, socialLinks } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.fullName = fullName ?? user.fullName;
    user.speciality = speciality ?? user.speciality;
    user.bio = bio ?? user.bio;
    user.profileImage = profileImage ?? user.profileImage;
    user.socialLinks = {
  instagram: socialLinks?.instagram ?? user.socialLinks?.instagram ?? "",
  facebook: socialLinks?.facebook ?? user.socialLinks?.facebook ?? "",
  youtube: socialLinks?.youtube ?? user.socialLinks?.youtube ?? "",
};

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Profile update failed" });
  }
});

module.exports = router;