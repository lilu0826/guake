const {
    createLogin,
    wxQrloginCheck,
    wxQrlogin,
    SelectCourseRecord,
} = require("./jxjy-login");
var express = require("express");
const fs = require("fs");

var app = express();

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

app.get("/wxLogin", async function (req, res) {
    // openid=oH-jTv7vuBcuJ-mAhxc2m6qVI9sQ
    // https://www.cdjxjy.com/Project/API/UserAPI.ashx?a=wxteacherlogin
    // {code: 1, api: '/Project/API/UserAPI.ashx?a=', openid: 'oH-jTv7vuBcuJ-mAhxc2m6qVI9sQ'}
    let openid = req.query.openid;
    const data = await wxQrlogin(openid);
    res.send(data);
});

app.get("/userList", async function (req, res) {
    const str = fs.readFileSync("./cookies.json").toString();
    const cookies = JSON.parse(str);

    for (const item of cookies) {
        const html = await SelectCourseRecord(item.userCookies);
        console.log(typeof html);
        const tips = html.match(
            /您本学年应修网上课程.*学分，已获得.*学时，已选网上课程.*学时，还需要选择.*学时的课程/
        );
        item.tips = tips[0];
    }

    res.send(cookies);
});

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/public/index.html");
})
app.get("/status", function (req, res) {
    res.sendFile(__dirname + "/public/status.html");
})

var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("应用实例，访问地址为 http://%s:%s", host, port);
});
