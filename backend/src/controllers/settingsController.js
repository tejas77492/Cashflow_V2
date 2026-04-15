const settingsModel = require("../models/settingsModel");

const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsModel.getSettings();
    res.status(200).json(
      settings || {
        cc_charge_percentage: 0,
        bill_charge_percentage: 0,
        branch_manager_share_percentage: 30,
        head_manager_share_percentage: 70,
      }
    );
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const {
      cc_charge_percentage,
      bill_charge_percentage,
      branch_manager_share_percentage,
      head_manager_share_percentage,
    } = req.body;

    if (
      typeof cc_charge_percentage === "undefined" ||
      typeof bill_charge_percentage === "undefined" ||
      typeof branch_manager_share_percentage === "undefined"
    ) {
      return res.status(400).json({
        message:
          "cc_charge_percentage, bill_charge_percentage and branch_manager_share_percentage are required",
      });
    }

    const numericBranchShare = Number(branch_manager_share_percentage);
    const numericHeadShare = Number(
      typeof head_manager_share_percentage === "undefined"
        ? 100 - numericBranchShare
        : head_manager_share_percentage
    );

    if (
      Number.isNaN(numericBranchShare) ||
      Number.isNaN(numericHeadShare) ||
      numericBranchShare < 0 ||
      numericHeadShare < 0 ||
      numericBranchShare + numericHeadShare !== 100
    ) {
      return res.status(400).json({
        message: "Branch manager share and head manager share must be valid and total 100",
      });
    }

    const settings = await settingsModel.updateSettings({
      cc_charge_percentage,
      bill_charge_percentage,
      branch_manager_share_percentage: numericBranchShare,
      head_manager_share_percentage: numericHeadShare,
    });

    return res.status(200).json(settings);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
