const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    res.json(user);
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Hardcoded admin credentials
    if (email === "admin@support" && password === "admin") {
      const token = jwt.sign({ isAdmin: true }, "secret123");
      return res.json({ token, isAdmin: true });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ msg: "Wrong password" });
    }

    const token = jwt.sign({ id: user._id }, "secret123");

    res.json({ token });
  } catch (err) {
    res.status(500).json(err);
  }
};
