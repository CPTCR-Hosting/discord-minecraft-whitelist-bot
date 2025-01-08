const {
  SlashCommandBuilder,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");

const userSchema = require("../../schemas/users");
const {
  fetchUUID,
  fetchWhitelistFile,
  updateWhitelistFile,
} = require("../../utils/whitelistHelpers");

const lowestroleId = "YOUR LOWEST ROLE ID";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Manage your whitelist of users")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a user to the whitelist")
        .addStringOption((o) =>
          o
            .setName("user")
            .setDescription("The Minecraft username to whitelist")
            .setRequired(true)
        )
        .addBooleanOption((o) =>
          o
            .setName("is_own_account")
            .setDescription("Is this your own Minecraft account? (True = yes)")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a user from the whitelist")
        .addStringOption((o) =>
          o
            .setName("user")
            .setDescription("The user to remove from whitelist")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("View the list of users in your whitelist")
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    async function hasHigherOrEqualRole() {
      const member = interaction.guild.members.cache.get(interaction.user.id);
      const lowestRole = member.guild.roles.cache.get(lowestroleId);

      if (!lowestRole) {
        throw new Error("The specified lowest role does not exist.");
      }

      if (member.roles.highest.position >= lowestRole.position) {
        return true;
      }

      return false;
    }

    switch (subcommand) {
      case "add":
        const hasRole = await hasHigherOrEqualRole();

        if (!hasRole) {
          return interaction.reply({
            content: `You need a role with higher or equal position to the lowest role to use this command.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        let data = await userSchema.findOne({ DiscordID: interaction.user.id });
        const isOwnAccount =
          interaction.options.getBoolean("is_own_account") || false;
        const minecraftUsername = interaction.options.getString("user");

        if (!data) {
          data = new userSchema({
            DiscordID: interaction.user.id,
            MinecraftUsername: null,
            WhitelistedUsers: [],
          });
        }

        if (data.WhitelistedUsers.length >= 3) {
          return interaction.reply({
            content:
              "You have reached the limit of 3 whitelisted users. Please remove one to add a new user.",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (data.WhitelistedUsers.includes(minecraftUsername)) {
          return interaction.reply({
            content: `The username \`${minecraftUsername}\` is already in your whitelist.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        if (
          isOwnAccount &&
          data.MinecraftUsername &&
          data.MinecraftUsername !== minecraftUsername
        ) {
          return interaction.reply({
            content: `You already linked your Minecraft account as \`${data.MinecraftUsername}\`.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        try {
          const uuid = await fetchUUID(minecraftUsername);
          const whitelist = await fetchWhitelistFile();

          if (
            whitelist.some(
              (entry) => entry.uuid === uuid || entry.name === minecraftUsername
            )
          ) {
            return interaction.reply({
              content: `The username \`${minecraftUsername}\` is already whitelisted.`,
              flags: MessageFlags.Ephemeral,
            });
          }

          whitelist.push({ name: minecraftUsername, uuid });
          await updateWhitelistFile(whitelist);

          if (isOwnAccount) {
            data.MinecraftUsername = minecraftUsername;
          } else {
            data.WhitelistedUsers.push(minecraftUsername);
          }

          await data.save();

          return interaction.reply({
            content: `Successfully added \`${minecraftUsername}\` to the whitelist.`,
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          console.error(
            "Error:",
            error.response?.data || error.message || error
          );
          return interaction.reply({
            content: "Failed to modify the whitelist. Please try again later.",
            flags: MessageFlags.Ephemeral,
          });
        }
        break;

      case "remove":
        const hasRole1 = await hasHigherOrEqualRole();

        if (!hasRole1) {
          return interaction.reply({
            content: `You need a role with higher or equal position to the lowest role to use this command.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        const minecraftUsernameToRemove = interaction.options.getString("user");
        if (!minecraftUsernameToRemove) {
          return interaction.reply({
            content: "Please provide a Minecraft username to remove.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const check = await userSchema.findOne({
          DiscordID: interaction.user.id,
          $or: [
            { MinecraftUsername: minecraftUsernameToRemove },
            { WhitelistedUsers: minecraftUsernameToRemove },
          ],
        });

        if (!check) {
          return interaction.reply({
            content: "Failed to remove user: Not whitelisted by you.",
            flags: MessageFlags.Ephemeral
          });
        }

        try {
          if (check.MinecraftUsername === minecraftUsernameToRemove) {
            await userSchema.updateOne(
              { DiscordID: interaction.user.id },
              { $unset: { MinecraftUsername: "" } }
            );
          } else if (
            check.WhitelistedUsers.includes(minecraftUsernameToRemove)
          ) {
            await userSchema.updateOne(
              { DiscordID: interaction.user.id },
              { $pull: { WhitelistedUsers: minecraftUsernameToRemove } }
            );
          }

          const whitelist = await fetchWhitelistFile();
          console.log("Current whitelist content:", whitelist);

          const initialLength = whitelist.length;
          const updatedWhitelist = whitelist.filter(
            (entry) => entry.name !== minecraftUsernameToRemove
          );

          if (updatedWhitelist.length === initialLength) {
            return interaction.reply({
              content: `${minecraftUsernameToRemove} was not found in the whitelist.`,
              flags: MessageFlags.Ephemeral,
            });
          }

          console.log("Updated whitelist after removal:", updatedWhitelist);

          await updateWhitelistFile(updatedWhitelist);

          return interaction.reply({
            content: `Removed ${minecraftUsernameToRemove} from the whitelist.`,
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          console.error("Full error:", error);
          return interaction.reply({
            content: "Failed to modify whitelist",
            flags: MessageFlags.Ephemeral,
          });
        }
        break;

      case "list":
        const hasRole2 = await hasHigherOrEqualRole();

        if (!hasRole2) {
          return interaction.reply({
            content: `You need a role with a higher or equal position to the lowest role to use this command.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        const userId = interaction.user.id;

        try {
          const data = await userSchema.findOne({ DiscordID: userId });

          if (!data) {
            const embed = new EmbedBuilder()
              .setTitle("Error")
              .setDescription(
                "Looks like you never whitelisted yourself or anyone."
              )
              .setColor("Red");

            return interaction.reply({
              embeds: [embed],
              flags: MessageFlags.Ephemeral,
            });
          }

          const userMinecraftName = data.MinecraftUsername || "None";
          const whitelistedUsers = data.WhitelistedUsers || [];
          const footer = `Your Minecraft Username: ${userMinecraftName}`;
          const maxDescriptionLength = 4096;

          let embeds = [];
          let currentDescription = "";

          whitelistedUsers.forEach((username, index) => {
            const entry = `**${index + 1}.** ${username}\n`;

            if (
              currentDescription.length + entry.length >
              maxDescriptionLength
            ) {
              embeds.push(
                new EmbedBuilder()
                  .setTitle("Whitelisted Users")
                  .setDescription(currentDescription || "None")
                  .setFooter({ text: footer })
              );
              currentDescription = "";
            }

            currentDescription += entry;
          });

          if (currentDescription || embeds.length === 0) {
            embeds.push(
              new EmbedBuilder()
                .setTitle("Whitelisted Users")
                .setDescription(currentDescription || "None")
                .setFooter({ text: footer })
            );
          }

          return interaction.reply({
            embeds,
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          console.error("Error fetching whitelist data:", error);
          return interaction.reply({
            content: "An error occurred while retrieving your whitelist data.",
            flags: MessageFlags.Ephemeral,
          });
        }
        break;
    }
  },
};
