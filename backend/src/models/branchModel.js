const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Branch = mongoose.models.Branch || mongoose.model("Branch", branchSchema);

const getAllBranches = () => Branch.find().sort({ _id: -1 });

const getBranchById = (id) => Branch.findById(id);

const createBranch = (data) => Branch.create(data);

const updateBranch = (id, data) => Branch.findByIdAndUpdate(id, data, { new: true });

const deleteBranch = (id) => Branch.findByIdAndDelete(id);

module.exports = {
  Branch,
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
};
