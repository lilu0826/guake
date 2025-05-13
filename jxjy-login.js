const { create } = require("axios");
const fs = require("fs");

//启动任务
const { fork } = require("child_process");
let child = fork("./start.js");

let axios = create();
axios.defaults.headers.post["Content-Type"] =
    "application/x-www-form-urlencoded; charset=UTF-8";
axios.defaults.headers.post["Referer"] = "https://www.cdjxjy.com";
axios.defaults.headers.post["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8";
axios.defaults.headers.post["User-Agent"] =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36";

const courseidList = require("./courseList.js")

async function selectCourse(Cookie) {
    for (const courseid of courseidList) {
        const res = await axios.post(
            "https://www.cdjxjy.com/ashx/SelectApi.ashx?a=SelectCourse",
            "courseid=" + courseid,
            {
                headers: {
                    Cookie: Cookie,
                },
            }
        );
        console.log(res.data);
    }
}

async function SelectCourseRecord(Cookie) {
    const res = await axios.get(
        "https://www.cdjxjy.com/student/SelectCourseRecord.aspx",
        {
            headers: {
                Cookie: Cookie
            },
            responseType: "text",
        }
    );
    return res.data;
}

async function createLogin() {
    return axios
        .post("https://www.cdjxjy.com/ashx/BaseApi.ashx?a=CreateLogin")
        .then((res) => {
            return res.data;
        });
}

async function wxQrloginCheck(codeid) {
    return axios
        .post(
            "https://www.cdjxjy.com/ashx/weixindispose.ashx?a=wxQrloginCheck",
            "codeid=" + codeid
        )
        .then((res) => {
            return res.data;
        });
}

async function wxQrlogin(openid) {
    return axios
        .post(
            "https://www.cdjxjy.com/Project/API/UserAPI.ashx?a=wxteacherlogin",
            "openid=" + openid
        )
        .then((res) => {
            const hs = res.headers["set-cookie"].map((c) => {
                return c.substring(0, c.indexOf(";"));
            });
            hs.push("login_type_from=person");
            const userCookies = hs.join(";");
            res.data.userCookies = userCookies;
            res.data.openid = openid;
            //执行选课
            selectCourse(userCookies).then(() => {
                const str = fs.readFileSync("./cookies.json").toString();
                const dataArr = JSON.parse(str);
                const dataIndex = dataArr.findIndex(
                    (item) => item.userid === res.data.userid
                );
                if (dataIndex >= 0) {
                    dataArr.splice(dataIndex, 1, res.data);
                } else {
                    dataArr.push(res.data);
                }
                fs.writeFileSync("./cookies.json", JSON.stringify(dataArr));

                //杀掉子进程，并重新运行
                child.kill();
                child = fork("./start.js");
            });
            return res.data;
        });
}

module.exports.createLogin = createLogin;

module.exports.wxQrloginCheck = wxQrloginCheck;

module.exports.wxQrlogin = wxQrlogin;

module.exports.SelectCourseRecord = SelectCourseRecord;
