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

const courseidList = [
    "fff2f80a-5872-477a-8d80-f3646defa0ca",
    "ffe847fe-a45e-4096-9f55-9f8a2b2cadb8",
    "ff469400-17c1-4739-a280-c617eec546b2",
    "ff1ebdab-7395-4c36-b7d1-e2769ad0d56f",
    "fe6d26e4-1f19-4ad7-9448-dc41c0778132",
    "fd64d61c-44b5-4381-9737-d6cd32a5f992",
    "fc8bf122-5fb4-4b4e-9bc6-d54c0fac26a1",
    "fc76b768-04c0-479d-8d88-2eb2365017e0",
    "fc73ec9b-79c2-4dfc-b799-5ea1cdfaad89",
    "fbcbcbce-5a53-45f6-8a79-ec61abd3e74a",
];

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
