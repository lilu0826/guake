<template>
  <div class="status-page">
    <div class="card">
      <!-- 顶部 -->
      <div class="header">
        <h2>👩‍🏫 {{ teacherName }}，您好</h2>
        <span class="time">当前时间：{{ now }}</span>
      </div>

      <!-- 课程信息 -->
      <div class="section">
        <div class="label">当前课程</div>
        <div class="course">{{ courseName }}</div>
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

      <!-- 状态 -->
      <div class="section status-line">
        <span class="dot" :class="status"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>

      <!-- 最近日志 -->
      <div class="section">
        <div class="label">最近活动</div>
        <ul class="log">
          <li v-for="(item, index) in logs" :key="index">
            <span class="log-time">{{ item.time }}</span>
            <span class="log-msg">{{ item.msg }}</span>
          </li>
        </ul>
      </div>

      <!-- 提示 -->
      <div class="footer">
        正在自动学习中
        <button @click="">停止学习</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 基本信息（后端返回）
const teacherName = ref('张老师')
const courseName = ref('2024 年教师师德培训')

// 状态数据
const progress = ref(0)
const status = ref('running') // running | waiting | error
const statusText = ref('🟢 正在学习中')

// 日志
const logs = ref([])

// 当前时间
const now = ref('')

function updateTime() {
  now.value = new Date().toLocaleTimeString()
}

function updateStatus() {
  // TODO：替换为后端接口 / WebSocket
  progress.value = Math.min(progress.value + 2, 100)

  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    msg: '自动播放学习内容'
  })

  if (progress.value >= 100) {
    status.value = 'waiting'
    statusText.value = '✅ 学习已完成'
  }
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)

  // 模拟状态更新
  setInterval(updateStatus, 3000)
})
</script>

<style scoped>
.status-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  justify-content: center;
  padding-top: 40px;
}

.card {
  width: 420px;
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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

.label {
  font-size: 13px;
  color: #888;
  margin-bottom: 6px;
}

.course {
  font-size: 15px;
  font-weight: 500;
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
  margin-top: 12px;
  font-size: 12px;
  color: #999;
  text-align: center;
}
</style>
