process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
process.on("uncaughtException", function (err) {
    console.log(err.message);
});

import {
    createLogin,
    wxQrloginCheck,
    SelectCourseRecord,
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
app.get("/getImage", async function (req, res) {
    const data = await createLogin();
    res.send(data);
});

app.get("/wxQrloginCheck", async function (req, res) {
    let codeid = req.query.codeid;
    const data = await wxQrloginCheck(codeid);
    res.send(data);
});

app.get("/userList", async function (req, res) {
    const cookies = await getAllData();
    for (const item of cookies) {
        const html = await SelectCourseRecord(item.userCookies);
        const tips = html.match(
            /您本学年应修网上课程.*学分，已获得.*学时，已选网上课程.*学时，还需要选择.*学时的课程/
        );
        item.tips = tips[0];
    }
    res.send(cookies);
});

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/public/index.html");
});
app.get("/status", function (req, res) {
    res.sendFile(__dirname + "/public/status.html");
});

var server = app.listen(8081, function () {
    var port = server.address().port;
    console.log("应用实例，访问地址为 http://%s:%s", "localhost", port);
});
