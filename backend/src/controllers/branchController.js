const branchModel = require("../models/branchModel");

const getBranches = async (req, res, next) => {
  try {
    const branches = await branchModel.getAllBranches();
    res.status(200).json(branches);
  } catch (error) {
    next(error);
  }
};

const createBranch = async (req, res, next) => {
  try {
    const { name, status = "active" } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Branch name is required" });
    }

    const branch = await branchModel.createBranch({ name, status });
    return res.status(201).json(branch);
  } catch (error) {
    return next(error);
  }
};

const updateBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const existing = await branchModel.getBranchById(id);
    if (!existing) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const branch = await branchModel.updateBranch(id, {
      name: name || existing.name,
      status: status || existing.status,
    });

    return res.status(200).json(branch);
  } catch (error) {
    return next(error);
  }
};

const deleteBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await branchModel.getBranchById(id);

    if (!existing) {
      return res.status(404).json({ message: "Branch not found" });
    }

    await branchModel.deleteBranch(id);
    return res.status(200).json({ message: "Branch deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
};
