const portalModel = require("../models/portalModel");

const getPortals = async (req, res, next) => {
  try {
    const portals = await portalModel.getAllPortals();
    res.status(200).json(portals);
  } catch (error) {
    next(error);
  }
};

const createPortal = async (req, res, next) => {
  try {
    const { name, charge_percentage } = req.body;

    if (!name || typeof charge_percentage === "undefined") {
      return res.status(400).json({ message: "Portal name and charge percentage are required" });
    }

    const portal = await portalModel.createPortal({ name, charge_percentage });
    return res.status(201).json(portal);
  } catch (error) {
    return next(error);
  }
};

const updatePortal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, charge_percentage } = req.body;

    const existing = await portalModel.getPortalById(id);
    if (!existing) {
      return res.status(404).json({ message: "Portal not found" });
    }

    const portal = await portalModel.updatePortal(id, {
      name: name || existing.name,
      charge_percentage:
        typeof charge_percentage === "undefined"
          ? existing.charge_percentage
          : charge_percentage,
    });

    return res.status(200).json(portal);
  } catch (error) {
    return next(error);
  }
};

const deletePortal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await portalModel.getPortalById(id);

    if (!existing) {
      return res.status(404).json({ message: "Portal not found" });
    }

    await portalModel.deletePortal(id);
    return res.status(200).json({ message: "Portal deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPortals,
  createPortal,
  updatePortal,
  deletePortal,
};
