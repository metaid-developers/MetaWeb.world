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
        <div class="apps-grid" v-if="metaAppList.list.length">
          <div class="app-card" v-for="item in metaAppList.list" :key="item.id">
            <!-- 卡片预览图 -->
            <div class="card-preview">
              <div class="preview-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7V12C2 16.5 4.23 20.68 7.62 23.15L12 24L16.38 23.15C19.77 20.68 22 16.5 22 12V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="preview-overlay"></div>
            </div>

            <!-- 卡片内容 -->
            <div class="card-content">
              <div class="app-header">
                <h3 class="app-title">{{ item.content || 'MetaApp' }}</h3>
                <p class="app-description">
                  {{ getContentDescription(item) }}
                </p>
              </div>

              <div class="card-footer">
                <div class="app-stats">
                  <div class="stat-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>{{ item.pop || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.2225 22.4518 8.5C22.4518 7.7775 22.3095 7.06211 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>{{ item.popLv || 0 }}</span>
                  </div>
                </div>

                <div class="action-buttons">
                  <button class="btn-download">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    下载
                  </button>
                  <button class="btn-run">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M5 3L19 12L5 21V3Z" fill="currentColor"/>
                    </svg>
                    运行
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
import { type AddressPinListResponse, getPinListByPath } from "@/api/ManV2";
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
        })
      }

      metaAppList.value = result
      currentPage.value = page
    } catch (error) {
      console.error('获取MetaApp列表失败:', error)
      showToast('获取MetaApp列表失败', 'error')
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

  // 获取内容描述的辅助函数
  function getContentDescription(item: any) {
    if (item.contentSummary) {
      if (typeof item.contentSummary === 'object') {
        return item.contentSummary.description || item.contentSummary.summary || '暂无描述'
      }
      return item.contentSummary
    }
    return item.content || '暂无描述'
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
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.3s;
    cursor: pointer;
   
    position: relative;

    &:hover {
      transform: translateY(-8px);
  
      
    }
  }

  .card-preview {
    position: relative;
    width: 100%;
    height: 180px;
   
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    .preview-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.8);
      z-index: 2;
    }

    .preview-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
      z-index: 1;
    }
  }

  .card-content {
    padding: 20px;
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(10px);
  }

  .app-header {
    margin-bottom: 16px;

    .app-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.3;
    }

    .app-description {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.7);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
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
    gap: 16px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);

      svg {
        color: rgba(255, 255, 255, 0.4);
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;

    button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-download {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #ffffff;
        transform: translateY(-1px);
      }

      svg {
        color: currentColor;
      }
    }

    .btn-run {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);

      &:hover {
        box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
        transform: translateY(-1px);
      }

      svg {
        color: currentColor;
      }
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
        border-color: #3b82f6;
        color: #3b82f6;
        background: #eff6ff;
      }

      &.active {
        border-color: #3b82f6;
        background: #3b82f6;
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
      height: 140px;
    }

    .card-content {
      padding: 16px;
    }

    .app-header .app-title {
      font-size: 16px;
    }

    .action-buttons {
      button {
        padding: 6px 12px;
        font-size: 13px;

        svg {
          width: 16px;
          height: 16px;
        }
      }
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

    .card-preview {
      height: 120px;
    }

    .card-content {
      padding: 12px;
    }

    .app-header {
      margin-bottom: 12px;

      .app-title {
        font-size: 15px;
        margin-bottom: 6px;
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
      width: 100%;

      button {
        flex: 1;
        justify-content: center;
      }
    }
  }

  </style>
  