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
        <div class="apps-grid" v-if="metaAppList.length">
          <!-- Placeholder cards - these would be populated from API -->
          <div class="app-card" v-for="(item,index) in metaAppList" :key="index">
            <div class="app-cover">
              <div class="app-cover-placeholder"></div>
            </div>
            <div class="app-info">
              <div class="app-header">
                <div class="app-icon">
                  <div class="icon-placeholder"></div>
                </div>
                <div class="app-meta">
                  <h3 class="app-name">App Name</h3>
                  <div class="app-stats">
                    <span class="stat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      2.2k
                    </span>
                    <span class="stat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.2225 22.4518 8.5C22.4518 7.7775 22.3095 7.06211 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      2.2k
                    </span>
                  </div>
                </div>
                <span class="version-badge">版本1.0</span>
              </div>
              <p class="app-description">
                这是一个示例应用的描述文本，会显示应用的主要功能和特点。
              </p>
              <div class="app-footer">
                <div class="app-author">
                  <div class="author-avatar"></div>
                  <span class="author-name">metaid.space</span>
                </div>
                <div class="app-actions">
                  <button class="btn-download">下载</button>
                  <button class="btn-run">运行</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <!-- <div class="pagination">
          <button class="pagination-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <button class="pagination-number active">1</button>
          <button class="pagination-number">2</button>
          <button class="pagination-number">3</button>
          <button class="pagination-number">4</button>
          <button class="pagination-number">5</button>
          <span class="pagination-ellipsis">...</span>
          <button class="pagination-number">30</button>

          <button class="pagination-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div> -->
      </div>

      <!-- Submit MetaApp Modal -->
      <SubmitMetaAppModal v-model="showSubmitModal" />
    </div>
  </template>

  <script setup lang="ts">
  import { ref,type Ref } from 'vue'
  import Banner from '@/components/Banner/Banner.vue'
  import SubmitMetaAppModal from '@/components/SubmitMetaAppModal/SubmitMetaAppModal.vue'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/components/Toast/useToast'
import { type AddressPinListResponse } from "@/api/ManV2";
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
  const metaAppList:Ref<AddressPinListResponse[]>=ref([])

  function openSubmitModal() {
  if(!userStore.isAuthorized){
    return showToast(`请登录钱包后再进行操作`, 'error')
  }
  showSubmitModal.value = true
}
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
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
    margin-bottom: 48px;
  }

  .app-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
  }

  .app-cover {
    width: 100%;
    height: 160px;
    overflow: hidden;

    .app-cover-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  }

  .app-info {
    padding: 16px;
  }

  .app-header {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    align-items: flex-start;
  }

  .app-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;

    .icon-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
    }
  }

  .app-meta {
    flex: 1;
    min-width: 0;

    .app-name {
      margin: 0 0 6px 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .app-stats {
      display: flex;
      gap: 12px;

      .stat {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: #6b7280;

        svg {
          color: #9ca3af;
        }
      }
    }
  }

  .version-badge {
    padding: 4px 10px;
    background: #eff6ff;
    color: #3b82f6;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  .app-description {
    margin: 0 0 16px 0;
    font-size: 14px;
    line-height: 1.6;
    color: #6b7280;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .app-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #f3f4f6;
  }

  .app-author {
    display: flex;
    align-items: center;
    gap: 8px;

    .author-avatar {
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
    }

    .author-name {
      font-size: 12px;
      color: #6b7280;
    }
  }

  .app-actions {
    display: flex;
    gap: 8px;

    button {
      padding: 6px 14px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-download {
      background: #f3f4f6;
      color: #374151;

      &:hover {
        background: #e5e7eb;
      }
    }

    .btn-run {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;

      &:hover {
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        transform: translateY(-1px);
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

      &:hover {
        border-color: #3b82f6;
        color: #3b82f6;
        background: #eff6ff;
      }

      &.active {
        border-color: #3b82f6;
        background: #3b82f6;
        color: white;
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
      gap:15px 16px;
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
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
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
  }

  </style>
  