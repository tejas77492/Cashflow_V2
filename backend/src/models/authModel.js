const { User } = require("./userModel");

const findUserByEmail = async (email) => {
  const user = await User.findOne({ email }).populate("branch_id", "name").lean();
  if (!user) return null;
  return {
    ...user,
    id: user._id,
    branch_name: user.branch_id ? user.branch_id.name : null,
    branch_id: user.branch_id ? user.branch_id._id || user.branch_id : null,
  };
};

module.exports = {
  findUserByEmail,
};
