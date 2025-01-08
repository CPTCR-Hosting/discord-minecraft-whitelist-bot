const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  DiscordID: String,
  MinecraftUsername: String,
  Staff: { type: Boolean, default: false },
  WhitelistedUsers: [
    {
        type: String
    }
  ]
});

module.exports = mongoose.model("Users", userSchema);
