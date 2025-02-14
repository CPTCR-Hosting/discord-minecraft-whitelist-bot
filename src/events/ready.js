const mongoose = require("mongoose");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log("Ready!");

    mongoose
      .connect(process.env.mongodb)
      .then(() => {
        console.log("Succesfully connected to the database.");
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err);
      });

    async function pickPresence() {
      const option = Math.floor(Math.random() * statusArray.length);

      try {
        await client.user.setPresence({
          activities: [
            {
              name: statusArray[option].content,
              type: statusArray[option].type,
            },
          ],

          status: statusArray[option].status,
        });
      } catch (error) {
        console.error(error);
      }
    }
  },
};
