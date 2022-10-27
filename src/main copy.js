let startBrowser = require("./startBrowser");
const { sleep } = require("./utils");
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
    this.info = JSON.parse(fs.readFileSync(path.resolve(__dirname,"../info.json"), "utf-8"));
  }
  updateJson() {
    fs.writeFileSync(path.resolve(__dirname,"../info.json"), JSON.stringify(this.info, null, 4));
  }

  getFiles() {
    let fileInfo = fs
      .readdirSync(path.resolve(__dirname, "../public/song"))
      .filter((one) => one.includes("mp3"))
      .map((one) => ({ name: one,  createTime: fs.statSync(path.resolve(__dirname,'../public/song',one)).ctimeMs }))
      .sort((a, b) => a.createTime - b.createTime);

    this.files = fileInfo.map((one) => one.name);

    if (this.page) {
      this.refreshPageSong();
    }
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
    startBrowser(async (page, browser) => {
      this.page = page;
      page.goto(`localhost:8181`);
      await page.exposeFunction("sendTextNode", (type, val) => {
        // console.log("接收到页面的信息", type, val);
        if (type === "canPlay") {
        } else if (type === "end") {
          this.handlePlayEnd(val);
        }
      });
    });
  }
  startHtmlServer() {
    var params = {
      port: 8181,
      host: "0.0.0.0",
      root: path.resolve(__dirname, "../public"),
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
      path.resolve(__dirname, "../public/song"),
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
	try{
		let obj = new Main();
		obj.startHtmlServer();
		obj.openBrowser();
		await sleep(1000);
		obj.watchFileChange();
		obj.getFiles();
		await sleep(10000000000);
	}catch(e){
		console.log(e)
	}

})();
