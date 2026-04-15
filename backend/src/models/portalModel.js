const mongoose = require("mongoose");

const portalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    charge_percentage: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Portal = mongoose.models.Portal || mongoose.model("Portal", portalSchema);

const getAllPortals = () => Portal.find().sort({ _id: -1 });

const getPortalById = (id) => Portal.findById(id);

const createPortal = (data) => Portal.create(data);

const updatePortal = (id, data) => Portal.findByIdAndUpdate(id, data, { new: true });

const deletePortal = (id) => Portal.findByIdAndDelete(id);

module.exports = {
  Portal,
  getAllPortals,
  getPortalById,
  createPortal,
  updatePortal,
  deletePortal,
};
