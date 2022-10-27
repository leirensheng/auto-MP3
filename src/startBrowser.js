let puppeteer = require("puppeteer-core");
const { appendCode, sleep } = require("./utils");
let options;

let init = async (start) => {
  const findChrome = require("../node_modules/carlo/lib/find_chrome");
  let findChromePath = await findChrome({});
  let executablePath = findChromePath.executablePath;
  options = {
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ignoreDefaultArgs: ["--enable-automation"],
    headless: false,
  };
  browser = await puppeteer.launch(options);
  const page = await browser.newPage(); //打开一个空白页
  appendCode(page)
  await start(page,browser);
};

module.exports = init;
