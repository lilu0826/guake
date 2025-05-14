process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
process.on("uncaughtException", function (err) {
    console.log(err.message);
});

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
    data.forEach((item) => {
        item.tips = item.tips.replace("还需要选择", "还需要学习");
    });
    const usernames = data.map((item) => item.username).reverse();
    const completed = data.map((el) => el.tips.match(/\d+\.?\d*/g)[1]).reverse();
    const uncompleted = data.map((el) => el.tips.match(/\d+\.?\d*/g)[3]).reverse();
    res.render("index", { data: data, usernames, completed, uncompleted });
});

//直接重定向登录，由后端跟踪登录状态
app.get("/login", async function (req, res) {
    const { code } = await createLoginToUrl();
    console.log("二维码内容:", code);
    res.redirect(302, code);
});

var server = app.listen(8081, function () {
    var port = server.address().port;
    console.log("应用实例，访问地址为 http://%s:%s", "localhost", port);
});
