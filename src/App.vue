<template>
  <div class="app-container">
    <!-- Header 导航栏 -->
    <Header />
    
    <!-- 主要内容区域 -->
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- Footer 底部 -->
    <footer class="app-footer">
      <div class="footer-content">
        <span class="footer-text">About MetalID</span>
        <span class="footer-text">About MetaBitcoin Network</span>
      </div>
    </footer>
    
    <!-- 模态框组件 -->
    <ConnectWalletModalVue />
  </div>
</template>
<script setup lang='ts'>
import { ref } from 'vue'
import Header from '@/components/Header/Header.vue'
import ConnectWalletModalVue from '@/components/ConnectWalletModal/ConnectWalletModal.vue'



</script>
<style lang='scss' scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  background: #F5F5F7;
  padding-bottom: 0;
  padding: 0 20px;
}

.app-footer {
  background-color: #F5F5F7;
  padding: 20px 0;
  margin-top: auto;
  border-top: 1px solid #e0e0e0;
  
  .footer-content {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 40px;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 16px;
    }
  }
  
  .footer-text {
    color: #666666;
    font-size: 14px;
    font-weight: 400;
    cursor: pointer;
    transition: color 0.3s ease;
    
    &:hover {
      color: #333333;
    }
  }
}

// 确保页面内容不会与footer重叠
body {
  margin: 0;
  padding: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .app-footer {
    padding: 16px 0;
    
    .footer-content {
      padding: 0 16px;
    }
    
    .footer-text {
      font-size: 13px;
    }
  }
}
</style>