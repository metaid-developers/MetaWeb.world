<template>
  <div class="metaapp-detail-view">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载...</p>
    </div>
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
    </div>
    <div v-else class="detail-container">
      <!-- 返回按钮 -->
      <nav class="breadcrumb">
        <router-link to="/" class="breadcrumb-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back
        </router-link>
      </nav>

      <!-- 主要内容区域 -->
      <div class="body-box">
        <!-- 应用头部信息 -->
        <div class="app-header-section">
          <div class="app-header-top">
            <div class="app-icon-wrapper">
              <img v-if="contentSummary?.icon" :src="getImageUrl(contentSummary.icon)" :alt="contentSummary?.title" class="app-icon-large" />
              <div v-else class="app-icon-placeholder"></div>
            </div>
            <div class="app-header-info">
              <div class="app-title-row">
                <h1 class="app-title">{{ contentSummary?.title || contentSummary?.appName || 'MetaApp' }}</h1>
                <div class="app-actions">
                  <button class="btn-run" :class="{ disabled: !canRun }" :disabled="!canRun" @click="handleRun">运行</button>
                  <div class="download-links">
                  
                    <a href="#" class="download-link" @click.prevent="handleDownloadCode">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      下载
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="app-meta">
            <div class="creator-info" v-if="creatorInfo">
              <img v-if="creatorInfo.avatar" :src="creatorInfo.avatar" :alt="creatorInfo.name" class="creator-avatar" />
              <div class="creator-details">
                <span class="creator-name">{{ creatorInfo.name || creatorInfo.metaId?.slice(0, 6) || 'Unknown' }}</span>
                <span class="creator-metaid">MetaID: {{ creatorInfo.metaId?.slice(0, 6) || 'N/A' }}</span>
              </div>
            </div>
            <div class="app-stats">
              <span class="stat-item" @click="handleStatClick">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
               
              </span>
              <span class="stat-item" @click="handleStatClick">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
               
              </span>
            </div>
              <div class="app-tags">
                
                <div class="tag tag-share" @click="handleShare">
                  <img :src="shareIcon" alt="">
                  <span>分享</span>
 
                </div>
              </div>
          </div>
        </div>

        <!-- 轮播图区域 -->
        <div class="carousel-section" v-if="introImages && introImages.length > 0">
          <div class="carousel-container">
            <button 
              class="carousel-btn carousel-btn-prev" 
              @click="prevImage"
              :disabled="currentImageIndex === 0"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="carousel-image-wrapper">
              <img 
                :src="getImageUrl(introImages[currentImageIndex])" 
                :alt="`应用截图 ${currentImageIndex + 1}`"
                class="carousel-image"
              />
            </div>
            <button 
              class="carousel-btn carousel-btn-next" 
              @click="nextImage"
              :disabled="currentImageIndex === introImages.length - 1"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="carousel-indicators" v-if="introImages.length > 1">
            <span 
              v-for="(img, index) in introImages" 
              :key="index"
              class="indicator"
              :class="{ active: index === currentImageIndex }"
              @click="currentImageIndex = index"
            ></span>
          </div>
        </div>

        <!-- 概述部分 -->
        <div class="overview-section">
          <h2 class="section-title">概述</h2>
          <div class="overview-content" :class="{ expanded: isOverviewExpanded }">
            <p class="overview-text">{{ contentSummary?.intro || '暂无描述' }}</p>
          </div>
          <button 
            v-if="shouldShowExpandButton" 
            class="expand-btn"
            @click="isOverviewExpanded = !isOverviewExpanded"
          >
            {{ isOverviewExpanded ? '收起' : '查看更多' }}
          </button>
        </div>

        <!-- Tab 切换 -->
        <div class="tabs-section">
          <div class="tabs-header">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'details' }"
              @click="activeTab = 'details'"
            >
              详情
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'ai' }"
              @click="activeTab = 'ai'"
              v-if="contentSummary?.prompt"
            >
              AI
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'comments' }"
              @click="activeTab = 'comments'"
            >
              评论
            </button>
          </div>

          <!-- 详情 Tab -->
          <div v-if="activeTab === 'details'" class="tab-content">
            <div class="detail-info-grid">
              <div class="detail-item">
                <span class="detail-label">版本</span>
                <span class="detail-value">{{ contentSummary?.version || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">大小</span>
                <span class="detail-value">{{ fileSize || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">开发者</span>
                <span class="detail-value">
                  <span v-if="creatorInfo">{{ creatorInfo.name || creatorInfo.metaId?.slice(0, 6) || 'Unknown' }}</span>
                  <span v-else>加载中...</span>
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">上次更新日期</span>
                <span class="detail-value">{{ lastUpdateDate || 'N/A' }}</span>
              </div>
              <!-- <div class="detail-item">
                <span class="detail-label">语言</span>
                <span class="detail-value">3种语言</span>
              </div> -->
              <div class="detail-item">
                <span class="detail-label">运行环境</span>
                <span class="detail-value">{{ contentSummary?.runtime || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- AI Tab -->
          <div v-if="activeTab === 'ai'" class="tab-content">
            <div class="ai-content">
              <pre class="ai-prompt">{{ contentSummary?.prompt || '暂无 AI 信息' }}</pre>
            </div>
          </div>

          <!-- 评论 Tab -->
          <div v-if="activeTab === 'comments'" class="tab-content">
            <div class="comments-placeholder">
              <p>评论功能开发中，敬请期待</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPinDetail, type PinDetail } from '@/api/ManV2'
import { getUserInfoByAddressByMs, type UserInfo } from '@/api/metafs'
import { getMetaFileInfo, type MetaFileInfo } from '@/api/metafs'
import { useToast } from '@/components/Toast/useToast'
import { useLayoutStore } from '@/stores/layout'
import DefaultImg from '@/assets/images/release_add_img.svg'
import shareIcon from '@/assets/images/share.svg'
const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const layoutStore = useLayoutStore()

const loading = ref(true)
const error = ref('')
const pinDetail: Ref<PinDetail | null> = ref(null)
const contentSummary = ref<any>(null)
const creatorInfo: Ref<UserInfo | null> = ref(null)
const fileSize = ref('')
const lastUpdateDate = ref('')
const introImages = ref<string[]>([])
const currentImageIndex = ref(0)
const isOverviewExpanded = ref(false)
const activeTab = ref<'details' | 'ai' | 'comments'>('details')

// 计算是否显示展开按钮
const shouldShowExpandButton = computed(() => {
  if (!contentSummary.value?.intro) return false
  // 简单判断：如果文本长度超过一定值，显示展开按钮
  return contentSummary.value.intro.length > 200
})

// 判断字段是否在路径数组中
const isFieldInPathArray = (pathStr: string, field: string): boolean => {
  if (!pathStr || typeof pathStr !== 'string') {
    return false
  }
  // 将路径字符串按斜杠分割成数组
  const pathArray = pathStr.split('/')
  // 检查字段是否在数组中
  return pathArray.includes(field)
}

// 计算是否可以运行
const canRun = computed(() => {
  if (!pinDetail.value?.id || !contentSummary.value) {
    return false
  }
  const runtime = contentSummary.value.runtime || ''
  const isFontEndRun = isFieldInPathArray(runtime, 'browser')
  return isFontEndRun
})

// 获取图片 URL（同步方法，用于模板中）
const getImageUrl = (src: string): string => {
  if (!src) return DefaultImg
  if (src.startsWith('metafile://')) {
    const pinId = src.replace('metafile://', '')
    return `${import.meta.env.VITE_METAFS_ACCELERA_URL}/${pinId}`
  }
  return src
}

// 上一张图片
const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

// 下一张图片
const nextImage = () => {
  if (currentImageIndex.value < introImages.value.length - 1) {
    currentImageIndex.value++
  }
}

// 处理运行
const handleRun = () => {
  if (!pinDetail.value?.id) {
    showToast('暂无内容信息', 'warning')
    return
  }

  // 检查是否为源码包且不是 HTML 类型
  const content = contentSummary.value?.content || ''
  const contentType = contentSummary.value?.contentType || ''
  const runtime = contentSummary.value?.runtime || ''
  const isFontEndRun = isFieldInPathArray(runtime, 'browser')

  if (content.startsWith('metafile://') && contentType === 'application/zip' && isFontEndRun) {
    return window.open(`https://www.metaweb.world/metaapp/${pinDetail.value.id}/index.html`, '_blank')
  }

  // 判断是否为 metafile:// 格式的源码包，且不是 text/html 类型
  if (content.startsWith('metafile://') && contentType !== 'text/html') {
    const runtimeInfo = runtime ? `\n\n此源码包需要在 ${runtime} 运行时环境中运行。` : ''
    showToast(`源码包无法在浏览器中运行。${runtimeInfo}`, 'warning')
    return
  }

  window.open(`https://www.metaweb.world/metaapp/${pinDetail.value.id}/index.html`, '_blank')
}

// // 处理下载
// const handleDownload = () => {
//   if (!contentSummary.value?.content) {
//     showToast('暂无下载内容', 'warning')
//     return
//   }
//   let content = contentSummary.value.content
//   if (content.startsWith('metafile://')) {
//     const pinId = content.replace('metafile://', '')
//     window.open(`${import.meta.env.VITE_METAFS_INDEXER_URL}/${pinId}`, '_blank')
//   } else {
//     window.open(`${import.meta.env.VITE_METAFS_INDEXER_URL}/${content}`, '_blank')
//   }
// }



 // 处理下载按钮点击事件
  function handleDownload() {
    // 检查是否为 HTML 格式
    const contentType = contentSummary.value?.contentType || ''
    if (contentType === 'text/html') {
      showToast('不支持 HTML 格式文件进行下载', 'warning')
      return
    }

    if (contentSummary.value?.content) {
      let content = contentSummary.value?.content
      // 如果content格式是metafile://{PINID}，提取PINID
      if (content.startsWith('metafile://')) {
        const pinId = content.replace('metafile://', '')
       
        window.open(`${import.meta.env.VITE_METAFS_INDEXER_URL}/${pinId}`, '_blank')
      } else {
       
        // 如果不是metafile格式，直接使用content作为PINID
        window.open(`${import.meta.env.VITE_METAFS_INDEXER_URL}/${content}`, '_blank')
      }
    }

      if (contentSummary.value?.code) {
      let code = contentSummary.value?.code
      // 如果content格式是metafile://{PINID}，提取PINID
      if (code.startsWith('metafile://')) {
        const pinId = code.replace('metafile://', '')
       
        window.open(`${import.meta.env.VITE_METAFS_INDEXER_URL}/${pinId}`, '_blank')
      } else {
       
        // 如果不是metafile格式，直接使用content作为PINID
        window.open(`${import.meta.env.VITE_METAFS_INDEXER_URL}/${code}`, '_blank')
      }
    }
  }

// 处理下载代码
const handleDownloadCode = () => {
  handleDownload()
}

// 处理统计项点击
const handleStatClick = () => {
  showToast('功能开发中', 'info')
}

// 格式化日期
const formatDate = (timestamp: number): string => {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (!bytes) return 'N/A'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)}MB`
}

// 处理分享 - 复制当前路由
const handleShare = async () => {
  try {
    const currentUrl = window.location.href
    await navigator.clipboard.writeText(currentUrl)
    showToast('分享链接已复制', 'success')
  } catch (err) {
    console.error('复制失败:', err)
    // 降级方案：使用传统方法
    try {
      const textArea = document.createElement('textarea')
      textArea.value = window.location.href
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast('分享链接已复制', 'success')
    } catch (fallbackErr) {
      console.error('降级复制方法也失败:', fallbackErr)
      showToast('复制失败，请手动复制链接', 'error')
    }
  }
}

onMounted(async () => {
  layoutStore.setPageLoading(false)
  
  const pinid = route.params.pinid as string
  if (!pinid) {
    error.value = '缺少 PINID 参数'
    loading.value = false
    return
  }

  try {
    // 1. 获取 Pin 详情
    const detail = await getPinDetail({ numberOrId: pinid })
    pinDetail.value = detail

    // 解析 contentSummary
    if (detail.contentSummary) {
      
      if (typeof detail.contentSummary === 'string') {
        try {
          contentSummary.value = JSON.parse(detail.contentSummary)
          
        } catch (e) {
          console.error('解析 contentSummary 失败:', e)
          contentSummary.value = {}
        }
      } else {
        contentSummary.value = detail.contentSummary
      }
    }

    // 2. 获取创建者信息
    if (detail.address || detail.creator) {
      try {
        const address = detail.address || detail.creator
        
        creatorInfo.value = await getUserInfoByAddressByMs(address)
        
      } catch (e) {
        console.error('获取创建者信息失败:', e)
      }
    }

    // 3. 获取文件大小
    if(contentSummary.value.content){
      try {
      
      const fileInfo = await getMetaFileInfo(contentSummary.value.content.replace("metafile://",''))
      
      if (fileInfo.file_size) {
        fileSize.value = formatFileSize(fileInfo.file_size)
      }
    } catch (e) {
      console.error('获取文件信息失败:', e)
    }
    }

      // 3. 获取文件大小
    if(contentSummary.value.code){
      try {
      
      const fileInfo = await getMetaFileInfo(contentSummary.value.code.replace("metafile://",''))
      
      if (fileInfo.file_size) {
        fileSize.value = formatFileSize(fileInfo.file_size)
      }
    } catch (e) {
      console.error('获取文件信息失败:', e)
    }
    }

    // 4. 获取上次更新日期
    if (detail.modify_history && detail.modify_history.length > 0) {
      try {
        const lastModifyId = detail.modify_history[detail.modify_history.length - 1]
        const lastModifyDetail = await getPinDetail({ numberOrId: lastModifyId })
        if (lastModifyDetail.timestamp) {
          lastUpdateDate.value = formatDate(lastModifyDetail.timestamp)
        }
      } catch (e) {
        console.error('获取上次更新日期失败:', e)
        // 如果获取失败，使用当前 detail 的 timestamp
        if (detail.timestamp) {
          lastUpdateDate.value = formatDate(detail.timestamp)
        }
      }
    } else {
      // 如果没有 modify_history，直接使用当前 detail 的 timestamp
      if (detail.timestamp) {
        lastUpdateDate.value = formatDate(detail.timestamp)
      }
    }

    // 5. 处理简介图片
    if (contentSummary.value?.introImgs && Array.isArray(contentSummary.value.introImgs)) {
      introImages.value = contentSummary.value.introImgs
    }

    loading.value = false
  } catch (err) {
    console.error('获取 MetaApp 详情失败:', err)
    error.value = '获取 MetaApp 详情失败，请稍后重试'
    showToast('获取 MetaApp 详情失败', 'error')
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.metaapp-detail-view {
  background: #f9fafb;
  min-height: calc(100vh - 200px);
  padding: 30px 0;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 20px 0;
  }

  @media (max-width: 480px) {
    padding: 16px 0;
  }
}

.detail-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;

  @media (max-width: 480px) {
    padding: 0 16px;
  }
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
  flex: 1;
  min-height: calc(100vh - 200px);
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

.breadcrumb {
  margin-bottom: 24px;

  .breadcrumb-link {
    color: #303133;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;

    svg {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
    }

    &:hover {
      color: #111827;
    }
  }
}

.body-box {
  background: #ffffff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 30px;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    padding: 20px;
    border-radius: 8px;
  }
}

.app-header-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f3f4f6;
}

.app-header-top {
  display: flex;
  gap: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
}

.app-icon-wrapper {
  flex-shrink: 0;
  
  .app-icon-large {
    width: 64px;
    height: 64px;
    object-fit: contain;
    background: #f9fafb;
    border-radius: 8px;
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 64px;
      height: 64px;
    }
  }

  .app-icon-placeholder {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 64px;
      height: 64px;
    }
  }
}

.app-header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.app-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.3;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 24px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
  }
}

.app-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: row;
    width: 100%;
  }
}

.btn-run {
  width: 100%;
  padding: 8px 24px;
  background: linear-gradient(135deg, #2294FF 0%, #3C60FF 100%);
  color: white;
  border: none;
  border-radius: 60px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(34, 148, 255, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled,
  &.disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.download-links {
  display: flex;
  gap: 12px;
  font-size: 12px;

  .download-link {
    color: #6b7280;
    text-decoration: none;
    transition: color 0.2s;
    padding: 5px 8px;
    border-radius: 60px;
    background: #F9FAFB;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    
    svg {
      flex-shrink: 0;
      width: 14px;
      height: 14px;
    }
    
    &:hover {
      color: #3b82f6;
    }
  }
}

.app-meta {
  margin-left: 10px;
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: 12px;
  }
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 8px;

  .creator-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .creator-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .creator-name {
    font-size: 14px;
    color: #303133;
    font-weight: 500;
    line-height: 1.2;
  }

  .creator-metaid {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.2;
  }
}

.app-stats {
  display: flex;
  gap: 16px;
  align-items: center;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-size: 14px;
    color: #6b7280;

    svg {
      width: 16px;
      height: 16px;
    }
  }
}

.app-tags {
  display: flex;
  gap: 8px;
  
  .tag {
    display: flex;
    flex-direction: row;
  align-items: center;
    font-size: 12px;
    font-weight: 500;
    


    &.tag-share {
      cursor: pointer;
      color: #1e40af;
      img{
        width: 16px;
        height: 16px;
        margin-right: 3px;
      }
    }
  }
}

.carousel-section {
  margin-bottom: 32px;
}

.carousel-container {
  position: relative;
  width: 100%;
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  background: #f9fafb;
}

.carousel-image-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;

  .carousel-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;

  &:hover:not(:disabled) {
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 24px;
    height: 24px;
    color: #374151;
  }
}

.carousel-btn-prev {
  left: 16px;
}

.carousel-btn-next {
  right: 16px;
}

.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;

  .indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d1d5db;
    cursor: pointer;
    transition: all 0.3s ease;

    &.active {
      background: #3b82f6;
      width: 24px;
      border-radius: 4px;
    }

    &:hover {
      background: #9ca3af;
    }
  }
}

.overview-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.overview-content {
  max-height: 300px;
  overflow: hidden;
  transition: max-height 0.3s ease;

  &.expanded {
    max-height: none;
  }

  .overview-text {
    font-size: 15px;
    line-height: 1.7;
    color: #374151;
    margin: 0;
    white-space: pre-wrap;
  }
}

.expand-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: #3b82f6;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #2563eb;
  }
}

.tabs-section {
  margin-top: 32px;
}

.tabs-header {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 24px;
}

.tab-btn {
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;

  &:hover {
    color: #374151;
  }

  &.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }
}

.tab-content {
  min-height: 200px;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.detail-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
}

.ai-content {
  padding: 24px;
  background: #f9fafb;
  border-radius: 8px;

  .ai-prompt {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: #374151;
    white-space: pre-wrap;
    font-family: inherit;
  }
}

.comments-placeholder {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;

  p {
    margin: 0;
    font-size: 14px;
  }
}
</style>
