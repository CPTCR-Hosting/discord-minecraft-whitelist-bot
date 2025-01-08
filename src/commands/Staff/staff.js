const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

const userSchema = require("../../schemas/users");
const {
  fetchUUID,
  fetchWhitelistFile,
  updateWhitelistFile,
} = require("../../utils/whitelistHelpers");

const staffroleId = "YOUR LOWEST STAFF ROLE ID";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Staff system")
    .addSubcommandGroup((group) =>
      group
        .setName("whitelist")
        .setDescription("Manage the whitelist")
        .addSubcommand((sub) =>
          sub
            .setName("add")
            .setDescription("Add a user to the whitelist")
            .addStringOption((o) =>
              o
                .setName("username")
                .setDescription("Minecraft username to whitelist")
                .setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("remove")
            .setDescription("Remove a user from the whitelist")
            .addStringOption((o) =>
              o
                .setName("username")
                .setDescription("Minecraft username to remove")
                .setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("view")
            .setDescription("View a user's whitelist entries")
            .addUserOption((o) =>
              o
                .setName("user")
                .setDescription("Discord user to view whitelist entries for")
                .setRequired(true)
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("lookup")
        .setDescription(
          "Find out who whitelisted a specific Minecraft username"
        )
        .addStringOption((o) =>
          o
            .setName("username")
            .setDescription("Minecraft username to look up")
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();

    async function checkStaff() {
      const member = interaction.guild.members.cache.get(interaction.user.id);

      if (!member.roles.cache.has(staffroleId)) {
        return false;
      }

      return true;
    }

    async function addStaff() {
      const staffID = interaction.user.id;

      const data = await userSchema.findOne({ DiscordID: staffID });

      if (!data) {
        data = new userSchema({
          DiscordID: interaction.user.id,
          Staff: True,
          MinecraftUsername: null,
          WhitelistedUsers: [],
        });
      } else {
        data.Staff = true;
      }

      await data.save();
    }

    if (subcommandGroup === "whitelist") {
      if (subcommand === "add") {
        const isStaff = await checkStaff();

        if (!isStaff) {
          return interaction.reply({
            content: `Command only available for staff members.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        await addStaff();
        const data = await userSchema.findOne({
          DiscordID: interaction.user.id,
        });

        const minecraftUsername = interaction.options.getString("username");

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

          data.WhitelistedUsers.push(minecraftUsername);

          await data.save();

          return interaction.reply({
            content: `Successfully added \`${minecraftUsername}\` to the whitelist.`,
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          console.error(
            "[STAFF] Error:",
            error.response?.data || error.message || error
          );
          return interaction.reply({
            content: "Failed to modify the whitelist. Please try again later.",
            flags: MessageFlags.Ephemeral,
          });
        }
      } else if (subcommand === "remove") {
        const isStaff = await checkStaff();

        if (!isStaff) {
          return interaction.reply({
            content: `Command only available for staff members.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        await addStaff();

        const minecraftUsernameToRemove =
          interaction.options.getString("username");
        if (!minecraftUsernameToRemove) {
          return interaction.reply({
            content: "Please provide a Minecraft username to remove.",
            flags: MessageFlags.Ephemeral,
          });
        }

        try {
          const whitelist = await fetchWhitelistFile();
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

          let data = await userSchema.findOne({
            MinecraftUsername: minecraftUsernameToRemove,
          });

          if (data) {
            data.MinecraftUsername = null;
            await data.save();
          }

          data = await userSchema.findOne({
            WhitelistedUsers: minecraftUsernameToRemove,
          });

          let message = "";
          if (data) {
            data.WhitelistedUsers = data.WhitelistedUsers.filter(
              (username) => username !== minecraftUsernameToRemove
            );
            await data.save();

            const discordId = data.DiscordID;

            message = `Removed ${minecraftUsernameToRemove} from the whitelist and from the list of <@${discordId}>.`;
          } else {
            message = `Removed ${minecraftUsernameToRemove} from the whitelist.`;
          }

          //   console.log("Updated whitelist after removal:", updatedWhitelist);

          await updateWhitelistFile(updatedWhitelist);

          return interaction.reply({
            content: message,
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          console.error("[STAFF] Error:", error);
          return interaction.reply({
            content: "Failed to modify whitelist",
            flags: MessageFlags.Ephemeral,
          });
        }
      } else if (subcommand === "view") {
        const isStaff = await checkStaff();

        if (!isStaff) {
          return interaction.reply({
            content: `Command only available for staff members.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        await addStaff();

        const user = interaction.options.getUser("user");

        if (!user) {
          return interaction.reply({
            content: "Please mention a user.",
            ephemeral: true,
          });
        }

        const userid = user.id;

        try {
          const data = await userSchema.findOne({ DiscordID: userid });

          if (!data) {
            return interaction.reply({
              content:
                "Failed to find the user. The user has not been whitelisted in the database.",
              flags: MessageFlags.Ephemeral,
            });
          }

          if (!data.WhitelistedUsers || data.WhitelistedUsers.length === 0) {
            return interaction.reply({
              content: "This user exists but has not whitelisted anyone.",
              flags: MessageFlags.Ephemeral,
            });
          }

          const userMinecraftName = data.MinecraftUsername || "None";
          const whitelistedUsers = data.WhitelistedUsers || [];

          const header = `Whitelisted Users of ${user.username}`;
          const footer = `Own Minecraft Username: ${userMinecraftName}`;
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
                  .setTitle(header)
                  .setDescription(currentDescription)
                  .setFooter({ text: footer })
              );
              currentDescription = "";
            }

            currentDescription += entry;
          });

          if (currentDescription) {
            embeds.push(
              new EmbedBuilder()
                .setTitle(header)
                .setDescription(currentDescription)
                .setFooter({ text: footer })
            );
          }

          return interaction.reply({
            embeds,
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          return interaction.reply({
            content: "An error occurred while retrieving user data.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    }

    if (subcommand === "lookup") {
      const isStaff = await checkStaff();

      if (!isStaff) {
        return interaction.reply({
          content: `Command only available for staff members.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      await addStaff();

      const username = interaction.options.getString("username");

      const data = await userSchema.findOne({ WhitelistedUsers: username });

      if (!data) {
        return interaction.reply({
          content: "Failed to find the user.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const embed = new EmbedBuilder()
        .setDescription(`> **${username}** has been whitelisted by:`)
        .addFields(
          { name: "Discord ID:", value: `${data.DiscordID}`, inline: true },
          { name: "Discord Tag:", value: `<@${data.DiscordID}>`, inline: true },
          {
            name: "Minecraft Name:",
            value: `${data.MinecraftUsername || "No username"}`,
            inline: true,
          }
        );

      return interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }

    return interaction.reply({
      content: "Invalid command or subcommand.",
      flags: MessageFlags.Ephemeral,
    });
  },
};
