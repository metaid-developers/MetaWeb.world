<template>
  <section class="protocol-list">
    <div class="submitProtocolBtn">
      <button
        class="submit-protocol-button"
        @click="openSubmitModal"
      >
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>提交协议</span>
      </button>
    </div>
    <div class="protocol-container">
      <!-- 加载动画 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">
          <svg class="spinner" viewBox="0 0 50 50">
            <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
          </svg>
        </div>
        <p class="loading-text">加载中...</p>
      </div>

      <!-- 空状态提示 -->
      <div v-else-if="protocols.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="empty-text ">暂未查询到协议列表</p>
      </div>

      <!-- 协议列表 -->
      <div v-else>
        <div class="protocol-grid">
          <ProtocolCard
            v-for="protocol in protocols"
            :key="protocol.id"
            :id="protocol.lastId"
            :lastId="protocol.lastId"
            :protocolName="protocol.protocolName"
            :title="protocol.title"
            :description="protocol.description"
            :address="protocol.address"
            :timestamp="protocol.timestamp"
          />
        </div>

        <!-- 无限滚动哨兵元素 -->
        <div ref="sentinelRef" class="scroll-sentinel" v-if="hasMore">
          <div class="loading-more" v-if="isLoadingMore">加载中...</div>
        </div>
        <div v-if="!hasMore && protocols.length > 0" class="no-more-data">
          没有更多数据了
        </div>
      </div>
    </div>

    <!-- 提交协议弹窗 -->
    <SubmitProtocolModal v-model="showSubmitModal" />
  </section>
</template>

<script setup lang="ts">
import { ref, type Ref, onMounted, onUnmounted, computed } from 'vue'
import { nextTick } from 'vue'
import ProtocolCard from '@/components/ProtocolCard/ProtocolCard.vue'
import SubmitProtocolModal from '@/components/SubmitProtocolModal/SubmitProtocolModal.vue'
import { useToast } from '@/components/Toast/useToast'
import { useUserStore } from '@/stores/user'
import { getPinListByPath, type PinInfo } from '@/api/ManV2'
import { FilterMetaProtocolPinList } from "@/data/constants";
interface Protocol {
  title: string
  description: string
  id: string
  protocolName:string
  address:string
  timestamp:number
  lastId?:string
}

interface ContentSummary {
  title?: string
  intro?: string
  path?: string
  protocolName?:string
  [key: string]: any
}

const showSubmitModal = ref(false)
const userStore = useUserStore()
const { showToast } = useToast()

const protocols: Ref<Protocol[]> = ref([])
const loading = ref(false)
const pageSize = 20
const total = ref(0)

