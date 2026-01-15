<template>
    <div class="metaapp-view">
      <Banner />

      <!-- MetaApp Content Section -->
      <div class="metaapp-content">
        <!-- Categories and Filters -->
        <div class="filters-section">
          <div class="categories">
            <button
              v-for="category in categories"
              :key="category.value"
              :class="['category-btn', { active: selectedCategory === category.value }]"
              @click="selectedCategory = category.value"
            >
              {{ category.label }}
            </button>
          </div>

          <div class="actions">
            <div class="search-box">
              <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索"
                class="search-input"
              />
            </div>

            <button class="filter-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 4H21M3 12H21M3 20H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              筛选
            </button>

            <button class="submit-metaapp-btn" @click="openSubmitModal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              提交 MetaApp
            </button>
          </div>
        </div>

        <!-- App Cards Grid -->
        <div class="apps-grid" v-if="metaAppList.list?.length">
          <div class="app-card" v-for="item in metaAppList.list" :key="item.id" @click="handleCardClick(item)">
            <!-- 卡片预览图 -->
            <div class="card-preview">
              <img class="app-cover" :src="getCoverUrl(item.contentSummary?.coverImg)" alt="">
            </div>

            <!-- 卡片内容 -->
            <div class="card-content">
              <div class="app-header flex justify-between items-stretch">
                <div class="flex flex-1 flex-row ">
                  <img  class="app-icon" :src="getCoverUrl(item.contentSummary?.icon)" alt="">
                  <div class="app-info">
                      <div class="app-title flex  gap-2">
                    <span>{{ item.contentSummary?.appName || 'MetaApp' }}</span>
                    <img v-if="item.contentSummary?.prompt" class="ai-icon" :src="AiImg" alt="">
                   </div>
                   <div class="info-bottom">
                    <div class="app-pin-copy">
                      <span>Txid: {{item.modify_history && item.modify_history.length > 0 ? formatPinId(item.modify_history[item.modify_history.length - 1].slice(0,-2)) : formatPinId(item.id.slice(0,-2)) }}</span>
                      <svg @click.stop="item.modify_history && item.modify_history.length > 0 ? openTxLink(item.modify_history[item.modify_history.length - 1].slice(0,-2)) : openTxLink(item.id.slice(0,-2))" class="link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                   </div>
                  </div>
                </div>


            
             
                <div class="version-section ">
              
                  <div class="version flex flex-row items-center  bg-[#EEF5FF] ">
                          <button
                    v-if="item.address === userStore.last.address"
                    class="edit-btn mr-1"
                    @click.stop="openEditModal(item)"
                    title="编辑"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.43741 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                    
                    <span >
                    {{ item.contentSummary?.version || '版本1.0' }}
                  </span></div>
                  <div class="app-publish-time">发布于: {{ formatTimestamp(item.timestamp) }}</div>
                </div>
                 
               
              </div>

              <div class="app-intro text-[#999999]">
                {{ item.contentSummary?.intro || '暂无描述' }}
              </div>



              <div class="card-footer">
                <div class="app-stats rounded-full">
                  <div class="flex items-center">
                      <UserAvatar
                      :image="item.userInfo?.avatar"
                      :meta-id="item.userInfo?.metaid"
                      :name="item.userInfo?.name"
                      class="avatar overflow-hidden"
                      :meta-name="''"
                      :disabled="true"
                      :is-custom="false"
                      />
                        <div class="author flex flex-col">
                          <span class="name">{{item.userInfo?.name || item.userInfo?.metaid?.slice(0,6)}}</span>
                          <span class="metaid">MetaID: {{ item.userInfo?.metaid?.slice(0,6) }}</span>
                        </div>
            
                  </div>
                  <div class="stat-item">
                    
                  </div>
                </div>

                <div class="action-buttons ">
                      <template v-if="getDeployStatus(item.id).deployStatus && (getDeployStatus(item.id).deployStatus == 'failed' ) ">
                    <!-- 部署中状态 -->
                    <button class="btn-deploying rounded-full" disabled>
                      <svg class="loading-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
                        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
                      </svg>
                      <span>最新版本部署失败</span>
                    </button>
                  </template>


                  <template v-else-if="getDeployStatus(item.id).deployStatus && (getDeployStatus(item.id).deployStatus !== 'completed' ) ">
                    <!-- 部署中状态 -->
                    <button class="btn-deploying rounded-full" disabled>
                      <svg class="loading-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
                        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
                      </svg>
                      <span>部署中</span>
                    </button>
                  </template>
                
                  <template v-else>
                    <!-- 正常状态或旧版本 -->
                    <button 
                      class="btn-download rounded-full" 
                      @click.stop="handleDownload(item)"
                      :title="getDeployStatus(item.id).isOldVersion ? '上一版本' : ''"
                    >
                      <span>
                        下载{{ getDeployStatus(item.id).isOldVersion ? '(上一版本)' : '' }}
                      </span>
                    </button>
                 
                    <button 
                      class="btn-run rounded-full" 
                      @click.stop="handleRun(item)"
                      :title="getDeployStatus(item.id).isOldVersion ? '上一版本' : ''"
                      v-if="showRunBtn(item)"
                    >
                      <span>
                        运行{{ getDeployStatus(item.id).isOldVersion ? '(上一版本)' : '' }}
                      </span>
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无限滚动哨兵元素 -->
        <div ref="sentinelRef" class="scroll-sentinel" v-if="hasMore">
          <div class="loading-more" v-if="isLoadingMore">加载中...</div>
        </div>
        <div v-if="!hasMore && metaAppList.list?.length > 0" class="no-more-data">
          没有更多数据了
        </div>
      </div>

      <!-- Submit MetaApp Modal -->
      <SubmitMetaAppModal v-model="showSubmitModal" />

      <!-- Edit MetaApp Modal -->
      <EditMetaAppModal v-model="showEditModal" :meta-app="selectedMetaApp" @success="handleEditSuccess" />
    </div>
  </template>

  <script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, type Ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { nextTick } from 'vue'
  import Banner from '@/components/Banner/Banner.vue'
  import SubmitMetaAppModal from '@/components/SubmitMetaAppModal/SubmitMetaAppModal.vue'
  import EditMetaAppModal from '@/components/EditMetaAppModal/EditMetaAppModal.vue'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/components/Toast/useToast'
