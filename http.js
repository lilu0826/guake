const { createLogin, wxQrloginCheck,wxQrlogin } = require("./jxjy-login")
var express = require('express');



var app = express();

app.use('/public', express.static('public'));

app.get('/getImage', async function (req, res) {
    const data = await createLogin()
    res.send(data)
})

app.get('/wxQrloginCheck', async function (req, res) {
    let codeid = req.query.codeid
    const data = await wxQrloginCheck(codeid)
    res.send(data)
})

app.get('/wxLogin', async function (req, res) {
    // openid=oH-jTv7vuBcuJ-mAhxc2m6qVI9sQ
    // https://www.cdjxjy.com/Project/API/UserAPI.ashx?a=wxteacherlogin
    // {code: 1, api: '/Project/API/UserAPI.ashx?a=', openid: 'oH-jTv7vuBcuJ-mAhxc2m6qVI9sQ'}
    let openid = req.query.openid
    const data = await wxQrlogin(openid)
    res.send(data)
})



var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("应用实例，访问地址为 http://%s:%s", host, port)
})