// 无限滚动相关状态
const nextCursor = ref<number | null>(0)
const hasMore = ref(true)
const isLoadingMore = ref(false)
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// 获取协议列表
async function fetchProtocols(isLoadMore: boolean = false) {
  if (isLoadingMore.value) return
  
  try {
    if (!isLoadMore) {
      loading.value = true
      // 重置状态
      nextCursor.value = 0
      hasMore.value = true
    } else {
      
      isLoadingMore.value = true
    }
    


    const cursor = isLoadMore ? (nextCursor.value ?? 0) : 0
    
    const response = await getPinListByPath({
      path: '/protocols/metaprotocol',
      cursor: cursor,
      size: pageSize
    })

    // 将PinInfo转换为Protocol格式
    const processedList: Protocol[] = (response.list || [])
      .map((pin: PinInfo) => {
        try {
          let contentSummary: ContentSummary = {}

          // 检查ContentSummary的类型
          if (pin.contentSummary) {
            // 如果已经是对象，直接使用
            if (typeof pin.contentSummary === 'object') {
              contentSummary = pin.contentSummary as any
            }
            // 如果是字符串，尝试JSON解析
            else if (typeof pin.contentSummary === 'string') {
              try {
                contentSummary = JSON.parse(pin.contentSummary)
              } catch (e) {
                console.error('JSON解析失败:', e, 'ContentSummary:', pin.contentSummary)
              }
            }
          }
          
          return {
            timestamp: pin.timestamp * 1000,
            address: pin.address,
            title: contentSummary.title || '未命名协议',
            description: contentSummary.intro || '暂无描述',
            id: pin.id,
            protocolName: contentSummary.protocolName || '',
            lastId: pin.modify_history && pin.modify_history.length ? pin.modify_history[pin.modify_history.length - 1] : pin.id
          }
        } catch (error) {
          console.error('解析ContentSummary失败:', error)
          // 如果解析失败，使用默认值
          return {
            title: '未命名协议',
            description: '暂无描述',
            id: pin.id || '',
            protocolName: '',
            timestamp: Date.now(),
            address: '',
            lastId: pin.id || ''
          }
        }
      })
      .filter(protocol => !FilterMetaProtocolPinList.includes(protocol.id)) // 过滤掉没有path的项

    // 如果是加载更多，追加到现有列表；否则替换列表
    if (isLoadMore) {
      protocols.value = [...protocols.value, ...processedList]
      total.value = response.total
    } else {
      protocols.value = processedList
      total.value = response.total
    }

    // 更新 nextCursor
    nextCursor.value = (response as any).nextCursor ?? null
    hasMore.value =response.list && response.list.length && nextCursor.value !== null && response.total > protocols.value.length
  } catch (error) {
    console.error('获取协议列表失败:', error)
    showToast('获取协议列表失败', 'error')
    if (!isLoadMore) {
      protocols.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
    isLoadingMore.value = false
    
    // 在加载完成后，重新初始化 Intersection Observer
    await nextTick()
    if (hasMore.value && sentinelRef.value) {
      initIntersectionObserver()
    }
  }
}

// 加载更多数据
async function loadMore() {
  if (!hasMore.value || isLoadingMore.value || nextCursor.value === null) {
    return
  }
  await fetchProtocols(true)
}

// 初始化 Intersection Observer
function initIntersectionObserver() {
  if (!sentinelRef.value) {
    console.warn('哨兵元素不存在，无法初始化 Observer')
    return
  }
  
  // 如果已有 observer，先断开
  if (observer) {
    observer.disconnect()
    observer = null
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore.value && !isLoadingMore.value) {
          loadMore()
        }
      })
    },
    {
      root: null,
      rootMargin: '100px', // 提前100px开始加载
      threshold: 0.1
    }
  )

  observer.observe(sentinelRef.value)
}

// 清理 Intersection Observer
function cleanupIntersectionObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

function openSubmitModal() {
  if (!userStore.isAuthorized) {
    return showToast(`请登录钱包后再进行操作`, 'error')
  }
  showSubmitModal.value = true
}

// 组件挂载时获取协议列表
onMounted(async () => {
  await fetchProtocols(false)
  // 初始化 Intersection Observer
  await nextTick()
  initIntersectionObserver()
})

// 组件卸载时清理
onUnmounted(() => {
  cleanupIntersectionObserver()
})
</script>

<style lang="scss" scoped>
.protocol-list {
  background: #F5F5F7;
  padding: 50px 0;

  @media (max-width: 768px) {
    padding: 60px 0;
  }

  @media (max-width: 480px) {
    padding: 40px 0;
  }
}

.submitProtocolBtn {
  max-width: 1280px;
  margin: 0 auto 40px;
  padding: 0;
  display: flex;
  justify-content: flex-end;

  @media (max-width: 480px) {
    padding: 0 16px;
    margin-bottom: 30px;
  }
}

.submit-protocol-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  .icon {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 480px) {
    padding: 10px 20px;
    font-size: 14px;

    .icon {
      width: 18px;
      height: 18px;
    }
  }
}

.protocol-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;

  @media (max-width: 480px) {
    padding: 0 16px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 60px 20px;
  }

  @media (max-width: 480px) {
    padding: 40px 16px;
  }
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
  color: #d1d5db;

  svg {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 480px) {
    width: 64px;
    height: 64px;
    margin-bottom: 20px;
  }
}

.empty-text {
  font-size: 16px;
  color: #6b7280;
  font-weight: 600;
  line-height: 1.6;
  max-width: 500px;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 15px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
  }
}

.protocol-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

// 加载动画样式
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 60px 20px;
  }

  @media (max-width: 480px) {
    padding: 40px 16px;
  }
}

.loading-spinner {
  width: 60px;
  height: 60px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
    margin-bottom: 16px;
  }
}

.spinner {
  animation: rotate 2s linear infinite;
  width: 100%;
  height: 100%;

  .path {
    stroke: #667eea;
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

.loading-text {
  font-size: 16px;
  color: #6b7280;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 14px;
  }
}

// 无限滚动哨兵元素样式
.scroll-sentinel {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
  min-height: 60px;

  .loading-more {
    color: #6b7280;
    font-size: 14px;
  }
}

.no-more-data {
  text-align: center;
  padding: 24px 0;
  color: #9ca3af;
  font-size: 14px;
}
</style>






