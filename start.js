process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

let { autoLearn } = require("./jxjy")
const fs = require("fs")



const str = fs.readFileSync("./cookies.json").toString()
const cookies = JSON.parse(str)

console.log('cookies',cookies.length)

//cookie启动
cookies.forEach(c => autoLearn(c.username,c.userCookies));