import { createLoginToUrl, loginByOpenid } from "./utils/login.js";
import express from "express";
import compression from "compression";
import { getAllData,deleteUserData } from "./utils/db.js";
import { WebSocketServer } from "ws";
import http from "http";
import { getQr } from "./utils/qr.js";
import { write } from "./utils/write.js";

process.on("uncaughtException", function (err) {
    console.log("uncaughtException", err.message);
});
const clientSet = new Set();

const originalConsoleLog = console.log;
console.log = function (message, ...args) {
    const time = new Date().toLocaleString("zh-CN");
    originalConsoleLog(`[${time}] ${message}`, ...args);

    let info =
        `[${time}] ${message}\t` +
        args.map((arg) => JSON.stringify(arg, null, 2)).join("\t") +
        "\n";

    clientSet.forEach((client) => {
        client.send(info);
    });
};

const app = express();
const server = http.createServer(app);
// 挂载 WebSocket 服务器
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
    clientSet.add(ws);
    ws.on("close", () => {
        clientSet.delete(ws);
    });
});

app.use(compression());
app.use("/public", express.static("public"));

app.set("views", "./views");
app.set("view engine", "ejs");

//获取状态
app.get("/java", async function (req, res) {
    const status = req.query.status || "all";
    const fileterMap = {
        all: () => true,
        finish: (item) => item.courseInfo?.NotEndCount == 0,
        unfinish: (item) => item.courseInfo?.NotEndCount > 0,
    }
    const data = await getAllData();
    res.render("index", { total: data.length, data:data.filter(fileterMap[status] || fileterMap.all) });
});

app.get("/delete", async function (req, res) { 
    await deleteUserData(req.query.username)
    res.redirect(req.headers.referer)
})


app.get("/write", async function (req, res) { 
    await write(req.query.token,req.query.username)
    res.send("ok")
})

//直接重定向登录，由后端跟踪登录状态
app.get("/login", async function (req, res) {
    if (req.query.openid) {
        const data = await loginByOpenid({ openid: req.query.openid });
        return res.send(data);
    }
    const { loginUrl } = await createLoginToUrl();
    res.redirect(302, loginUrl);
});


app.get("/login-img", async function (req, res) {
    const { loginUrl } = await createLoginToUrl();
    const dataUrl = await getQr(loginUrl)
    res.render("qrcode", { dataUrl });
});

server.listen(8081, function () {
    var port = server.address().port;
    console.log("应用实例，访问地址为 http://%s:%s", "localhost", port);
});
