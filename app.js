const ethers = require("ethers");
const TelegramBot = require("node-telegram-bot-api");
const ABI = require("./abi.json");
require("dotenv").config();

const isProd = process.env.ENVIRONMENT === "PROD";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHATID = process.env.CHATID;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
// const contractAddress = isProd ? "" : TCR_DEV;
// const alchemyWebSockets = isProd
//   ? process.env.ALCHEMY_WEBSOCKET_PROD_URL
//   : process.env.ALCHEMY_WEBSOCKET_DEV_URL;
const contractAddress = process.env.TCR_DEV;
const alchemyWebSockets = process.env.ALCHEMY_WEBSOCKET_DEV_URL;

const truncateAddress = (address) => {
  const addressStart = address.substring(0, 6);
  const addressLength = address.length;
  const cut = addressLength - 5;
  const addressEnd = address.substring(addressLength, cut);
  return `${addressStart}...${addressEnd}`;
};

async function main() {
  try {
    const provider = new ethers.providers.WebSocketProvider(alchemyWebSockets);
    const contract = new ethers.Contract(contractAddress, ABI, provider);

    contract.on("Written", async (account, tokenId, character, index) => {
      const name = await contract.characters(character)?.name;

      bot.sendMessage(
        CHATID,
        `Account ${truncateAddress(account)} wrote text for character "${
          name ?? character
        }" with NFT #${tokenId}. It is the ${index}th text of TheRetreat.`
      );
    });

    contract.on("CharacterSet", (account, characterId, name) => {
      bot.sendMessage(
        CHATID,
        `Account ${truncateAddress(
          account
        )} just setup a characterId ${characterId}, name: ${name}.`
      );
    });

    return { statusCode: 200, body: "Great" };
  } catch (e) {
    return { statusCode: 500, body: "Something went wrong." };
  }
}
main();
