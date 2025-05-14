process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
process.on("uncaughtException", function (err) {
    console.log(err.message);
});

import {
    createLogin,
    wxQrloginCheck,
    SelectCourseRecord,
    createLoginToUrl,
} from "./utils/login.js";
import express from "express";
import compression from "compression";
import { getAllData } from "./data/db.js";
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var app = express();
app.use(compression());
app.use("/public", express.static("public"));
// app.get("/getImage", async function (req, res) {
//     const data = await createLogin();
//     res.send(data);
// });

// app.get("/wxQrloginCheck", async function (req, res) {
//     let codeid = req.query.codeid;
//     const data = await wxQrloginCheck(codeid);
//     res.send(data);
// });

app.get("/userList", async function (req, res) {
    const cookies = await getAllData();
    res.send(cookies);
});

// app.get("/", function (req, res) {
//     res.sendFile(__dirname + "/public/index.html");
// });
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/public/status.html");
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
