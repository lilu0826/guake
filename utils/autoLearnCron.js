import { enqueue } from "./queueTask.js";
import { getAllData, upsertUserData } from "./db.js";
import { updateCredit } from "./updateCredit.js";
import { createContinueEducationClient } from "./continueEducationClient.js";
import { write } from "./write.js";
const learningControllers = new Map();

function createCanceledError() {
    const error = new Error("canceled");
    error.name = "CanceledError";
    return error;
}

const delay = (ms, signal) =>
    new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(createCanceledError());
            return;
        }

        const timer = setTimeout(() => {
            signal?.removeEventListener("abort", handleAbort);
            resolve();
        }, ms);

        function handleAbort() {
            clearTimeout(timer);
            signal?.removeEventListener("abort", handleAbort);
            reject(createCanceledError());
        }

        signal?.addEventListener("abort", handleAbort);
    });

function autoLearn({ realName, token, username }) {
    stop(username);

    const controller = new AbortController();
    learningControllers.set(username, controller);

    const client = createContinueEducationClient({
        token,
        signal: controller.signal,
    });

    //获取学习配置
    async function getStudyConfig() {
        const data = await client.getStudyConfig();
        console.log(realName, "获取学习配置：", data);
        return data;
    }

    //获取课程统计信息
    async function getCourseDatasts() {
        const data = await client.getCourseDatasts();
        const stats = { ...data };
        delete stats.obtainedValue;
        // {
        //   "TotalCount": 1, //总数
        //   "EndCount": 0,   //已完成
        //   "NotEndCount": 1 //未完成
        // }
        console.log(realName, "课程统计：", stats);
        return data;
    }

    //获取全部课程列表
    async function getCourseList() {
        const { TotalCount, EndCount, NotEndCount, obtainedValue } =
            await getCourseDatasts();
        const courses = await client.getSelectedCourses(TotalCount);
        console.log(realName, "获取课程个数：", courses.length);

        let totalPeriod = courses.reduce((pre, cur) => pre + cur.period, 0);
        upsertUserData({
            username,
            courseInfo: {
                TotalCount,
                EndCount,
                NotEndCount,
                totalPeriod: totalPeriod.toFixed(2),
                obtainedValue,
            },
        });

        return courses;
    }

    //开始学习获取课程信息
    async function startCourse(selectId) {
        const data = await client.startCourse(selectId);
        // {
        //     "hasOther": false,
        //     "sessionId": "xxxxxxxxxxxxxxxxxxxxxxxx",
        //     "watchingFinished": false,
        //     "requiredTime": 2400,
        //     "duration": 1124,
        //     "recordFinished": false
        // }
        const { hasOther, sessionId } = data;
        if (hasOther) {
            //结束其他课程
            await endCourse(sessionId);
            //开始新课程
            return startCourse(selectId);
        }
        console.log(realName, "开始学习课程：", selectId, data);
        return data;
    }

    //结束之前得学习
    async function endCourse(sessionId) {
        const success = await client.endCourse(sessionId);
        console.log(realName, "结束学习课程：", sessionId, success);
        return success;
    }

    // 跟踪学习记录（发送心跳）
    async function trackCourse(sessionId) {
        const data = await client.trackCourse(sessionId);
        // {
        //     "watchingFinished": false, //观看完成
        //     "creditObtained": false, // 学分获得
        //     "verifyCode": "3465", // 验证码
        //     "duration": 2007 //学习时长
        // }
        console.log(realName, "跟踪学习时长：", sessionId, data);
        return data;
    }

    //发送验证码
    async function verifyCourse(sessionId, verifyCode) {
        const success = await client.verifyCourse(sessionId, verifyCode);
        console.log(realName, "发送验证码：", sessionId, verifyCode, success);
        return success;
    }

    // 添加学习记录
    async function addRecord(selectId, content = "好") {
        const success = await client.addRecord(selectId, content);
        console.log(realName, "添加学习记录：", selectId, success);
        return success;
    }

    async function study() {
        const { weeklyCredit, bookCredit } = await updateCredit({
            token,
            username,
            signal: controller.signal,
        });
        console.log(realName, "weeklyCredit", weeklyCredit);
        console.log(realName, "bookCredit", bookCredit);
        if (weeklyCredit + bookCredit < 16) {
            write(token, username);
        }
        const courseList = await getCourseList();
        const config = await getStudyConfig();
        for (const course of courseList) {
            //过滤掉不需要学习的课程(endStatus表示观看完，且有commit记录)
            if (course.endStatus === 1 && course.courseCommit) continue;

            const { selectId, requiredTime } = course;
            const { sessionId, recordFinished, watchingFinished } =
                await startCourse(selectId);
            if (!recordFinished) {
                // 添加学习记录 控制下并发
                const content = await enqueue(() =>
                    client.generateCourseComment(course.courseName),
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

                    await upsertUserData({
                        username,
                        currentCourse: {
                            courseName: course.courseName,
                            requiredTime,
                            duration,
                        },
                    });

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
                    await delay(1000 * config.interval, controller.signal);
                }
            }
            if (sessionId) {
                //学习完了直接结束掉当前课程
                await endCourse(sessionId);
            }

            //更新课程统计信息
            await getCourseList();
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
                    if (learningControllers.get(username) === controller) {
                        learningControllers.delete(username);
                    }
                    break;
                }
                console.log(realName, "学习出错，正在重试！", error.message);
                await delay(5000);
            }
        }
    })();
}

export function stop(username) {
    const controller = learningControllers.get(username);
    if (!controller) return false;

    controller.abort();
    learningControllers.delete(username);
    return true;
}

export const stopAutoLearn = stop;

function keepAlive({ token, realName }) {
    const client = createContinueEducationClient({ token });
    client
        .getStudyConfig()
        .then(function (response) {
            console.log(realName, "keepAlive success");
        })
        .catch(function (error) {
            console.log(realName, "keepAlive error");
        });
}

// 开始学习
async function start(timeLabel) {
    console.log(`[${new Date().toLocaleString()}] 执行任务：${timeLabel}`);
    const data = await getAllData();
    console.log("data", data.length);
    data.forEach(autoLearn);
}

// token保活 5 分钟
setInterval(
    async () => {
        const data = await getAllData();
        data.forEach(keepAlive);
    },
    1000 * 60 * 5,
);

// 服务启动后全天候直接执行一次任务
start("启动执行");

// 新登录后检查是否需要自动学习
export const checkAndRunAutoLearn = (item) => {
    autoLearn(item);
};