import { type AddressPinListResponse,type PinInfo,  getPinListByPath } from "@/api/ManV2";
import { getMetaAppByFirstPinId, type MetaAppResponse, } from "@/api/appApi";
import AiImg from '@/assets/images/ai.svg'
import DefaultImg from "@/assets/images/release_add_img.svg";
import {getUserInfoByAddress} from '@/api/man'
import { FilterMetaAppPinList } from "@/data/constants";
  // Categories
  const categories = [
    { label: '全部', value: 'all' },
    { label: '开发者工具', value: 'dev-tools' },
    { label: '娱乐与多媒体', value: 'entertainment' },
    { label: '搜索工具', value: 'search-tools' },
    { label: 'DeFi工具', value: 'defi-tools' }
  ]

  const selectedCategory = ref('all')
  const userStore=useUserStore()
  const router = useRouter()
  const searchQuery = ref('')
  const { showToast } =useToast()
  const showSubmitModal = ref(false)
  const showEditModal = ref(false)
  const selectedMetaApp = ref<PinInfo | null>(null)
  const metaAppList: Ref<AddressPinListResponse> = ref({
    total:0,
    list:[]
  })
  // 追踪每个 app-card 的 userInfo 加载状态
const userInfoLoadingMap = ref<Map<string, boolean>>(new Map())

  // 部署状态类型定义
interface DeployStatus {
  isDeployed: boolean // 是否已部署
  isLatestVersion: boolean // 是否为最新版本
  deployStatus: 'pending' | 'processing' | 'completed' | 'failed' | null // 部署状态
  isOldVersion: boolean // 是否为旧版本
}

  // 追踪每个 app-card 的部署状态
const deployStatusMap = ref<Map<string, DeployStatus>>(new Map())
  
  // 轮询定时器
