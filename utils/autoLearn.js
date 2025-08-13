import pkg from "axios";
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

    async function generateCourseComment(name) {
        try {
            const res = await axios.post(
                "https://api.hunyuan.cloud.tencent.com/v1/chat/completions",
                {
                    messages: [
                        {
                            role: "user",
                            content: `课程名称:${name}
                            你是一名教师，现在正在学习上诉课程的教学内容，
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
    async function addRecord(selectId,content="好") {
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
        //这里应该过滤掉已经学完的课程 TODO
        for (const course of courseList) {
            const { selectId, requiredTime } = course;
            const { sessionId, recordFinished, watchingFinished } =
                await startCourse(selectId);
            if (!recordFinished) {
                // 添加学习记录
                const content = await generateCourseComment(course.courseName);
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
                    await delay(5000);
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

    return () => {
        //返回一个函数，停止学习
        controller.abort();
    };
}

function start() {
    let stopList = [];
    let isStop = false;
    getAllData().then((data) => {
        console.log("data", data.length);
        //遍历所有数据
        if (!isStop) {
            data.forEach((item) => {
                //开始学习
                let fn = autoLearn(item);
                stopList.push(fn);
            });
        }
    });
    return function () {
        //停止学习
        isStop = true;
        stopList.forEach((fn) => {
            fn();
        });
        stopList = [];
    };
}

//开始学习
//每次启动都重新开始学习
let stop = start();

//导出函数,在必要时重新开始学习
export function restart() {
    //停止学习
    stop();
    //重新开始学习
    stop = start();
}
