const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

const getUsers = async (req, res, next) => {
  try {
    const users = await userModel.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, branch_id } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.createUser({
      name,
      email,
      password: hashedPassword,
      role,
      branch_id,
    });

    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, branch_id } = req.body;

    const existing = await userModel.getUserById(id);

    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const user = await userModel.updateUser(id, {
      name: name || existing.name,
      email: email || existing.email,
      password: hashedPassword,
      role: role || existing.role,
      branch_id: typeof branch_id === "undefined" ? existing.branch_id : branch_id,
    });

    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await userModel.getUserById(id);

    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    await userModel.deleteUser(id);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
