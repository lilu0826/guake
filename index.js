const axios = require('axios');

//张敏
const cookie = "UM_distinctid=17bf85cf77f678-0e32ab438aed14-a7d173c-1fa400-17bf85cf780ac4; Authorization=eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ6aGFuZ21pbjIwMDUiLCJhdWRpZW5jZSI6IndlYiIsImF1dGgiOlsiUk9MRV9URUFDSEVSX1VTRVIiXSwiY3JlYXRlZCI6MTYzMjI5MzY3NDI1MSwic3ViamVjdElkIjpudWxsLCJzdWJJZCI6IjJjOTgyOGNlN2JiOTYyZDAwMTdiYjk4MTY5ZjcwNDU1IiwiYXJlYUNvZGUiOiI1MTAxMDgiLCJjbGFzc0lkIjoiMmM5ODI4Y2M3YjdkNmZhYzAxN2JiOTM0YmI3ZTBiYTgiLCJtYW5hZ2VyQ29kZSI6bnVsbCwic2Nob29sSWQiOiIyYzk4MjhjZTdiNmViOTI4MDE3YmI5MzRiYjc5MmZiMCIsInRlbmFudElkIjoxLCJleHAiOjE2MzI4OTg0NzQsInByb2plY3RJZCI6IjM4In0.ZAx76aMhJRjIubQ477M1CBLaUfNo8Nn1JSt2wysyqo-PRx_OVve5Q5mm3PVjE3uF3PR_4KK0BPmqxzIxz6zcvA; Authorization_token=%7B%22name%22%3A%22%E5%BC%A0%E6%95%8F%22%2C%22avatar%22%3A%22https%3A%2F%2Fgw.alipayobjects.com%2Fzos%2Frmsportal%2FBiazfanxmamNRoxxVxka.png%22%2C%22userid%22%3A%222c9828ce7bb962d0017bb98169f70455%22%2C%22areaCode%22%3A%22510108%22%2C%22areaName%22%3Anull%2C%22tenantId%22%3Anull%2C%22managerCode%22%3Anull%2C%22notifyCount%22%3A%220%22%2C%22proSubName%22%3Anull%2C%22impersonate%22%3Afalse%2C%22originIdentityUserId%22%3Anull%2C%22areaLevel%22%3Anull%2C%22tenantType%22%3Anull%2C%22schoolId%22%3A%222c9828ce7b6eb928017bb934bb792fb0%22%2C%22schoolName%22%3Anull%2C%22projectId%22%3A%2238%22%2C%22projectName%22%3A%22%E6%88%90%E9%83%BD%E5%B8%82%E6%88%90%E5%8D%8E%E5%8C%BA%E4%BF%A1%E6%81%AF%E6%8A%80%E6%9C%AF%E5%BA%94%E7%94%A8%E8%83%BD%E5%8A%9B%E6%8F%90%E5%8D%87%E5%B7%A5%E7%A8%8B2.0%E9%A1%B9%E7%9B%AE%22%2C%22classId%22%3A%222c9828cc7b7d6fac017bb934bb7e0ba8%22%2C%22subjectId%22%3Anull%2C%22studentId%22%3A%222c9828cc7b7d6fac017bb9816a122186%22%2C%22identityCode%22%3Anull%2C%22projectType%22%3A%22INFOMATIONPROJECT%22%2C%22roles%22%3A%5B%22ROLE_TEACHER_USER%22%5D%2C%22projectStartTime%22%3A%222021-06-01%22%2C%22projectEndTime%22%3A%222021-12-31%22%2C%22planningState%22%3Anull%2C%22testPaperState%22%3A%220%22%2C%22testFlag%22%3Anull%2C%22groupType%22%3Anull%2C%22groupId%22%3Anull%2C%22token%22%3A%22eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ6aGFuZ21pbjIwMDUiLCJhdWRpZW5jZSI6IndlYiIsImF1dGgiOlsiUk9MRV9URUFDSEVSX1VTRVIiXSwiY3JlYXRlZCI6MTYzMjI5MzY3NDI1MSwic3ViamVjdElkIjpudWxsLCJzdWJJZCI6IjJjOTgyOGNlN2JiOTYyZDAwMTdiYjk4MTY5ZjcwNDU1IiwiYXJlYUNvZGUiOiI1MTAxMDgiLCJjbGFzc0lkIjoiMmM5ODI4Y2M3YjdkNmZhYzAxN2JiOTM0YmI3ZTBiYTgiLCJtYW5hZ2VyQ29kZSI6bnVsbCwic2Nob29sSWQiOiIyYzk4MjhjZTdiNmViOTI4MDE3YmI5MzRiYjc5MmZiMCIsInRlbmFudElkIjoxLCJleHAiOjE2MzI4OTg0NzQsInByb2plY3RJZCI6IjM4In0.ZAx76aMhJRjIubQ477M1CBLaUfNo8Nn1JSt2wysyqo-PRx_OVve5Q5mm3PVjE3uF3PR_4KK0BPmqxzIxz6zcvA%22%7D; CNZZDATA1277803829=1716797685-1631953120-http%253A%252F%252F2020scxj.yanxiuonline.com%252F%7C1632291366";





