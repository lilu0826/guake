let { autoLearn } = require("./jxjy")

let cookies = require("./cookies")

console.log('cookies',cookies.length)

//cookie启动
cookies.forEach(c => autoLearn(c));