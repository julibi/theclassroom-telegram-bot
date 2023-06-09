const ethers = require("ethers");
const TelegramBot = require("node-telegram-bot-api");
const ABI = require("./abi.json");
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(express.json());

const TCR_PROD = "0x4D4243567413C47665e33b4EafFf58b934D23e41";
const TCR_DEV = "0x8F8F4e3cfcd89Dc2020E8d2615d96C8d19383F22";
const isProd = process.env.ENVIRONMENT === "PROD";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHATID = process.env.CHATID;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
const contractAddress = isProd ? TCR_PROD : TCR_DEV;
const alchemyWebSockets = isProd
  ? process.env.ALCHEMY_WEBSOCKET_PROD_URL
  : process.env.ALCHEMY_WEBSOCKET_DEV_URL;

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
      const result = await contract.characters(character);
      const name = result.name;

      bot.sendMessage(
        CHATID,
        `Account ${truncateAddress(account)} wrote text for character "${
          name ?? character
        }" with NFT #${tokenId}. It is the ${index}th text of TheRetreat${
          isProd && " on production"
        }.`
      );
    });

    contract.on("CharacterSet", (account, characterId, name) => {
      bot.sendMessage(
        CHATID,
        `Account ${truncateAddress(
          account
        )} just setup a characterId ${characterId}, name: ${name}${
          isProd && " on production"
        }.`
      );
    });
  } catch (e) {
    return { statusCode: 500, body: "Something went wrong." };
  }
}
main();

app.get("/", (req, res) => {
  res.status(200).send({ theretreat: "looks good" });
});

app.listen(port, () => {
  console.log("Listening for TheRetreat Activity");
});
