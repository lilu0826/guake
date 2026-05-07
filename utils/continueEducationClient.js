import pkg from "axios";
import { getUserAgent } from "./randomUserAgent.js";

const { create } = pkg;

const API_BASE_URL = "https://www.cdsjxjy.cn/prod";
const HUNYUAN_API_URL = "https://api.hunyuan.cloud.tencent.com/v1/chat/completions";
const HUNYUAN_API_KEY = "sk-S1vOklie4GCzcjbcNkNnZtKEsAokoR0DokmTlnpf6tHCE5MD";

function createHttpClient({ token, signal } = {}) {
    const axios = create();
    axios.defaults.headers.token = token;
    axios.defaults.headers.post["Content-Type"] = "application/json;charset=UTF-8";
    axios.defaults.headers["Referer"] = "https://www.cdsjxjy.cn/cdcte/";
    axios.defaults.headers["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8";
    axios.defaults.headers["User-Agent"] = getUserAgent();
    axios.defaults.signal = signal;
    return axios;
}

export function createContinueEducationClient({ token, signal } = {}) {
    const axios = createHttpClient({ token, signal });

    return {
        async getStudyConfig() {
            const res = await axios.get(`${API_BASE_URL}/stu/student/study/config/get`);
            return res.data.data;
        },

        async generateCourseComment(name) {
            try {
                const res = await axios.post(
                    HUNYUAN_API_URL,
                    {
                        messages: [
                            {
                                role: "system",
                                content: `你是一名教师，正在参加继续教育的课程学习，
                                需要根据课程名称写一个课程学习感受，
                                主要内容是教学技巧相关和一些感悟，200字左右.
                                【强制规则】
                                - 永远不要使用 Markdown
                                - 永远不要使用任何格式标记
                                - 不要输出列表、标题、强调符号
                                - 只能输出纯文本`,
                            },
                            {
                                role: "user",
                                content: `课程名称:${name}`,
                            },
                        ],
                        model: "hunyuan-lite",
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${HUNYUAN_API_KEY}`,
                            "content-type": "application/json; charset=utf-8",
                        },
                    }
                );
                return res.data.choices[0].message.content;
            } catch (error) {
                return "好";
            }
        },

        async getCourseDatasts() {
            const res = await axios.post(`${API_BASE_URL}/stu/student/course/page/datasts`, {});
            const creditRes = await axios.get(`${API_BASE_URL}/stu/student/course/getCredit`);
            return { ...res.data.data, obtainedValue: creditRes.data.data?.value };
        },

        async getSelectedCourses(pageSize) {
            const res = await axios.post(`${API_BASE_URL}/stu/student/course/page/selected`, {
                pageNum: 1,
                pageSize,
            });
            return res.data.data.content;
        },

        async startCourse(selectId) {
            const res = await axios.post(`${API_BASE_URL}/stu/student/course/study/start`, {
                selectId,
            });
            return res.data.data;
        },

        async endCourse(sessionId) {
            const res = await axios.post(`${API_BASE_URL}/stu/student/course/study/end`, {
                sessionId,
            });
            return res.data.code == 200;
        },

        async trackCourse(sessionId) {
            const res = await axios.post(`${API_BASE_URL}/stu/student/course/study/heartbeat`, {
                sessionId,
            });
            return res.data.data;
        },

        async verifyCourse(sessionId, verifyCode) {
            const res = await axios.post(`${API_BASE_URL}/stu/student/course/study/verify`, {
                sessionId,
                verifyCode,
            });
            return res.data.code == 200;
        },

        async addRecord(selectId, content = "好") {
            const res = await axios.post(`${API_BASE_URL}/stu/learning/record`, {
                selectId,
                feeling: content,
                courseContent: content,
            });
            return res.data.code == 200;
        },

        async getBookCredit() {
            const res = await axios.get(`${API_BASE_URL}/stu/book/Comment/getCredit`);
            return res.data.data.value;
        },

        async getWeeklyCredit() {
            const res = await axios.get(`${API_BASE_URL}/stu/reflect/weekly/getCredit`);
            return res.data.data.value;
        },
    };
}
