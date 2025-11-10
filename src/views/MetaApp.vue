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
          <div class="app-card" v-for="item in metaAppList.list" :key="item.id" >
            <!-- 卡片预览图 -->
            <div class="card-preview">
              <img class="app-cover" :src="getCoverUrl(item.contentSummary?.coverImg)" alt="">
            </div>

            <!-- 卡片内容 -->
            <div class="card-content">
              <div class="app-header flex justify-between items-start">
                <div class="flex flex-row ">
                  <img  class="app-icon" :src="getCoverUrl(item.contentSummary?.icon)" alt="">
                   <div class="app-title flex  gap-2">
                    <span>{{ item.contentSummary?.appName || 'MetaApp' }}</span>
                    <img v-if="item.contentSummary?.prompt" class="ai-icon" :src="AiImg" alt="">
                   </div>
                </div>
                <div class="version  bg-[#EEF5FF] "><span >
                  {{ item.contentSummary?.version || '版本1.0' }}
                </span></div>
               
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
                          <span class="metaid">METAID: {{ item.userInfo?.metaid?.slice(0,6) }}</span>
                        </div>
            
                  </div>
                  <div class="stat-item">
                    
                  </div>
                </div>

                <div class="action-buttons ">
                  <button class="btn-download rounded-full" @click.stop="handleDownload(item)">
                    <span>
                      下载
                    </span>
                  </button>
                 
                  <button class="btn-run rounded-full" @click="handleRun(item)">
                    <span>
                      运行
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 0">
          <button
            class="pagination-btn"
            @click="goToPrevPage"
            :disabled="currentPage === 1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <template v-for="(page, index) in pageNumbers" :key="index">
            <span v-if="page === '...'" class="pagination-ellipsis">...</span>
            <button
              v-else
              :class="['pagination-number', { active: currentPage === page }]"
              @click="goToPage(page as number)"
            >
              {{ page }}
            </button>
          </template>

          <button
            class="pagination-btn"
            @click="goToNextPage"
            :disabled="!hasNextPage"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Submit MetaApp Modal -->
      <SubmitMetaAppModal v-model="showSubmitModal" />
    </div>
  </template>

  <script setup lang="ts">
  import { ref, onMounted, computed, type Ref } from 'vue'
  import Banner from '@/components/Banner/Banner.vue'
  import SubmitMetaAppModal from '@/components/SubmitMetaAppModal/SubmitMetaAppModal.vue'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/components/Toast/useToast'
import { type AddressPinListResponse,type PinInfo,  getPinListByPath } from "@/api/ManV2";
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
  const searchQuery = ref('')
  const { showToast } =useToast()
  const showSubmitModal = ref(false)
  const metaAppList: Ref<AddressPinListResponse> = ref({
    total:0,
    list:[]
  })
  // 追踪每个 app-card 的 userInfo 加载状态
const userInfoLoadingMap = ref<Map<string, boolean>>(new Map())

  // 分页相关状态
  const currentPage = ref(1)
  const pageSize = 8

  // 计算总页数
  const totalPages = computed(() => {
    return Math.ceil(metaAppList.value.total / pageSize)
  })

  // 计算是否有下一页
  const hasNextPage = computed(() => {
    return metaAppList.value.total > currentPage.value * pageSize
  })

  const getCoverUrl = (coverImg: string): string => {
    if(!coverImg) return DefaultImg
  if (coverImg.startsWith('metafile://')) {
    const pinId = coverImg.replace('metafile://', '')
    return `https://man.metaid.io/content/${pinId}`
  }
  return coverImg
}

  // 生成分页按钮显示数组
  const pageNumbers = computed(() => {
    const total = totalPages.value
    const current = currentPage.value
    const pages: (number | string)[] = []

    if (total <= 7) {
      // 总页数小于等于7，全部显示
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // 总页数大于7，智能显示
      if (current <= 3) {
        // 当前页在前面
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(total)
      } else if (current >= total - 2) {
        // 当前页在后面
        pages.push(1)
        pages.push('...')
        for (let i = total - 4; i <= total; i++) {
          pages.push(i)
        }
      } else {
        // 当前页在中间
        pages.push(1)
        pages.push('...')
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(total)
      }
    }

    return pages
  })

  // 封装获取MetaApp列表的函数
  async function fetchMetaAppList(page: number = 1) {
    try {
      const cursor = (page - 1) * pageSize
      const result = await getPinListByPath({
        path: '/protocols/metaapp',
        cursor,
        size: pageSize
      })

      // 处理contentSummary的JSON序列化
      if (result && result.list && result.list.length > 0) {
        result.list = result.list.map(item => {
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

      metaAppList.value = result
        if(metaAppList.value.list && metaAppList.value.list.length)
        for (let item of metaAppList.value.list) {
        loadUserInfo(item)
        }
      currentPage.value = page
    } catch (error) {
      console.error('获取MetaApp列表失败:', error)
      showToast('获取MetaApp列表失败', 'error')
    }
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

  // 上一页
  function goToPrevPage() {
    if (currentPage.value > 1) {
      fetchMetaAppList(currentPage.value - 1)
    }
  }

  // 下一页
  function goToNextPage() {
    if (hasNextPage.value) {
      fetchMetaAppList(currentPage.value + 1)
    }
  }

  // 跳转到指定页
  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      fetchMetaAppList(page)
    }
  }

  // 处理下载按钮点击事件
  function handleDownload(item: any) {
    if (item.contentSummary?.content) {
      let content = item.contentSummary.content
      // 如果content格式是metafile://{PINID}，提取PINID
      if (content.startsWith('metafile://')) {
        const pinId = content.replace('metafile://', '')
        window.open(`https://man.metaid.io/content/${pinId}`, '_blank')
      } else {
        // 如果不是metafile格式，直接使用content作为PINID
        window.open(`https://man.metaid.io/content/${content}`, '_blank')
      }
    }
  }




   // 处理运行按钮点击事件
  function handleRun(item: any) {
    // 分析 contentSummary
    
    const contentSummary = item.contentSummary
    if (!contentSummary) {
      showToast('暂无内容信息', 'warning')
      return
    }

    // 检查 contentType
    if (contentSummary?.contentType === 'text/html') {
      // 提取 content
      const content = contentSummary.content

      if (content && content.startsWith('metafile://')) {
        // 提取 PINID
        const pinId = content.replace('metafile://', '')
        console.log('提取的 PINID:', pinId)

        // 新开窗口跳转
        window.open(`https://man.metaid.io/content/${pinId}`, '_blank')
      } else {
        showToast('内容格式不支持', 'warning')
      }
    } else {
      // 非 text/html 类型
      showToast('源码解析功能开发中，敬请期待', 'info')
    }
  }

  function openSubmitModal() {
  if(!userStore.isAuthorized){
    return showToast(`请登录钱包后再进行操作`, 'error')
  }
  showSubmitModal.value = true
}

// 页面加载时获取MetaApp列表
onMounted(async () => {
  await fetchMetaAppList(1)
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
    }
    .version{
      margin-top: 3px;
      border-radius: 200px;
      font-size: 10px;
      color: #3F71FF;
      padding: 5px 10px;
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
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 24px 0;

    .pagination-btn,
    .pagination-number {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      height: 40px;
      padding: 0 12px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        border-color: #000;
        color: white;
        background: #000;
      }

      &.active {
        border-color: #303133;
        background: #303133;
        color: white;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
        color: #9ca3af;
        background: #f9fafb;
      }
    }

    .pagination-ellipsis {
      padding: 0 8px;
      color: #9ca3af;
    }
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
  