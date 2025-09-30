import pkg from "axios";
import cron from "node-cron";
import { enqueue } from "./queueTask.js";
import { getAllData, upsertUserData } from "./db.js";
const { create } = pkg;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function autoLearn({ realName, token, username }) {
    const controller = new AbortController();
    let axios = create();
    axios.defaults.headers.token = token;
    axios.defaults.headers.post["Content-Type"] =
        "application/json;charset=UTF-8";
    axios.defaults.headers.post["Referer"] = "https://www.cdsjxjy.cn/cdcte/";
    axios.defaults.headers.post["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8";
    axios.defaults.headers.post["User-Agent"] =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36";
    axios.defaults.signal = controller.signal;

    //获取学习配置
    async function getStudyConfig() {
        const res = await axios.get(
            "https://www.cdsjxjy.cn/prod/stu/student/study/config/get"
        );
        console.log(realName, "获取学习配置：", res.data.data);
        return res.data.data;
    }

    async function generateCourseComment(name) {
        try {
            const res = await axios.post(
                "https://api.hunyuan.cloud.tencent.com/v1/chat/completions",
                {
                    messages: [
                        {
                            role: "user",
                            content: `课程名称:${name}
                            你是一名教师，现在正在学习上述课程的教学内容，
                            请帮忙写一个简短的课程学习感受，主要是教学技巧等，
                            要100字左右，
                            纯文本输出。
                            要求:不要markdown标记`,
                        },
                    ],
                    model: "hunyuan-lite",
                },
                {
                    headers: {
                        Authorization:
                            "Bearer sk-S1vOklie4GCzcjbcNkNnZtKEsAokoR0DokmTlnpf6tHCE5MD",
                        "content-type": "application/json; charset=utf-8",
                    },
                }
            );
            return res.data.choices[0].message.content;
        } catch (error) {
            return "好";
        }
    }

    //获取课程统计信息
    async function getCourseDatasts() {
        const res = await axios.post(
            "https://www.cdsjxjy.cn/prod/stu/student/course/page/datasts",
            {}
        );
        // {
        //   "TotalCount": 1, //总数
        //   "EndCount": 0,   //已完成
        //   "NotEndCount": 1 //未完成
        // }
        console.log(realName, "课程统计：", res.data.data);
        let tips = `登陆状态错误，需要重新登陆！`;
        if (res.data.data) {
            const { TotalCount, EndCount, NotEndCount } = res.data.data;
            tips = `已选课程${TotalCount}个,已完成${EndCount}个,未完成${NotEndCount}个`;
        }
        upsertUserData({
            username,
            TotalCount: 0,
            EndCount: 0,
            NotEndCount: 0,
            ...res.data.data,
            tips,
        });
        return res.data.data;
    }

    //获取全部课程列表
    async function getCourseList() {
        const { TotalCount } = await getCourseDatasts();
        const res = await axios.post(
            "https://www.cdsjxjy.cn/prod/stu/student/course/page/selected",
            {
                pageNum: 1,
                pageSize: TotalCount,
            }
        );
        console.log(realName, "获取课程个数：", res.data.data.content.length);
        return res.data.data.content;
    }

    //开始学习获取课程信息
    async function startCourse(selectId) {
        const res = await axios.post(
            "https://www.cdsjxjy.cn/prod/stu/student/course/study/start",
            {
                selectId,
            }
        );
        // {
        //     "hasOther": false,
        //     "sessionId": "xxxxxxxxxxxxxxxxxxxxxxxx",
        //     "watchingFinished": false,
        //     "requiredTime": 2400,
        //     "duration": 1124,
        //     "recordFinished": false
        // }
        const { hasOther, sessionId } = res.data.data;
        if (hasOther) {
            //结束其他课程
            await endCourse(sessionId);
            //开始新课程
            return startCourse(selectId);
        }
        console.log(realName, "开始学习课程：", selectId, res.data.data);
        return res.data.data;
    }

    //结束之前得学习
    async function endCourse(sessionId) {
        const res = await axios.post(
            "https://www.cdsjxjy.cn/prod/stu/student/course/study/end",
            {
                sessionId,
            }
        );
        console.log(
            realName,
            "结束学习课程：",
            sessionId,
            res.data.code == 200
        );
        return res.data.code == 200;
    }

    // 跟踪学习记录（发送心跳）
    async function trackCourse(sessionId) {
        const res = await axios.post(
            "https://www.cdsjxjy.cn/prod/stu/student/course/study/heartbeat",
            {
                sessionId,
            }
        );
        // {
        //     "watchingFinished": false, //观看完成
        //     "creditObtained": false, // 学分获得
        //     "verifyCode": "3465", // 验证码
        //     "duration": 2007 //学习时长
        // }
        console.log(realName, "跟踪学习时长：", sessionId, res.data.data);
        return res.data.data;
    }

    //发送验证码
    async function verifyCourse(sessionId, verifyCode) {
        const res = await axios.post(
            "https://www.cdsjxjy.cn/prod/stu/student/course/study/verify",
            {
                sessionId,
                verifyCode,
            }
        );
        console.log(
            realName,
            "发送验证码：",
            sessionId,
            verifyCode,
            res.data.code == 200
        );
        return res.data.code == 200;
    }

    // 添加学习记录
    async function addRecord(selectId, content = "好") {
        const res = await axios.post(
            "https://www.cdsjxjy.cn/prod/stu/learning/record",
            {
                selectId,
                feeling: content,
                courseContent: content,
            }
        );
        console.log(realName, "添加学习记录：", selectId, res.data.code == 200);
        return res.data.code == 200;
    }

    async function study() {
        const courseList = await getCourseList();
        const config = await getStudyConfig();
        for (const course of courseList) {
            //过滤掉不需要学习的课程
            if (course.endStatus === 1) continue;

            const { selectId, requiredTime } = course;
            const { sessionId, recordFinished, watchingFinished } =
                await startCourse(selectId);
            if (!recordFinished) {
                // 添加学习记录 控制下并发
                const content = await enqueue(() =>
                    generateCourseComment(course.courseName)
                );
                console.log("content", content);
                await addRecord(selectId, content);
            }
            if (!watchingFinished) {
                //跟踪学习记录
                while (true) {
                    const {
                        creditObtained,
                        verifyCode,
                        watchingFinished,
                        duration,
                    } = await trackCourse(sessionId);
                    if (
                        creditObtained ||
                        watchingFinished ||
                        duration >= requiredTime
                    ) {
                        //学分获得
                        break;
                    }
                    if (verifyCode) {
                        //发送验证码
                        await verifyCourse(sessionId, verifyCode);
                    }
                    await delay(1000 * config.interval);
                }
            }
            if (sessionId) {
                //学习完了直接结束掉当前课程
                await endCourse(sessionId);
            }

            //更新课程统计信息
            await getCourseDatasts();
        }
    }

    (async () => {
        while (true) {
            try {
                await study();
                console.log(realName, "学习完成");
                break;
            } catch (error) {
                if (error.message == "canceled") {
                    console.log(realName, "学习取消");
                    break;
                }
                console.log(realName, "学习出错，正在重试！", error.message);
                await delay(5000);
            }
        }
    })();

    // 每天晚上 8 点执行 将学习任务取消
    cron.schedule(
        "0 20 * * *",
        ({ task }) => {
            controller.abort();
            // 执行一次后销毁任务
            task?.destroy();
        },
        { timezone: "Asia/Shanghai" }
    );
}

function keepAlive({ token, realName }) {
    let axios = create();
    axios.defaults.headers.token = token;
    axios.defaults.headers.post["Content-Type"] =
        "application/json;charset=UTF-8";
    axios.defaults.headers.post["Referer"] = "https://www.cdsjxjy.cn/cdcte/";
    axios.defaults.headers.post["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8";
    axios.defaults.headers.post["User-Agent"] =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36";

    axios
        .get("https://www.cdsjxjy.cn/prod/stu/student/study/config/get")
        .then(function (response) {
            // console.log(realName, "keepAlive success");
        })
        .catch(function (error) {
            // console.log(realName, "keepAlive error");
        });
}

// 开始学习
async function start(timeLabel) {
    console.log(`[${new Date().toLocaleString()}] 执行任务：${timeLabel}`);
    const data = await getAllData();
    console.log("data", data.length);
    data.forEach(autoLearn);
}

// 每天早上 9 点执行
cron.schedule(
    "0 9 * * *",
    () => {
        start("早上9点");
    },
    { timezone: "Asia/Shanghai" }
);

// 检查是否在 9:00 - 20:00 之间，如果在则立即执行一次任务
function checkAndRun(task) {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 9 && hour < 20) {
        console.log(
            `[${now.toLocaleString()}] 检测到服务器启动时间在9点~20点之间，立即执行一次任务。`
        );
        task("启动补执行");
    } else {
        console.log(
            `[${now.toLocaleString()}] 当前时间不在9点~20点之间，不执行补任务。`
        );
    }
}

// token保活 5 分钟
setInterval(async () => {
    const data = await getAllData();
    data.forEach(keepAlive);
}, 1000 * 60 * 5);

// 检查是否在 9:00 - 20:00 之间，如果在则立即执行一次任务
checkAndRun(start);

// 新登录后检查是否需要自动学习
export const checkAndRunAutoLearn = (item) => {
    checkAndRun(() => autoLearn(item));
};
