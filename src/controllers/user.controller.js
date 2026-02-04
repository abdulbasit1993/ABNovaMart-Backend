const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  registerUserSchema,
  loginUserSchema,
} = require("../validators/user.validator");

const registerUser = async (req, res) => {
  try {
    // validate user input
    const { error, value } = registerUserSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { email, password, firstName, lastName, phone, role } = value;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: role || "USER",
    });

    const jwtPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const auth_token = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "18250d",
    });

    // Remove password before sending response
    const userWithoutPassword = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
    };

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userWithoutPassword,
      token: auth_token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { error, value } = loginUserSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { email, password } = value;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const jwtPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const auth_token = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "18250d",
    });

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
      token: auth_token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
