<template>
    <div class="login-page">
        <div class="card">
            <h1 class="title">📚 继续教育学习助手</h1>
            <p class="subtitle">请先扫码登录</p>

            <div class="qr-wrapper">
                <!-- 二维码 -->
                <img class="qr-img" :src="qrCodeUrl" alt="扫码登录" />
            </div>

            <p class="tip">请长按上方二维码选择<b>【识别二维码】</b>进行登录！</p>

            <div class="status">
                <span class="dot" :class="status"></span>
                {{ statusText }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useEventListener } from "@vueuse/core";
const router = useRouter();

// 登录状态：waiting | success | expired
const status = ref("waiting");
const statusText = ref("等待扫码中…");

// 模拟二维码（你后面换成后端生成的）
const loginToken = ref("");
const qrCodeUrl = ref("");

async function getQrCode() {
    const response = await fetch("/api/login-img")
    const json = await response.json()
    console.log('json', json)
    qrCodeUrl.value = json.dataUrl
    loginToken.value = json.qrCodeId
}
// 模拟轮询扫码状态
let timer = null;

onMounted(() => {
    getQrCode()
    timer = setInterval(async () => {
        const response = await fetch(`/api/login-status?qrCodeId=${loginToken.value}`)
        const json = await response.json()
        if (json.success) {
            status.value = "success";
            statusText.value = "扫码成功，正在进入…";
            clearInterval(timer);
            router.push("/status?username="+json.data.username);
        }
    }, 1000);
});



useEventListener("visibilitychange", (event) => {
  console.log('event',event)
  if (document.hidden) {
    // 浏览器被最小化
    // alert('page hidden');
  }
})
</script>

<style scoped>
.login-page {
    height: 100vh;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card {
    width: 360px;
    background: #fff;
    padding: 32px 24px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.title {
    font-size: 22px;
    margin-bottom: 4px;
}

.subtitle {
    font-size: 14px;
    color: #888;
    margin-bottom: 24px;
}

.qr-wrapper {
    margin-bottom: 16px;
}

.qr-img {
    width: 240px;
    height: 240px;
}

.tip {
    font-size: 14px;
    color: #555;
    margin-bottom: 12px;
}

.status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 14px;
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #aaa;
}

.dot.waiting {
    background: #409eff;
}

.dot.success {
    background: #67c23a;
}

.dot.expired {
    background: #f56c6c;
}
</style>
