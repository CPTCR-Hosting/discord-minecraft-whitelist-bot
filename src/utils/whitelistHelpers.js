const axios = require("axios");

const apiKey = process.env.apiKey;
const serverId = process.env.serverId;

const API_HEADERS = {
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

/**
 * @param {string} username 
 * @returns {Promise<string>}
 */
async function fetchUUID(username) {
  const response = await axios.get(
    `https://api.mojang.com/users/profiles/minecraft/${username}`
  );
  const rawUuid = response.data.id;
  return `${rawUuid.slice(0, 8)}-${rawUuid.slice(8, 12)}-${rawUuid.slice(12, 16)}-${rawUuid.slice(16, 20)}-${rawUuid.slice(20)}`;
}

/**
 * @returns {Promise<Object[]>}
 */
async function fetchWhitelistFile() {
  const response = await axios.get(
    `https://panel.cptcr.cc/api/client/servers/${serverId}/files/contents?file=whitelist.json`,
    { headers: API_HEADERS }
  );
  const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;

  if (!Array.isArray(data)) {
    console.warn("Whitelist file is not an array. Resetting to empty array.");
    return [];
  }
  return data;
}

/**
 * @param {Object[]} whitelist
 */
async function updateWhitelistFile(whitelist) {
  await axios.post(
    `https://panel.cptcr.cc/api/client/servers/${serverId}/files/write?file=whitelist.json`,
    JSON.stringify(whitelist, null, 2),
    { headers: API_HEADERS }
  );
}

module.exports = {
  fetchUUID,
  fetchWhitelistFile,
  updateWhitelistFile,
};
