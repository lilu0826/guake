import pkg from "axios";
import { checkAndRunAutoLearn } from "./autoLearnCron.js";
import { upsertUserData } from "./db.js";
import { v4 as uuidv4 } from "uuid";
import { getUserAgent } from "./randomUserAgent.js";
import fs from "fs";
function generateUUIDWithoutDash() {
    return uuidv4().replace(/-/g, "");
}
function getId() {
    return +new Date() + "n" + Math.ceil(1e3 * Math.random());
}

const MAX_PERIOD = 21;
//配置axios请求实例
const { create } = pkg;
let axios = create();
axios.defaults.headers.post["Content-Type"] = "application/json;charset=UTF-8";
axios.defaults.headers["Referer"] = "https://www.cdsjxjy.cn/cdcte/";
axios.defaults.headers["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8";
axios.defaults.headers["User-Agent"] = getUserAgent();
//执行选课
async function selectCourse(userInfo) {
    //用户信息
    const student = await axios.get(
        `https://www.cdsjxjy.cn/prod/stu/student/getStudent?id=${userInfo.id}`,
        {
            headers: {
                token: userInfo.token,
            },
        }
    );
    //用户已选课程
    const selected = await axios.post(
        "https://www.cdsjxjy.cn/prod/stu/student/course/page/selected",
        {
            pageNum: 1,
            pageSize: 50,
        },
        {
            headers: {
                token: userInfo.token,
            },
        }
    );
    //已选课程
    console.log("已选课程：", selected.data.data.content.length);
    let currentPeriod = selected.data.data.content.reduce(
        (pre, cur) => pre + cur.period,
        0
    );
    const selectedIds = selected.data.data.content.map((item) => item.id);

    // 待选课程
    let res = await axios.post(
        `https://www.cdsjxjy.cn/prod/stu/course/page`,
        {
            teachLevel: student.data.data.teachLevel,
            teachSubject: student.data.data.teachSubject,
            // courseName: "文翁大讲堂",
            // courseType: "703",
            isDisplay: 0,
            pageNum: 1,
            pageSize: 100,
        },
        {
            headers: {
                token: userInfo.token,
            },
        }
    );

    const totalPeriod = res.data.data.content.reduce(
        (pre, cur) => pre + cur.period,
        0
    );

    if (totalPeriod < MAX_PERIOD) {
        console.log("总学时小于20，重新拉取不带参数的课程");
        const commonRes = await axios.post(
            `https://www.cdsjxjy.cn/prod/stu/course/page`,
            {
                courseType: "703", //师德师风
                isDisplay: 0,
                pageNum: 1,
                pageSize: 100,
            },
            {
                headers: {
                    token: userInfo.token,
                },
            }
        );
        // 合并课程
        res.data.data.content = [
            ...res.data.data.content,
            ...commonRes.data.data.content,
        ];
    }

    console.log("用户待选课程：", res.data.data.content.length);
    // 开始选课 要求大于20学识
    for (const element of res.data.data.content) {
        if (currentPeriod >= MAX_PERIOD) {
            console.log("选课完成，当前学时", currentPeriod);
            break;
        }
        if (!selectedIds.includes(element.id)) {
            console.log("可以选课", element.id);
            await axios.post(
                "https://www.cdsjxjy.cn/prod/stu/student/course/select",
                {
                    courseId: element.id,
                },
                {
                    headers: {
                        token: userInfo.token,
                    },
                }
            );
            currentPeriod += element.period;
            console.log("选课成功，当前学时", currentPeriod);
        }
    }
}

//执行选课
async function doUserInfoAndSelectCourse(userInfo) {
    //更新用户数据库
    const { upsert } = await upsertUserData({
        ...userInfo,
        createTime: Date.now(),
    });
    console.log("更新用户数据库成功");
    //执行选课
    await selectCourse(userInfo);
    // 开启学习 当是新插入时，已有的话只更新不执行
    upsert && checkAndRunAutoLearn(userInfo);
}

async function loginByOpenid({ openid }) {
    return axios
        .post("https://www.cdsjxjy.cn/prod/loginByOpenid", {
            openid,
        })
        .then(async (res) => {
            console.log("loginByOpenid", res.data);
            let data = res.data.data;
            if (data) {
                //登录成功
                //执行选课
                await doUserInfoAndSelectCourse(data);
            }
            return res.data;
        });
}

//这里直接就登陆了
async function wxQrloginCheck({ qrCodeId, deviceId }) {
    return axios
        .post("https://www.cdsjxjy.cn/prod/loginByQrCode", {
            qrcodeId: qrCodeId,
            deviceId,
        })
        .then((res) => {
            console.log("wxQrloginCheck", res.data);
            let data = res.data.data;
            if (data) {
                //登录成功
                //执行选课
                doUserInfoAndSelectCourse({ ...data, qrCodeId });
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
    return { qrCodeId, loginUrl };
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
    poll(() => wxQrloginCheck({ qrCodeId, deviceId }), 3000, 30);
}

export { createLoginToUrl, loginByOpenid };
