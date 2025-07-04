import pkg from "axios";
import { getAllData, upsertUserData } from "../data/db.js";
const { create } = pkg;
function autoLearn(name, cookie, userid) {
    let axios = create();
    let G_courseId = "";
    let G_courseTimer = null;
    let timer = null;
    axios.defaults.headers.cookie = cookie;
    axios.defaults.headers.post["Content-Type"] =
        "application/x-www-form-urlencoded; charset=UTF-8";
    axios.defaults.headers.post["Referer"] = "https://www.cdjxjy.com";
    axios.defaults.headers.post["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8";
    axios.defaults.headers.post["User-Agent"] =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36";
    //开始
    getAllCourse();
    //每15分钟刷新一次最新学习的课程
    G_courseTimer = setInterval(getAllCourse, 16 * 60 * 1000);
    //更新当前课程的学习时间
    //每分钟更新一次
    timer = setInterval(updateTime, 60 * 1000);

    //获取选择的课程列表,并切换到第一个课程并更新学习记录
    function getAllCourse() {
        G_courseId = "";
        return axios
            .get("https://www.cdjxjy.com/student/SelectCourseRecord.aspx")
            .then((res) => {
                //获取课程信息
                const tips = res.data.match(
                    /您本学年应修网上课程.*学分，已获得.*学时，已选网上课程.*学时，还需要选择.*学时的课程/
                );
                upsertUserData({ userid, tips: tips[0] });

                //获取课程ID
                let str = res.data.match(/DeleteStudentCourse\((.*)\,\'.*/);

                if (!str) {
                    console.log(name);
                    console.log("已选的课程已全部学完，或者还没有选课。");
                    //清除定时器
                    clearInterval(G_courseTimer);
                    clearInterval(timer);
                    return;
                }

                str = str[1].replace(/\'/g, "").split(",");

                //获取到最新的一课,切换到该课程
                selectCourse(str[0]);
                //添加学习记录
                addRecord(
                    str[0],
                    str[1],
                    "课程评价是指根据一定的标准和课程系统信息以科学的方法检查课程的目标、编订和实施是否实现了教育目的，实现的程度如何，以判定课程设计的效果，并据此作出改进课程的决策。"
                );
                //保留当前课程id
                G_courseId = str[0];

                console.log(name, "正在学习：", str[0]);
            })
            .catch((err) => {
                console.log(name);
                console.log("获取课程失败", err);
            });
    }

    function addRecord(courseId, CourseGuId, content) {
        axios
            .post(
                "https://www.cdjxjy.com/ashx/SelectApi.ashx?a=VerifyLearningRecord",
                `selectclassid=${courseId}`
            )
            .then((res) => {
                if (res.data.state !== "success") {
                    //还没有添加学习记录，添加学习记录
                    axios
                        .post(
                            "https://www.cdjxjy.com/ashx/SelectApi.ashx?a=addRecord",
                            `selectclassid=${courseId}&MainContents=${content}&PerceptionExperience=${content}&CourseGuId=${CourseGuId}`
                        )
                        .then((res) => {
                            if (res.data.state === "success") {
                                console.log(name, res.data);
                            }
                        });
                }
            });
    }
    function selectCourse(courseId) {
        axios
            .post(
                "https://www.cdjxjy.com/ashx/SelectApi.ashx?a=IsOpenOldWeb",
                `selectclassid=${courseId}`
            )
            .then((res) => {
                if (res.data.state === "success") {
                    //如果之前打开了其他课程切换到该课程
                    axios
                        .post(
                            "https://www.cdjxjy.com/ashx/SelectApi.ashx?a=UpdateSelectState",
                            `selectclassid=${courseId}`
                        )
                        .then((res) => {
                            console.log(name,res.data);
                        });
                }
            });
    }

    function updateTime() {
        //更新时间，每隔5分钟请求
        if (!G_courseId) {
            return;
        }
        axios
            .post(
                "https://www.cdjxjy.com/ashx/SelectApi.ashx?a=UpdateLookTime",
                `selectclassid=${G_courseId}`
            )
            .then((res) => {
                console.log(`${name}更新${G_courseId}学习时间:`, res.data);
            });
    }
    return () => {
        //返回一个函数，停止学习
        clearInterval(timer);
        clearInterval(G_courseTimer);
        timer = null;
        G_courseTimer = null;
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
                let fn = autoLearn(
                    item.username,
                    item.userCookies,
                    item.userid
                );
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
