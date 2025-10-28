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
      <!-- 空状态提示 -->
      <div v-if="protocols.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="empty-text ">暂未查询到协议列表</p>
      </div>

      <!-- 协议列表 -->
      <div v-else class="protocol-grid">
        <ProtocolCard
          v-for="protocol in protocols"
          :key="protocol.id"
          :id="protocol.id"
          :title="protocol.title"
          :description="protocol.description"
        />
      </div>
    </div>

    <!-- 提交协议弹窗 -->
    <SubmitProtocolModal v-model="showSubmitModal" />
  </section>
</template>

<script setup lang="ts">
import { ref,type Ref } from 'vue'
import ProtocolCard from '@/components/ProtocolCard/ProtocolCard.vue'
import SubmitProtocolModal from '@/components/SubmitProtocolModal/SubmitProtocolModal.vue'
import { useToast } from '@/components/Toast/useToast'
import { useUserStore } from '@/stores/user'

interface Protocol {
  id: number
  title: string
 
  description: string
}

const showSubmitModal = ref(false)
const userStore=useUserStore()
const { showToast } = useToast()

const protocols: Ref<Protocol[]> = ref([

])


function openSubmitModal() {
  if(!userStore.isAuthorized){
    return showToast(`请登录钱包后再进行操作`, 'error')
  }
  showSubmitModal.value = true
}
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
</style>
