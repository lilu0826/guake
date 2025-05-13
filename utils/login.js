import pkg from "axios";
import courseidList from "../data/courseList.js";
import { restart } from "./autoLearn.js";
import { upsertUserData } from "../data/db.js";

//配置axios请求实例
const { create } = pkg;
let axios = create();
axios.defaults.headers.post["Content-Type"] =
    "application/x-www-form-urlencoded; charset=UTF-8";
axios.defaults.headers.post["Referer"] = "https://www.cdjxjy.com";
axios.defaults.headers.post["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8";
axios.defaults.headers.post["User-Agent"] =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36";

//执行选课
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

//获取用户名和用户id
async function GetInfo(Cookie) {
    const res = await axios.post(
        "https://www.cdjxjy.com/ashx/HomeApi.ashx?a=GetInfo",
        "",
        {
            headers: {
                Cookie: Cookie,
            },
        }
    );
    return res.data.data;
}

//获取选课记录
async function SelectCourseRecord(Cookie) {
    const res = await axios.get(
        "https://www.cdjxjy.com/student/SelectCourseRecord.aspx",
        {
            headers: {
                Cookie: Cookie,
            },
            responseType: "text",
        }
    );
    return res.data;
}

//创建登录二维码
async function createLogin() {
    return axios
        .post("https://www.cdjxjy.com/ashx/BaseApi.ashx?a=CreateLogin")
        .then((res) => {
            return res.data;
        });
}

//执行选课
function doUserInfoAndSelectCourse(userCookies) {
    const userObj = { userCookies };
    GetInfo(userCookies).then((info) => {
        userObj.userid = info.UserCode;
        userObj.username = info.UserName;
        //执行选课
        selectCourse(userCookies).then(() => {
            //更新用户数据库
            upsertUserData(userObj).then(() => {
                console.log("更新用户数据库成功");
                //重新运行
                restart();
            });
        });
    });
}

//这里直接就登陆了
async function wxQrloginCheck(codeid) {
    return axios
        .post(
            "https://www.cdjxjy.com/ashx/weixindispose.ashx?a=wxQrloginCheck",
            "codeid=" + codeid
        )
        .then((res) => {
            if (res.data.code == 1) {
                //拿到logincookie以及sessionId
                const hs = res.headers["set-cookie"].map((c) => {
                    return c.substring(0, c.indexOf(";"));
                });
                hs.push("login_type_from=person");
                const userCookies = hs.join(";");
                console.log("userCookies", userCookies);
                doUserInfoAndSelectCourse(userCookies);
            }
            return res.data;
        });
}

export { createLogin, wxQrloginCheck, SelectCourseRecord };
