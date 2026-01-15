<template>
  <div class="protocol-card" @click="handleClick">
    <div class="card-header">
      <h3 class="card-title">{{protocolName}}: {{ title }}</h3>
      <!-- <div class="card-tags">
        <span
          v-for="tag in tags"
          :key="tag"
          class="tag"
        >
          {{ tag }}
        </span>
      </div> -->
    </div>
    <p class="card-description">{{ truncatedDescription }}</p>
    
    <!-- 用户信息 -->
    <div class="card-user-info">
      <UserAvatar
        :image="userInfo?.avatar || ''"
        :meta-id="userInfo?.metaid || ''"
        :name="userInfo?.name || ''"
        class="user-avatar"
        :meta-name="''"
        :disabled="true"
        :is-custom="false"
      />
      <div class="user-details">
        <span class="user-name">{{ userInfo?.name || userInfo?.metaid?.slice(0,6) || 'Unknown' }}</span>
        <span class="user-metaid">MetaID: {{ userInfo?.metaid?.slice(0,6) || 'N/A' }}</span>
      </div>
    </div>
    
    <!-- 协议信息（发布日期和 Txid） -->
    <div class="card-protocol-info">
    
      <div class="txid-info">
        <span class="txid-label">Txid:</span>
        <span class="txid-value">{{ formatTxid(props.lastId.slice(0,-2)) }}</span>
        <svg 
          @click.stop="openTxLink(props.lastId.slice(0,-2))" 
          class="link-icon" 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UserAvatar from '@/components/UserAvatar/UserAvatar.vue'
import { getUserInfoByAddress, type UserInfo } from '@/api/man'
import { formatDateTime } from '@/utils/format'

interface Props {
  timestamp:number
  address:string
  title: string
  tags?: string[] // 使 tags 成为可选属性
  description: string
  protocolName:string
  id: string // 协议PINID
  lastId?:string
}

const props = defineProps<Props>()
const router = useRouter()
const userInfo = ref<UserInfo | null>(null)

// 截取描述文本，超过 80 个字符则显示前 80 个字符 + 省略号
const truncatedDescription = computed(() => {
  if (!props.description) return ''
  if (props.description.length <= 80) return props.description
  return props.description.slice(0, 80) + '...'
})

// 异步加载用户信息
const loadUserInfo = async () => {
  
  if (!props.address) return
  
  try {
    const info = await getUserInfoByAddress(props.address)
    
    userInfo.value = info
  } catch (error) {
    console.error(`Failed to load user info for address ${props.address}:`, error)
  }
}

// 格式化 Txid 显示
const formatTxid = (txid: string): string => {
  if (!txid || txid.length <= 8) return txid
  return `${txid.slice(0, 4)}...${txid.slice(-4)}`
}

// 跳转到区块链浏览器查看交易
const openTxLink = (txid: string) => {
  if (!txid) return
  const url = `https://www.mvcscan.com/tx/${txid}`
  window.open(url, '_blank')
}

const handleClick = () => {
  router.push({ name: 'ProtocolDetail', params: { id: props.id } })
}

// 组件挂载时加载用户信息
onMounted(() => {
  loadUserInfo()
})
</script>

<style lang="scss" scoped>
.protocol-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer; // 添加指针样式

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 16px;
  }
}

.card-header {
  margin-bottom: 16px;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    font-size: 0.95rem;
  }
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  @media (max-width: 480px) {
    gap: 6px;
  }
}

.tag {
  display: inline-block;
  padding: 4px 12px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }

  @media (max-width: 480px) {
    padding: 3px 10px;
    font-size: 0.7rem;
  }
}

.card-description {
  color: #6b7280;
  line-height: 1.6;
  font-size: 0.875rem;
  margin: 0 0 16px 0;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
    line-height: 1.5;
  }
}

.card-user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  
  margin-top: auto;

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .user-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;

    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
      line-height: 1.2;
    }

    .user-metaid {
      font-size: 0.75rem;
      color: #6b7280;
      line-height: 1.2;
    }
  }
}

.card-protocol-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
  font-size: 0.75rem;
  color: #6b7280;

  .publish-date {
    display: flex;
    align-items: center;
  }

  .txid-info {
    display: flex;
    align-items: center;
    gap: 6px;

    .txid-label {
      font-weight: 500;
    }

    .txid-value {
      font-family: monospace;
      color: #374151;
    }

    .link-icon {
      cursor: pointer;
      color: #6b7280;
      transition: color 0.2s;
      flex-shrink: 0;

      &:hover {
        color: #3b82f6;
      }
    }
  }
}
</style>