let pollingTimer: ReturnType<typeof setInterval> | null = null

  // 无限滚动相关状态
  const pageSize = 20
  const nextCursor = ref<number | null>(0)
  const hasMore = ref(true)
  const isLoadingMore = ref(false)
  const sentinelRef = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null

  const getCoverUrl = (coverImg: string): string => {
    if(!coverImg) return DefaultImg
  if (coverImg.startsWith('metafile://')) {
    const pinId = coverImg.replace('metafile://', '')
    return `${import.meta.env.VITE_METAFS_INDEXER_URL}/${pinId}`
  }
  return coverImg
}

  // 封装获取MetaApp列表的函数
  async function fetchMetaAppList(isLoadMore: boolean = false) {
    
    if (isLoadingMore.value) return
    
    try {
      isLoadingMore.value = true
      
      // 如果不是加载更多，重置状态
      if (!isLoadMore) {
        
        nextCursor.value = 0
        hasMore.value = true
      }
      
      const cursor = isLoadMore ? (nextCursor.value ?? 0) : 0
      
      const result = await getPinListByPath({
        path: '/protocols/metaapp',
        cursor: cursor,
        size: pageSize
      })

      // 处理contentSummary的JSON序列化
      let processedList: PinInfo[] = []
      if (result && result.list && result.list.length > 0) {
        processedList = result.list.map(item => {
          if (item.contentSummary) {
            try {
              item.contentSummary = JSON.parse(item.contentSummary)
            } catch (error) {
              console.error('解析contentSummary失败:', error, item.contentSummary)
            }
          }
          return item
        }).filter((item)=>!FilterMetaAppPinList.includes(item.id) )
      }

      // 如果是加载更多，追加到现有列表；否则替换列表
      if (isLoadMore) {
        metaAppList.value.list = [...metaAppList.value.list, ...processedList]
        metaAppList.value.total = result.total
      } else {
        metaAppList.value = {
          list: processedList,
          total: result.total
        }
      }
      
      // 更新 nextCursor
      nextCursor.value = (result as any).nextCursor ?? null
      hasMore.value =result.list && result.list.length && nextCursor.value !== null && result.total > metaAppList.value.list?.length
      console.log("hasMore.value",hasMore.value)
      // 处理每个 item 的部署状态和用户信息
      if(processedList.length > 0) {
        for (let item of processedList) {
          checkDeployStatus(item)
          loadUserInfo(item)
        }
      }
      
      // 如果轮询未启动，启动轮询
      if (!pollingTimer) {
        startPolling()
      }
    } catch (error) {
      console.error('获取MetaApp列表失败:', error)
      showToast('获取MetaApp列表失败', 'error')
    } finally {
      isLoadingMore.value = false
      
      // 在加载完成后，重新初始化 Intersection Observer
      // 使用 nextTick 确保 DOM 已更新，哨兵元素已重新渲染
      await nextTick()
      if (hasMore.value && sentinelRef.value) {
        initIntersectionObserver()
      }
    }
  }

  // 加载更多数据
  async function loadMore() {
    if (!hasMore.value || isLoadingMore.value || nextCursor.value === null) {
      console.log('loadMore 被阻止:', { hasMore: hasMore.value, isLoadingMore: isLoadingMore.value, nextCursor: nextCursor.value })
      return
    }
    console.log('开始加载更多数据，nextCursor:', nextCursor.value)
    await fetchMetaAppList(true)
  }

  // 异步加载用户信息
const loadUserInfo = async (app: PinInfo) => {
  if (!app.address) return

  try {
    // 标记该 note 的 userInfo 正在加载
    userInfoLoadingMap.value.set(app.id, true)

    const userInfo = await getUserInfoByAddress(app.address)

    // 找到对应的 note 并更新 userInfo
    const noteIndex = metaAppList.value.list.findIndex(n => n.id === app.id)
    if (noteIndex !== -1) {
      metaAppList.value.list[noteIndex].userInfo = userInfo
    }
  } catch (error) {
    console.error(`Failed to load user info for MetaApp ${app.id}:`, error)
  } finally {
    // 标记该 note 的 userInfo 加载完成
    userInfoLoadingMap.value.set(app.id, false)
  }
}

  // 规范化 content 字段用于比较（移除 metafile:// 前缀）
