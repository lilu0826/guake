const {create} = require("axios");

module.exports.autoLearn = function (name, cookie) {
    let axios = create();
    let G_courseId = "",
        timer = null;
    axios.defaults.headers.cookie = cookie;
    axios.defaults.headers.post["Content-Type"] =
        "application/x-www-form-urlencoded; charset=UTF-8";
    axios.defaults.headers.post["Referer"] = "https://www.cdjxjy.com";
    axios.defaults.headers.post["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8";
    axios.defaults.headers.post["User-Agent"] =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36";
    //开始
    getAllCourse();
    //每15分钟刷新一次
    setInterval(getAllCourse, 16 * 60 * 1000);
    //获取选择的课程列表
    function getAllCourse() {
        clearInterval(timer);
        return axios
            .get("https://www.cdjxjy.com/student/SelectCourseRecord.aspx")
            .then((res) => {
                // console.log(res.data)
                //DeleteStudentCourse('e33d652c-b7a1-4be7-9f1b-be95c8ddf88e','a73cd735-d21d-48dc-901c-dc2041e33c30','2022/5/22 22:39:02')

                let str = res.data.match(/DeleteStudentCourse\((.*)\,\'.*/);

                if (!str) {
                    console.log(name);
                    console.log("已选的课程已全部学完，或者还没有选课。");
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
                //更新其时间
                G_courseId = str[0];
                //清除上次的
                clearInterval(timer);
                //开始更新
                console.log(str[1]);
                timer = setInterval(updateTime, 60 * 1000);
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
                                console.log(name);
                                console.log(res.data);
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
                            console.log(name);
                            console.log(res.data);
                        });
                }
            });
    }

    function updateTime() {
        //更新时间，每隔5分钟请求
        axios
            .post(
                "https://www.cdjxjy.com/ashx/SelectApi.ashx?a=UpdateLookTime",
                `selectclassid=${G_courseId}`
            )
            .then((res) => {
                console.log(name);
                console.log(res.data, G_courseId);
            });
    }
};