axios.defaults.headers = { cookie };

//获取需要学习的能力点
function retrieveAbilities() {
    return axios
        .get("http://2020scxj.yanxiuonline.com/api/v1/activity/assessmentAbility/abilitiesByTeacherRole")
        .then(res => {
            //获取所有能力点
            const category = res.data.rows.filter(el => el.checked).concat(res.data.requiredAbilities).map(el => el.id)
            return category;
        })
        .catch(err => {
            console.log("获取课程失败")
        })
}

//获取全部课程
function retrieveCourse(abilityId) {
    return axios
        .get(`http://2020scxj.yanxiuonline.com/api/v1/activity/abilityActivity/teacher/${abilityId}?segmentType=COMPULSORY_COURSE&defaultCurrent=1&pageSize=100`)
        .then(res => {
            return res.data.rows
        })
        .catch(err => {
            console.log("获取课程列表失败", abilityId);
        })
}

//配置课程自动挂课
function startSetNewTime(courseList) {

    courseList = courseList.filter(el => el.participateState != "COMPLETED");//筛选出需要更新的

    if (courseList.length == 0) { //全部学完了
        console.log("全部课程已学习完毕！");
        return;
    }

    for (const el of courseList) {
        console.log(`${el.name}:     ${el.studyTime}/${el.topTime}---${el.participateStateStr}`)
        axios
            .post(`http://2020scxj.yanxiuonline.com/api/v1/activity/segmentParticipations/${el.id}/setStudyTimeNew`)
            .then(({ data }) => {
                if (data.success) {
                    console.log("当前挂课课程： ", el.name, "更新课程时间： ", data.segmentParticipation.studyTime)
                    el.participateState = data.segmentParticipation.state;
                    el.studyTime = data.segmentParticipation.studyTime;//设置为最新时间
                }
            })
            .catch(err => {
                console.log("更新时间失败", el.name)
            })
    }
    console.log("剩余课程总数量：", courseList.length);

    let totalStudyTime = courseList.reduce((pre, value) => {
        return pre + value.studyTime;
    }, 0)
    let totalTime = courseList.reduce((pre, value) => {
        return pre + value.topTime;
    }, 0)
    console.log("剩余课程学习时间(分钟)：", totalTime - totalStudyTime);
}

async function trackAll(courseList) {
    for (const el of courseList) {
        const res = await axios.get(`http://2020scxj.yanxiuonline.com/admin/lock/Study?id=${el.compulsoryCourseId}&segmentId=${el.id}`, {
            headers: {
                Accept: "text/html"
            }
        });

        let result = [...res.data.matchAll(/data-id="(\w*\d*)"/g)];
        result = result.map(el => el[1]);
        //获取微课程ID

        console.log(el.name, result.length)

        for (const courseInfoId of result) {
            //添加学习记录
            await axios.post("http://2020scxj.yanxiuonline.com/api/v1/onlineLearning/studyRecord/trackCourse", {
                courseInfoId,
                courseParentId: el.compulsoryCourseId,
            })
            //
            let resultTrack = await axios.post("http://2020scxj.yanxiuonline.com/api/v1/onlineLearning/studyRecord/trackTime", {
                courseInfoId,
                courseParentId: el.compulsoryCourseId,
                finishState: "FINISH",
                point: 418.682896
            })
            console.log(resultTrack.data);
        }
    }
}

//执行挂课
(async function () {

    let courses = [];
    let ids = await retrieveAbilities();
    console.log("获取的能力点个数为：", ids.length);
    //console.log("获取的能力点为：", ids);

    for (const id of ids) {
        let lessenes = await retrieveCourse(id);
        courses = courses.concat(lessenes);
    }
    console.log("获取全部课程数:   ", courses.length);


    //trackAll(courses);


    setInterval(() => {
        console.clear();
        startSetNewTime(courses);
    }, 1 * 60 * 1000);//1分钟执行一次


    var http = require('http');
    http.createServer(function (request, response) {
        response.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8' });
        response.write("<h1>张维</h1>")
        let courseList = courses.filter(el => el.participateState != "COMPLETED");//筛选出需要更新的

        if (courseList.length == 0) { //全部学完了
            response.end(`<h2>全部课程已学习完毕！</h2>`);
            return;
        }
        let totalStudyTime = courseList.reduce((pre, value) => {
            return pre + value.studyTime;
        }, 0)
        let totalTime = courseList.reduce((pre, value) => {
            return pre + value.topTime;
        }, 0)
        response.write(`<h2>剩余课程总数量：${courseList.length}</h1>`);
        response.end(`<h2>剩余课程学习时间(分钟)：${totalTime - totalStudyTime}</h2>`);

    }).listen(8888);
    // 终端打印如下信息
    console.log('Server running at http://127.0.0.1:8888/');
})();