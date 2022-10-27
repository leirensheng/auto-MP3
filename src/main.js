let startBrowser = require("./startBrowser");
const { sleep,checkPort } = require("./utils");
const path = require("path");
let fs = require("fs");
var liveServer = require("live-server");

class Main {
  constructor() {
    this.files = [];
    this.page = null;
    this.info = null;
    this.getInfoJson();
  }
  getInfoJson() {
    this.info = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), "./info.json"), "utf-8")
    );
  }
  updateJson() {
    fs.writeFileSync(
      path.resolve(process.cwd(), "./info.json"),
      JSON.stringify(this.info, null, 4)
    );
  }

  getFiles() {
    let fileInfo = fs
      .readdirSync(path.resolve(__dirname, "../public/song"))
      .filter((one) => one.includes("mp3"))
      .map((one) => ({
        name: one,
        createTime: fs.statSync(path.resolve(__dirname, "../public/song", one))
          .ctimeMs,
      }))
      .sort((a, b) => a.createTime - b.createTime);

    this.files = fileInfo.map((one) => one.name);

    this.refreshPageSong();
  }
  checkAndRemoveFile() {
    let hasDone = this.info.hasDone;
    if (hasDone.length > this.info.maxLength) {
      let fileToRemove = this.info.hasDone.shift();
      console.log("开始删除文件", fileToRemove);
      fs.unlinkSync(path.resolve(__dirname, "../public/song", fileToRemove));
      console.log("删除成功");
      this.updateJson();
    }
  }
  refreshPageSong() {
    let needToPlay = this.files.filter(
      (one) => !this.info.hasDone.includes(one)
    );
    this.page.evaluate((files) => {
      let dom = document.querySelector("textarea");
      dom.value = files.join("\n");
      dom.dispatchEvent(new Event("input"));
    }, needToPlay);
  }
  handlePlayEnd(val) {
    let fileName = val.split("/").slice(-1)[0];
    // console.log(fileName);
    this.info.hasDone.push(fileName);
    this.updateJson();
    this.refreshPageSong();
    this.checkAndRemoveFile();
  }
  openBrowser() {
    return new Promise((resolve) => {
      startBrowser(async (page) => {
        this.page = page;
        await page.goto(`localhost:8181`);
        await page.exposeFunction("sendTextNode", (type, val) => {
          // console.log("接收到页面的信息", type, val);
          if (type === "canPlay") {
          } else if (type === "end") {
            this.handlePlayEnd(val);
          }
        });
        resolve();
      });
    });
  }
  startHtmlServer() {
    var params = {
      port: 8181,
      host: "0.0.0.0",
      root: path.resolve(process.cwd(), "./public"),
      open: false,
      ignorePattern: /song/,
      file: "index.html",
      logLevel: 2,
      middleware: [
        function (req, res, next) {
          next();
        },
      ],
    };
    liveServer.start(params);
  }
  watchFileChange() {
    fs.watch(
      path.resolve(process.cwd(), "./public/song"),
      {
        recursive: false,
      },
      (eventType, filename) => {
        this.getFiles();
      }
    );
  }
}

(async () => {
  try {
	await checkPort(8181)
    let obj = new Main();
    obj.startHtmlServer();
    await obj.openBrowser();
    obj.watchFileChange();
    obj.getFiles();
  } catch (e) {
    console.log(e);
  }
})();
