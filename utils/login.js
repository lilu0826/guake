import pkg from "axios";
import courseidList from "../data/courseList.js";
import { restart } from "./autoLearn.js";
import { upsertUserData, getAllData } from "../data/db.js";
import { v4 as uuidv4 } from "uuid";
function generateUUIDWithoutDash() {
    return uuidv4().replace(/-/g, "");
}
function getId() {
    return +new Date() + "n" + Math.ceil(1e3 * Math.random());
}

//配置axios请求实例
const { create } = pkg;
let axios = create();
axios.defaults.headers.post["Content-Type"] = "application/json;charset=UTF-8";
axios.defaults.headers.post["Referer"] = "https://www.cdsjxjy.cn/cdcte/";
axios.defaults.headers.post["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8";
axios.defaults.headers.post["User-Agent"] =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36";

//执行选课
async function selectCourse(userInfo) {
    for (const courseid of courseidList) {
        const res = await axios.post(
            "https://www.cdsjxjy.cn/prod/stu/student/course/select",
            { courseId: courseid },
            {
                headers: {
                    token: userInfo.token,
                },
            }
        );
        console.log("选课", courseid, res.data);
    }
}

//执行选课
async function doUserInfoAndSelectCourse(userInfo) {
    //data结构
    // {
    //     "deptId": "B11BDF56-2FE6-483B-9BAA-88A1E638A1A5",
    //     "deptName": "成都市锦官城小学",
    //     "deviceId": "78a5f2ceb17e1d9c6351c67bfe6cd422",
    //     "id": "F7198F84-4911-4A9A-B424-6B6E6FE7ED7D",
    //     "isStudent": 1,
    //     "needVerify": 0,
    //     "realName": "龚婷",
    //     "token": "b8e27535-e8c5-46a8-a41e-e98acf09c3a1",
    //     "username": "a18328070408",
    //     "weakPwd": false
    // }
    //执行选课
    await selectCourse(userInfo);
    //更新用户数据库
    await upsertUserData(userInfo);
    console.log("更新用户数据库成功");
    //重新运行
    restart();
}

//这里直接就登陆了
async function wxQrloginCheck({ qrCodeId, deviceId }) {
    return axios
        .post("https://www.cdsjxjy.cn/prod/loginByQrCode", {
            qrcodeId:qrCodeId,
            deviceId,
        })
        .then((res) => {
            console.log("wxQrloginCheck", res.data);
            let data = res.data.data;
            if (data) {
                //登录成功老师
                //执行选课
                doUserInfoAndSelectCourse(data);
            }
            return Boolean(data);
        });
}

async function createLoginToUrl() {
    const qrCodeId = getId();
    const deviceId = generateUUIDWithoutDash();
    const loginUrl =
        "https://wx.cdsjxjy.cn/#/pages/login/openIdLogin?qrCodeId=" +
        qrCodeId +
        "&deviceId=" +
        deviceId;

    // 轮询登录状态
    // 这里可以使用轮询函数来检查登录状态
    pollingLoginStatus({ qrCodeId, deviceId });
    console.log("loginUrl", loginUrl);
    return { loginUrl };
}

async function poll(
    fn = () => Promise.resolve,
    interval = 2000,
    maxAttempts = 10
) {
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const done = await fn();
            if (done) {
                console.log("轮询结束，任务完成");
                break;
            }
        } catch (err) {
            console.error("轮询出错:", err);
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, interval));
    }

    if (attempts >= maxAttempts) {
        console.warn("达到最大轮询次数，退出轮询");
    }
}

function pollingLoginStatus({ qrCodeId, deviceId }) {
    poll(() => wxQrloginCheck({ qrCodeId, deviceId }), 3000, 10);
}

export { createLoginToUrl };
