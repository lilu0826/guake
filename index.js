process.on("uncaughtException", function (err) {
    console.log(err.message);
});

const originalConsoleLog = console.log;
console.log = function log(message, ...args) {
    const time = new Date().toLocaleString("zh-CN");
    originalConsoleLog(`[${time}] ${message}`, ...args);
};

import { createLoginToUrl } from "./utils/login.js";
import express from "express";
import compression from "compression";
import { getAllData } from "./data/db.js";

var app = express();
app.use(compression());
app.use("/public", express.static("public"));

app.set("views", "./views");
app.set("view engine", "ejs");

//获取状态
app.get("/", async function (req, res) {
    const data = await getAllData();
    res.render("index", { data });
});

//直接重定向登录，由后端跟踪登录状态
app.get("/login", async function (req, res) {
    const { loginUrl } = await createLoginToUrl();
    res.redirect(302, loginUrl);
});

var server = app.listen(8081, function () {
    var port = server.address().port;
    console.log("应用实例，访问地址为 http://%s:%s", "localhost", port);
});
