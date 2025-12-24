import pkg from "axios";
import { getUserAgent } from "./randomUserAgent.js";
import { upsertUserData } from "./db.js";
//配置axios请求实例
const { create } = pkg;
let axios = create();
axios.defaults.headers.post["Content-Type"] = "application/json;charset=UTF-8";
axios.defaults.headers["Referer"] = "https://www.cdsjxjy.cn/cdcte/";
axios.defaults.headers["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8";
axios.defaults.headers["User-Agent"] = getUserAgent();

//获取读书评价学分
async function getBookCredit(token) {
    const res = await axios.get(
        "https://www.cdsjxjy.cn/prod/stu/book/Comment/getCredit",
        {
            headers: {
                token: token,
            },
        }
    );
    return res.data.data.value;
}

//获取反思周记学分
async function getWeeklyCredit(token) {
    const res = await axios.get(
        "https://www.cdsjxjy.cn/prod/stu/reflect/weekly/getCredit",
        {
            headers: {
                token: token,
            },
        }
    );
    return res.data.data.value;
}

export async function updateCredit({ token, username }) {
    const weeklyCredit = await getWeeklyCredit(token);
    const bookCredit = await getBookCredit(token);
    upsertUserData({
        username,
        weeklyCredit,
        bookCredit,
    });
}
