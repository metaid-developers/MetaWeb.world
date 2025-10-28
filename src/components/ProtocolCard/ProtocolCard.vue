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
    <p class="card-description">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

interface Props {
  title: string
  tags?: string[] // 使 tags 成为可选属性
  description: string
  protocolName:string
  id: string // 协议PINID
}

const props = defineProps<Props>()
const router = useRouter()

const handleClick = () => {
  router.push({ name: 'ProtocolDetail', params: { id: props.id } })
}
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
  margin: 0;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
    line-height: 1.5;
  }
}
</style>
