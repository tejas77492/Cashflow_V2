const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    cc_charge_percentage: { type: Number, required: true, default: 2.5 },
    bill_charge_percentage: { type: Number, required: true, default: 3.5 },
    branch_manager_share_percentage: { type: Number, required: true, default: 30.0 },
    head_manager_share_percentage: { type: Number, required: true, default: 70.0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);

const getSettings = async () => {
  let settings = await Settings.findOne().sort({ _id: 1 });
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

const updateSettings = async (data) => {
  let settings = await Settings.findOne().sort({ _id: 1 });
  if (!settings) {
    settings = await Settings.create(data);
  } else {
    settings = await Settings.findByIdAndUpdate(settings._id, data, { new: true });
  }
  return settings;
};

module.exports = {
  Settings,
  getSettings,
  updateSettings,
};