const normalizeContent = (content: string): string => {
  if (!content) return ''
  // 移除 metafile:// 前缀以便比较
  return content.replace(/^metafile:\/\//, '')
}

  // 检查并更新部署状态
const checkDeployStatus = async (item: PinInfo) => {
  try {
    const deployInfo = await getMetaAppByFirstPinId({ firstPinId: item.id })
    
    // 对比 item.id 是否等于 deploy_info.first_pin_id
    if (deployInfo.deploy_info && item.id === deployInfo.deploy_info.first_pin_id) {
      
      const itemContent = normalizeContent(item.contentSummary?.content || '')
      const deployContent = normalizeContent(deployInfo.deploy_info.content || '')
      const deployStatus = deployInfo.deploy_info.deploy_status
      
      // 判断是否为最新版本
      const isLatestVersion = itemContent === deployContent
      
      // 如果是最新版本且部署完成，正常显示
      // 如果不是最新版本但部署完成，显示旧版本
      // 如果部署中（不是 completed），显示部署中状态
      const status: DeployStatus = {
        isDeployed: true,
        isLatestVersion: isLatestVersion,
        deployStatus: deployStatus,
        isOldVersion: !isLatestVersion && deployStatus === 'completed'
      }
      
      deployStatusMap.value.set(item.id, status)
    } else {
      // 如果没有找到部署信息，设置为未部署状态
      deployStatusMap.value.set(item.id, {
        isDeployed: false,
        isLatestVersion: false,
        deployStatus: null,
        isOldVersion: false
      })
    }
  } catch (error) {
    console.error(`Failed to check deploy status for MetaApp ${item.id}:`, error)
    // 出错时设置为未部署状态
    deployStatusMap.value.set(item.id, {
      isDeployed: false,
      isLatestVersion: false,
      deployStatus: null,
      isOldVersion: false
    })
  }
}

  // 获取部署状态
const getDeployStatus = (itemId: string): DeployStatus => {
  return deployStatusMap.value.get(itemId) || {
    isDeployed: false,
    isLatestVersion: false,
    deployStatus: null,
    isOldVersion: false
  }
}

  // 轮询检查所有 MetaApp 的部署状态
const pollDeployStatus = async () => {
  if (!metaAppList.value.list || metaAppList.value.list.length === 0) {
    return
  }
  
  // 遍历所有 MetaApp，异步检查部署状态
  for (const item of metaAppList.value.list) {
    await checkDeployStatus(item)
  }
}

  // 启动轮询
const startPolling = () => {
  // 如果已有定时器，先清除
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
  
  // 每 10 秒轮询一次
  pollingTimer = setInterval(() => {
    pollDeployStatus()
  }, 60 * 1000)
}

  // 停止轮询
const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
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
            console.log('哨兵元素进入视口，触发加载更多')
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
    console.log('Intersection Observer 已初始化并观察哨兵元素')
  }

  // 清理 Intersection Observer
  function cleanupIntersectionObserver() {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  // 处理下载按钮点击事件
  function handleDownload(item: any) {
    // 检查是否为 HTML 格式
    const contentType = item.contentSummary?.contentType || ''
    if (contentType === 'text/html') {
      showToast('不支持 HTML 格式文件进行下载', 'warning')
      return
    }

    if (item.contentSummary?.content) {
      let content = item.contentSummary.content
      // 如果content格式是metafile://{PINID}，提取PINID
      if (content.startsWith('metafile://')) {
        const pinId = content.replace('metafile://', '')
       
        window.open(`${import.meta.env.VITE_METAFS_INDEXER_URL}/${pinId}`, '_blank')
      } else {
       
        // 如果不是metafile格式，直接使用content作为PINID
        window.open(`${import.meta.env.VITE_METAFS_INDEXER_URL}/${content}`, '_blank')
      }
    }

      if (item.contentSummary?.code) {
      let code = item.contentSummary.code
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

  function isFieldInPathArray(pathStr, field) {
  if (!pathStr || typeof pathStr !== 'string') {
    return false;
  }
  
  // 将路径字符串按斜杠分割成数组
  const pathArray = pathStr.split('/');
  
  // 检查字段是否在数组中
  return pathArray.includes(field);
}

  function showRunBtn(item: any){
     if (!item.id) {
     
      return false
    }

    const runtime = item.contentSummary?.runtime || ''
    const isFontEndRun=isFieldInPathArray(runtime,'browser') || ''

    if(isFontEndRun){
      return true
    }else return false
  }


   // 处理运行按钮点击事件
  function handleRun(item: any) {
    if (!item.id) {
      showToast('暂无内容信息', 'warning')
      return
    }

    // 检查是否为源码包且不是 HTML 类型
    const content = item.contentSummary?.content || ''
    const contentType = item.contentSummary?.contentType || ''
    const runtime = item.contentSummary?.runtime || ''
    const isFontEndRun=isFieldInPathArray(runtime,'browser') || ''

    if (content.startsWith('metafile://') && contentType == 'application/zip' && isFontEndRun) {
     return window.open(`https://www.metaweb.world/metaapp/${item.id}/index.html`, '_blank')
    }

    // 判断是否为 metafile:// 格式的源码包，且不是 text/html 类型
    if (content.startsWith('metafile://') && contentType !== 'text/html') {
      const runtimeInfo = runtime ? `\n\n此源码包需要在 ${runtime} 运行时环境中运行。` : ''
      showToast(`源码包无法在浏览器中运行。${runtimeInfo}`, 'warning')
      return
    }

    window.open(`https://www.metaweb.world/metaapp/${item.id}/index.html`, '_blank')
  }

  function openSubmitModal() {
  if(!userStore.isAuthorized){
    return showToast(`请登录钱包后再进行操作`, 'error')
  }
  showSubmitModal.value = true
}

// 格式化 PIN ID 显示（前4位 + ... + 后4位）
function formatPinId(pinId: string): string {
  if (!pinId || pinId.length <= 8) return pinId
  return `${pinId.slice(0, 4)}...${pinId.slice(-4)}`
}

// 跳转到区块链浏览器查看交易
function openTxLink(txid: string) {
  if (!txid) return
  const url = `https://www.mvcscan.com/tx/${txid}`
  window.open(url, '_blank')
}

// 格式化时间戳为日期显示
function formatTimestamp(timestamp: number): string {
  if (!timestamp) return '未知日期'
  const date = new Date(timestamp * 1000) // 假设 timestamp 是秒级时间戳
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Open edit modal
function openEditModal(item: PinInfo) {
  if(!userStore.isAuthorized){
    return showToast(`请登录钱包后再进行操作`, 'error')
  }
  selectedMetaApp.value = item
  showEditModal.value = true
}

// Handle edit success
function handleEditSuccess() {
  // Refresh the list to show updated data
  nextCursor.value = 0
  hasMore.value = true
  fetchMetaAppList(false)
}

// Handle card click - navigate to detail page
function handleCardClick(item: PinInfo) {
  router.push(`/metaapp/detail/${item.id}`)
}

// 页面加载时获取MetaApp列表
onMounted(async () => {
  await fetchMetaAppList(false)
  // 启动轮询
  startPolling()
  // 初始化 Intersection Observer
  await nextTick()
  initIntersectionObserver()
})

// 组件卸载时清理
onUnmounted(() => {
  stopPolling()
  cleanupIntersectionObserver()
})
  </script>

  <style lang="scss" scoped>
  .metaapp-view {
    width: 100%;
    min-height: 100vh;
    //background: #f8f9fa;
  }

  .metaapp-content {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 0px;
  }

  .filters-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    gap: 24px;
    flex-wrap: wrap;

  }

  .categories {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .category-btn {
    padding: 8px 20px;
    border: none;
    background: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &:hover {
      color: #3b82f6;
      background: #eff6ff;
    }

    &.active {
      color: white;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  }

  .actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;

    .search-icon {
      position: absolute;
      left: 12px;
      color: #9ca3af;
      pointer-events: none;
    }

    .search-input {
      padding: 10px 16px 10px 40px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      width: 200px;
      transition: all 0.2s;
      background: white;

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      &::placeholder {
        color: #9ca3af;
      }
    }
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #3b82f6;
      color: #3b82f6;
      background: #eff6ff;
    }

    svg {
      color: currentColor;
    }
  }

  .submit-metaapp-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

    &:hover {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }

    svg {
      color: currentColor;
    }
  }

  .apps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    margin-bottom: 48px;
  }

  .app-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s;
    cursor: pointer;
    padding:20px 15px;
    position: relative;

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(59, 130, 246, 0.2);
      transform: translateY(-4px);
    }
  }

  .card-preview {
    position: relative;
    width:100%;
    
    height: 160px;
     margin-bottom: 20px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    .app-cover{
      width: 100%;
      height: 100%;
      object-fit: contain;
     
      
    }
  
  }

  .card-content {
   
   
  }

  .app-header {
    margin-bottom: 12px;

    .app-info {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
    }

    .app-title {
     margin-top: 3px;
      font-size: 14px;
      font-weight: 500;
      color: #2A2A2A;
      line-height: 1.2;
      .ai-icon{
        width:19px;
        height:16px;
      }
    }
    .app-icon{
      width: 48px;
      height: 48px;
      border-radius: 8px;
      margin-right: 10px;
      object-fit: contain;
    }
    .version{
      margin-top: 3px;
      border-radius: 200px;
      font-size: 10px;
      color: #3F71FF;
      padding: 5px 10px;
    }


  }

  .info-bottom {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: auto;

    .app-pin-copy {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      color: #999999;

      span {
        line-height: 1;
      }

      .link-icon {
        cursor: pointer;
        color: #999999;
        transition: color 0.2s;
        flex-shrink: 0;

        &:hover {
          color: #3F71FF;
        }
      }
    }
  }

  

  .version-section {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    gap: 4px;
    .version{
       .edit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
     
      background: transparent;
      border: none;
      color: #3F71FF;
      cursor: pointer;
      transition: all 0.2s;
      border-radius: 4px;

      &:hover {
        background: #EEF5FF;
        color: #2859d4;
      }

      svg {
        width: 12px;
        height: 12px;
      }
    }
    }
   

    .app-publish-time {
      font-size: 9px;
      color: #999999;
      line-height: 1;
      // margin-top: 10px;

    }
  }

  .app-intro{
     margin: 0;
      font-size: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 54px;
      max-height: 54px;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .app-stats {
    display: flex;
    padding: 2px 10px 2px 5px;
    background: #F2F2F7;
    .avatar{
      width: 20px;
      height: 20px;
      border-radius: 50%;
      margin-right: 3px;
    }
     .author {
      line-height: 1.2;
     .name{
      font-size: 8px;
       font-weight: 500;
      color: #333;
     }
     .metaid{
       font-weight: 500;
      font-size: 8px;
      margin-top: 1px;
      color: #A4A4A4;
     }
    }
    .stat-item {
    
    }
  }

  .action-buttons {
    display: flex;
    gap: 6px;

    button {
      display: flex;
      align-items: center;
     
      padding: 5px 10px;
      line-height: 1;
       font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      &:hover{
        opacity: 0.9;
      }
    }

    .btn-download {
     
     background: #EEF5FF;
     color: #387CF6;

    
    }

    .btn-run {
     
      background: linear-gradient(135deg, #2294FF 0%, #3C60FF 100%);
      color: white;
    
    }

    .btn-deploying {
      background: #EEF5FF;
      color: #387CF6;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: not-allowed;
      opacity: 0.7;

      .loading-icon {
        animation: spin 1s linear infinite;
      }
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
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

  // 移动端响应式样式
  @media screen and (max-width: 768px) {
    .metaapp-content {
      padding: 24px 16px;
    }

    .filters-section {
      flex-direction: column;
      align-items: stretch;
      gap: 15px 16px;
    }

    .categories {
      gap: 8px;
      overflow-x: auto;
      flex-wrap: wrap;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .category-btn {
      padding: 6px 16px;
      font-size: 13px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .actions {
      flex-wrap: wrap;
      gap: 8px;
    }

    .search-box {
      min-width: 40%;
      width: 40%;
      .search-input {
        width: 100%;
      }
    }

    .filter-btn,
    .submit-metaapp-btn {
      justify-content: center;
      padding: 10px 5px;
      font-size: 13px;
    }

    .apps-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .app-card {
      &:hover {
        transform: translateY(-4px);
      }
    }

    .card-preview {
    
    }

    .card-content {
      padding: 16px;
    }

    .app-header .app-title {
     
    }

    .action-buttons {
     
    }
  }

  // 超小屏幕（例如 iPhone SE）
  @media screen and (max-width: 375px) {
    .metaapp-content {
      padding: 16px 12px;
    }

    .filters-section {
      gap: 15px;
    }

    .category-btn {
      padding: 6px 12px;
      font-size: 12px;
    }

    .filter-btn,
    .submit-metaapp-btn {
      padding: 8px 10px;
      font-size: 12px;
      gap: 4px;

      svg {
        width: 16px;
        height: 16px;
      }
    }

    .apps-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .app-card {
      &:hover {
        transform: translateY(-2px);
      }
    }

   

    .card-content {
     
    }

    .app-header {
      

      .app-title {
       
      }

      .app-description {
        font-size: 13px;
        line-height: 1.4;
      }
    }

    .card-footer {
      padding-top: 12px;
      gap: 12px;
      flex-direction: column;
      align-items: flex-start;
    }

    .app-stats {
      gap: 12px;
    }

    .action-buttons {
    

     
    }
  }

  </style>
  