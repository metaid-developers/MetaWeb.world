<template>
  <div class="metaapp-detail">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载...</p>
    </div>
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPinDetail } from '@/api/ManV2'
import { useToast } from '@/components/Toast/useToast'

const route = useRoute()
const { showToast } = useToast()
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const pinid = route.params.pinid as string

  if (!pinid) {
    error.value = '缺少 PINID 参数'
    loading.value = false
    return
  }

  try {
    // 调用 getPinDetail API
    const result = await getPinDetail({ numberOrId: pinid })

    // 序列化 contentSummary
    let contentSummary = result.contentSummary
    if (typeof contentSummary === 'string') {
      try {
        contentSummary = JSON.parse(contentSummary)
      } catch (e) {
        console.error('解析 contentSummary 失败:', e)
      }
    }
    
    // 分析 contentType
    if (contentSummary.contentType === 'text/html') {
      // 提取 content
      const content = contentSummary?.content

      if (content) {
        // 检查是否是 metafile:// 格式
        if (content.startsWith('metafile://')) {
          const extractedPinId = content.replace('metafile://', '')
          console.log('提取的 PINID:', extractedPinId)

          // 新开窗口跳转
          window.open(`https://man.metaid.io/content/${extractedPinId}`, '_blank')
          showToast('正在打开 MetaApp...', 'success')
        } else {
          // content 不是 metafile:// 格式，但仍然是 text/html
          showToast('内容格式不支持', 'warning')
        }
      } else {
        showToast('未找到内容', 'warning')
      }
    } else {
      // 非 text/html 类型
      showToast('源码解析功能开发中，敬请期待', 'info')
    }

    loading.value = false
  } catch (err) {
    console.error('获取 Pin 详情失败:', err)
    error.value = '获取 MetaApp 详情失败，请稍后重试'
    showToast('获取 MetaApp 详情失败', 'error')
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.metaapp-detail {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-container,
.error-container {
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #ef4444;
  font-size: 16px;
  font-weight: 500;
}
</style>
