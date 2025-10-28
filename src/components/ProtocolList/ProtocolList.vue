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
            :id="protocol.id"
            :protocolName="protocol.protocolName"
            :title="protocol.title"
            :description="protocol.description"
          />
        </div>

        <!-- 分页组件 -->
        <div v-if="total > pageSize" class="pagination-container">
          <div class="pagination">
            <button
              class="pagination-btn"
              :disabled="currentPage === 1"
              @click="handlePageChange(currentPage - 1)"
            >
              上一页
            </button>

            <div class="pagination-pages">
              <button
                v-for="page in totalPages"
                :key="page"
                class="pagination-page"
                :class="{ active: page === currentPage }"
                @click="handlePageChange(page)"
              >
                {{ page }}
              </button>
            </div>

            <button
              class="pagination-btn"
              :disabled="currentPage === totalPages"
              @click="handlePageChange(currentPage + 1)"
            >
              下一页
            </button>
          </div>

          <div class="pagination-info">
            共 {{ total }} 条，第 {{ currentPage }} / {{ totalPages }} 页
          </div>
        </div>
      </div>
    </div>

    <!-- 提交协议弹窗 -->
    <SubmitProtocolModal v-model="showSubmitModal" />
  </section>
</template>

<script setup lang="ts">
import { ref, type Ref, onMounted, computed } from 'vue'
import ProtocolCard from '@/components/ProtocolCard/ProtocolCard.vue'
import SubmitProtocolModal from '@/components/SubmitProtocolModal/SubmitProtocolModal.vue'
import { useToast } from '@/components/Toast/useToast'
import { useUserStore } from '@/stores/user'
import { getPinListByPath, type PinInfo } from '@/api/ManV2'

interface Protocol {
  title: string
  description: string
  id: string
  protocolName:string
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
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 计算总页数
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 获取协议列表
async function fetchProtocols(page: number = 1) {
  loading.value = true
  try {
    const response = await getPinListByPath({
      path: '/protocols/metaprotocol',
      cursor: page - 1,
      size: pageSize.value
    })

    if (response.list && response.list.length > 0) {
      // 将PinInfo转换为Protocol格式
      protocols.value = response.list
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

            console.log('解析后的contentSummary:', contentSummary, 'from pin:', pin)

            return {
              title: contentSummary.title || '未命名协议',
              description: contentSummary.intro || '暂无描述',
              id: pin.id || '',
              protocolName:contentSummary.protocolName || ''
            }
          } catch (error) {
            console.error('解析ContentSummary失败:', error)
            // 如果解析失败，使用默认值
            return {
              title: '未命名协议',
              description: '暂无描述',
              id: pin.id || '',
              protocolName:''
            }
          }
        })
        .filter(protocol => protocol.id) // 过滤掉没有path的项

      total.value = response.total
    } else {
      protocols.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取协议列表失败:', error)
    showToast('获取协议列表失败', 'error')
    protocols.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 分页切换
function handlePageChange(page: number) {
  currentPage.value = page
  fetchProtocols(page)
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openSubmitModal() {
  if (!userStore.isAuthorized) {
    return showToast(`请登录钱包后再进行操作`, 'error')
  }
  showSubmitModal.value = true
}

// 组件挂载时获取协议列表
onMounted(() => {
  fetchProtocols(1)
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

// 分页样式
.pagination-container {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  @media (max-width: 480px) {
    margin-top: 30px;
    gap: 12px;
  }
}

.pagination {
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 480px) {
    gap: 8px;
  }
}

.pagination-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #667eea;
    color: #667eea;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 6px 12px;
    font-size: 13px;
  }
}

.pagination-pages {
  display: flex;
  gap: 8px;

  @media (max-width: 480px) {
    gap: 4px;
  }
}

.pagination-page {
  min-width: 36px;
  height: 36px;
  padding: 8px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f9fafb;
    border-color: #667eea;
    color: #667eea;
  }

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: transparent;
    color: white;
  }

  @media (max-width: 480px) {
    min-width: 32px;
    height: 32px;
    padding: 6px;
    font-size: 13px;
  }
}

.pagination-info {
  font-size: 14px;
  color: #6b7280;

  @media (max-width: 480px) {
    font-size: 13px;
  }
}
</style>
