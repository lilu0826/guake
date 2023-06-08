const axios = require('axios');

//何巧
const cookie = "ASP.NET_SessionId=mcufgdugxsukxawuzzsnmtgq; login_type_from=person; logincookie=HoZjo8RA-AT60A-AC5eGkwoLaqneU8z8GQLdBAamnvK0LuVsHu5GXtIWieJcNo51wA-AwucE0mM9aSd0B9K/TIhEcXGAjNzUr6HQCRMSDzUzloT0S7Is0s3A-AkrhqE9VdHkijP6eYEpXkHmE4DmAsVjJqZlw7H/LqVClEnRczuyyAcBcZMvaSyK0bTCjd8gXEQ/92tTWD6k0qmfM4wRxD3WxT0o7QHVou/YynhpRCfKec1htdgA-AkVtF/ddGfoBlRDzAojuFMYPOxQCZN0/Snxs/uPjA/gkU86CMJ12QKSc29IG5d0MSqxnhaTMCkz/mPwmkc3lXHoUs2xgQ4y4FTWf8xyEXTMFGsnaOuS3YmIwV3kwhnSlbQYhTKosft6YMA-AMPxH2L0gxK/Bznt5uJCRy0ZRm6YIA3EQFZ94c5KqhxH5n23yGh1f2enAeRjhitj2Ntavf8KrbyA8A-AJ5USCe5NmIst55x65cjUJDA-AU8P5ZC/hOfWmftRcHp7qj9UGrxAPCUPdqBm6ZDfHCPLvMxFnxrTURDjZKOodgrOKkwTZ6m7nh/lbSUmK8bq3ywzRAtunmZjuY3QE0yD4SUuJ87ArEOex4xvYsfPNKXK9LNA-AjYODBKJpKUoA1sQU/P8ByA3DvO4pK0enTelPoE1xSVYW7e8Ej3V8wxNSSlsEXiVWsSFH0CQSl4vTjqZn0qxg/xA3PQHlm43lT9LCCvtKNmxdO8Ks0dZt0TwrVekl/3wJymM2j568wLtDlugNnqulsc4A-AA-AZMbC3UA2b0pJ8i3zH9lPxoYm0zyW1JgwYrcLm8ibjSnA-A6D/0ICutKhSWAHkL0jAh5f2r35z2MQeieYHr1QQ07q1QRx1Ll8n1s8shEy8Wx9ftd2SgGodhPxmeJCXhlRBLsVuk8CqNxX4dQvrUH2pFYJLubtbdQ3MsJIE7JXE3vBMrf42BcMtxS4U3ooktDCobokojFoLHt9Op4qJG4gTJ3aj8bmRrcUq0fz8gZMNvAXYX/XPMBxAc1Yptl/K7esTch6I2lxfTZuUXA-Ad4SoIwqQtUEVb0pkCz6GnWAIfYiTPlm4hWc3d9k/3DjZuCV9S677t2WrOaVyEQrYqECZjsTWOA-AjGgh3aoFPeZxmM5J39APqmA6TA-ABLZumP9A451A-AWaQWc3P6gOKJQyeVSdw35idYl8EicTjWNNW2ruj6OW8A-A61oss7q25XDI5eekM3geWs9r1wCmfKOtbKPcNnvcPsA-AFkxDdk7TtgAwXwmFrA2RFFCqPpZMWMC1UKFrfg00ri8bNy4izvF8Tw89nB8WBE2iBpMmgY27k8MfWE46lkdg2aS9/XhD/o=";

let G_courseId = "",timer = null



axios.defaults.headers.cookie = cookie;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
axios.defaults.headers.post['Referer'] = 'https://www.cdjxjy.com';
axios.defaults.headers.post['Accept-Language'] = 'zh-CN,zh;q=0.9,en;q=0.8';
axios.defaults.headers.post['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36';



//开始
getAllCourse()
//每15分钟刷新一次
setInterval(getAllCourse, 16 * 60 * 1000)








//获取选择的课程列表
function getAllCourse() {
    return axios
        .get("https://www.cdjxjy.com/student/SelectCourseRecord.aspx")
        .then(res => {
            //console.log(res.data)
            //DeleteStudentCourse('e33d652c-b7a1-4be7-9f1b-be95c8ddf88e','a73cd735-d21d-48dc-901c-dc2041e33c30','2022/5/22 22:39:02')

            let str = res.data.match(/DeleteStudentCourse\((.*)\,\'.*/)

            if(!str) return;

            str = str[1].replace(/\'/g,"").split(",")
            
            //获取到最新的一课,切换到该课程
            selectCourse(str[0])
            //添加学习记录
            addRecord(str[0],str[1],"课程评价是指根据一定的标准和课程系统信息以科学的方法检查课程的目标、编订和实施是否实现了教育目的，实现的程度如何，以判定课程设计的效果，并据此作出改进课程的决策。")
            //更新其时间
            G_courseId = str[0]
            //清除上次的
            clearInterval(timer)
            //开始更新
            console.log(str[1]);
            timer = setInterval(updateTime, 60 * 1000)
        })
        .catch(err => {
            console.log("获取课程失败",err)
        })
}

function addRecord(courseId,CourseGuId,content){
    axios.post("https://www.cdjxjy.com/ashx/SelectApi.ashx?a=VerifyLearningRecord",
                            `selectclassid=${courseId}`
    ).then(res=>{
        if(res.data.state !== "success"){
            //还没有添加学习记录，添加学习记录
            axios.post("https://www.cdjxjy.com/ashx/SelectApi.ashx?a=addRecord",
                        `selectclassid=${courseId}&MainContents=${content}&PerceptionExperience=${content}&CourseGuId=${CourseGuId}`
            ).then(res=>{
                console.log(res.data)
                if(res.data.state === "success"){
                    console.log(res.data)
                }
            })
        }
    })
}
function selectCourse(courseId){
    axios.post("https://www.cdjxjy.com/ashx/SelectApi.ashx?a=IsOpenOldWeb",
                `selectclassid=${courseId}`
            ).then(res=>{
                if(res.data.state === "success"){
                        //如果之前打开了其他课程切换到该课程
                        axios.post("https://www.cdjxjy.com/ashx/SelectApi.ashx?a=UpdateSelectState",
                            `selectclassid=${courseId}`
                        ).then(res=>{
                            console.log(res.data)
                        })
                }
            })
}

function updateTime(){
    //更新时间，每隔5分钟请求
    axios.post("https://www.cdjxjy.com/ashx/SelectApi.ashx?a=UpdateLookTime",
    `selectclassid=${G_courseId}`
    ).then(res=>{
        console.log(res.data,G_courseId)
    })
}









