let shell = require('shelljs');
function padLeftZero(str) {
  return ("00" + str).substr(str.length);
}
function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
module.exports = {
  getRandom,

  checkPort(port) {
    let order = `netstat -ano|findstr ${port}`;
    let res = shell.exec(order)
    if(res.stdout){
      throw new Error('端口被占用')
    }
  },
  sleep(time, max) {
    let realTime = time;
    if (max) {
      realTime = getRandom(time, max);
    }
    return new Promise((resolve) => setTimeout(resolve, realTime));
  },
  //   async sendMsg(title, content) {
  //     let url =
  //       "https://sc.ftqq.com/SCU140452T9252cb72421645e17678387c06a491eb5fe9fa509e160.send?text=" +
  //       encodeURIComponent(title) +
  //       "&desp=" +
  //       encodeURIComponent(content);
  //     await request(url);
  //   },

  getNameLength(name) {
    let length = 0;
    for (let i = 0; i < name.length; i++) {
      const isChinese = /[\u4e00-\u9fa5]|（|）|；|，|。|【|】/.test(name[i]);
      length += isChinese ? 2 : 1;
    }
    return length;
  },
  formatDate(date, fmt = "yyyy-MM-dd hh:mm:ss") {
    if (typeof date !== "object") {
      date = new Date(Number(date));
    }
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        (date.getFullYear() + "").substr(4 - RegExp.$1.length)
      );
    }
    const o = {
      "M+": date.getMonth() + 1,
      "d+": date.getDate(),
      "h+": date.getHours(),
      "m+": date.getMinutes(),
      "s+": date.getSeconds(),
    };
    for (const k in o) {
      if (new RegExp(`(${k})`).test(fmt)) {
        const str = o[k] + "";
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length === 1 ? str : padLeftZero(str)
        );
      }
    }
    return fmt;
  },

  appendCode: (page) => {
    let code = `;$$ =(val)=> [...document.querySelectorAll(val)];$=(val)=>document.querySelector(val);`;
    page.evaluateOnNewDocument(code);
  },

  autoScroll: async (page) => {
    return page.evaluate(() => {
      return new Promise((resolve, reject) => {
        let totalHeight = 0;
        let distance = 100;
        let timer = setInterval(() => {
          let scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  },
};
