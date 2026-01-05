<template>
    <div class="status-page">
        <div class="card">
            <!-- 顶部 -->
            <div class="header">
                <h2>👩‍🏫{{ info.realName }}老师，您好</h2>
                <span class="time">当前时间：{{ now }}</span>
            </div>
        </div>
        <div class="card">
            <div class="section">
                <div class="label">
                    <span class="title">读书笔记/反思周记</span>
                    <a v-if="info.bookCredit + info.bookCredit != 16" class="btn" @click="handleFill">AI一键填写</a>
                </div>
                <div class="course-items">
                    <div class="item">
                        <div class="title">读书笔记学分</div>
                        <div class="content">
                            {{ info.bookCredit }}
                        </div>
                    </div>
                    <div class="item">
                        <div class="title">反思周记学分</div>
                        <div class="content">
                            {{ info.weeklyCredit }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card">
            <!-- 课程统计 -->
            <div class="section">
                <div class="label">视频课程信息</div>
                <div class="course-items">
                    <div class="item">
                        <div class="title">已选课程</div>
                        <div class="content">
                            {{ info.courseInfo?.TotalCount }}
                        </div>
                    </div>
                    <div class="item">
                        <div class="title">未完成</div>
                        <div class="content">
                            {{ info.courseInfo?.NotEndCount }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 课程统计 -->
            <div class="section">
                <div class="label">学分信息</div>
                <div class="course-items">
                    <div class="item">
                        <div class="title">已选课程总学分</div>
                        <div class="content">
                            {{ info.courseInfo?.totalPeriod }}
                        </div>
                    </div>
                    <div class="item">
                        <div class="title">已获得学分（最多20）</div>
                        <div class="content">
                            {{ info.courseInfo?.obtainedValue }}
                        </div>
                    </div>
                </div>
            </div>

            <template v-if="status != 'success'">
                <!-- 课程信息 -->
                <div class="section">
                    <div class="label">当前正在学习课程</div>
                    <div class="course">
                        {{ info.currentCourse?.courseName }}
                    </div>
                </div>

                <!-- 进度条 -->
                <div class="section">
                    <div class="label">学习进度</div>
                    <div class="progress">
                        <div
                            class="progress-bar"
                            :style="{ width: progress + '%' }"
                        ></div>
                    </div>
                    <div class="progress-text">{{ progress }}%</div>
                </div>
            </template>

            <!-- 状态 -->
            <div class="section status-line">
                <!-- <span class="dot" :class="status"></span> -->
                <span class="status-text">{{ statusText }}</span>
            </div>

            <!-- 最近日志 -->
            <div class="section" v-if="status != 'success'">
                <div class="label">最近活动</div>
                <ul class="log">
                    <li v-for="(item, index) in logs" :key="index">
                        <span class="log-time">{{ item.time }}</span>
                        <span class="log-msg">{{ item.msg }}</span>
                    </li>
                </ul>
            </div>
        </div>
        <div class="card">
            <!-- 提示 -->
            <div class="footer">提示：关闭该页面也会自动学习获取学分哦</div>
        </div>


        <teleport to="body">
            <div class="modal" v-if="showTip">
                <div class="modal-content">
                    AI正在自动填写中,大约1-2分钟完成,请耐心等待...
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute,useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const showTip = ref(false);

// 状态数据
const progress = ref(0);
const status = ref("running"); // running | waiting | error
const statusText = ref("🟢 正在学习中");

// 日志
const logs = ref([]);

// 当前时间
const now = ref("");

function updateTime() {
    now.value = new Date().toLocaleTimeString();
}

const info = ref({});

let timer;
function updateStatus() {
    fetch("/api/get-user-info?username=" + route.query.username)
        .then((res) => res.json())
        .then((json) => {
            if (!json.success) {
                router.push("/");
                return;
            }
            info.value = json.data;
            const { duration, requiredTime } = json.data.currentCourse || {
                duration: 0,
                requiredTime: 0,
            };
            progress.value = Math.min(
                Math.max((duration / requiredTime) * 100, 0),
                100
            ).toFixed(2);
            if (json.data.courseInfo.NotEndCount == 0) {
                status.value = "success";
                statusText.value = "✅ 学习已完成";
                clearInterval(timer);
            } else {
                logs.value.unshift({
                    time: new Date().toLocaleTimeString(),
                    msg: "自动播放学习内容",
                });
            }
        });
}

async function handleFill() {
    showTip.value = true;
    console.log('info', info.value)
    try { 
        const response = await fetch(`/api/write?username=${info.value.username}&token=${info.value.token}`);
        const text = await response.text();
        updateStatus()
        showTip.value = false;
    }catch (error) {
        console.log('error', error)
    }
}

onMounted(() => {
    // 模拟状态更新
    updateStatus();
    updateTime();
    setInterval(updateTime, 1000);
    timer = setInterval(updateStatus, 3000);
});
</script>

<style scoped>
.btn {
    margin-left: auto;
    color: #409eff;
    cursor: pointer;
}
.status-page {
    background: #f5f7fa;
    display: flex;
    flex-direction: column;
    padding: 20px;
    gap: 10px;
    max-width: 400px;
    margin: 0 auto;
}

.card {
    background: #fff;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header h2 {
    font-size: 18px;
}

.time {
    font-size: 12px;
    color: #999;
}

.section {
    margin-bottom: 18px;
}
.section:last-child {
    margin-bottom: 0;
}

.label {
    font-weight: bold;
    font-size: 16px;
    color: #333;
    margin-bottom: 6px;
    display: flex;
}

.course {
    font-size: 15px;
    font-weight: 500;
}

.course-items {
    display: flex;
    flex-wrap: wrap;
    margin-top: 6px;
    gap: 16px;
}

.progress {
    width: 100%;
    height: 10px;
    background: #ebeef5;
    border-radius: 5px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: #409eff;
    transition: width 0.4s;
}

.progress-text {
    margin-top: 6px;
    font-size: 13px;
    text-align: right;
}

.status-line {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.dot.running {
    background: #67c23a;
}

.dot.waiting {
    background: #e6a23c;
}

.dot.error {
    background: #f56c6c;
}

.status-text {
    font-weight: 500;
}

.log {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 140px;
    overflow-y: auto;
    font-size: 13px;
}

.log li {
    display: flex;
    gap: 8px;
    padding: 4px 0;
}

.log-time {
    color: #999;
    white-space: nowrap;
}

.log-msg {
    color: #333;
}

.footer {
    font-size: 12px;
    color: #999;
    text-align: center;
}

.modal{
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    transition: all 0.5s ease;
}
.modal-content{ 
    background: #fff;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

</style>
