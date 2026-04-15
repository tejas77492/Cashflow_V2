const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "branch_manager", "operator"], required: true },
    branch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

const mapUser = (user) => {
  if (!user) return user;
  return {
    ...user,
    id: user._id,
    branch_name: user.branch_id ? user.branch_id.name : null,
    branch_id: user.branch_id ? user.branch_id._id || user.branch_id : null,
  };
};

const getAllUsers = async () => {
  const users = await User.find().populate("branch_id", "name").sort({ _id: -1 }).lean();
  return users.map(mapUser);
};

const getUserById = async (id) => {
  const user = await User.findById(id).populate("branch_id", "name").lean();
  return mapUser(user);
};

const createUser = async (data) => {
  const user = await User.create(data);
  return getUserById(user._id);
};

const updateUser = async (id, data) => {
  await User.findByIdAndUpdate(id, data);
  return getUserById(id);
};

const deleteUser = (id) => User.findByIdAndDelete(id);

module.exports = {
  User,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
