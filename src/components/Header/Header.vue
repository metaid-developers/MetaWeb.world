<template>
  <header class="header">
    <div class="header-container">
      <!-- Logo -->
      <div class="logo-section">
        <img 
          src="@/assets/images/logo.svg" 
          alt="MetaWeb World" 
          class="logo w-[180px] h-[12px]"
        />
      </div>

      <!-- Navigation Menu -->
      <nav class="nav-menu">
        <ul class="nav-list">
          <li 
            v-for="item in navItems" 
            :key="item.key" 
            class="nav-item"
            :class="{ active: isNavActive(item.key) }"
          >
            <a 
              href="#" 
              class="nav-link" 
              :class="{ active: isNavActive(item.key) }"
              @click="(e) => handleNavClick(e, item.key)"
            >
              {{ item.name }}
            </a>
          </li>
        </ul>
      </nav>

    

      <div class="flex items-center">
             <!-- Mobile Menu Toggle -->
      <button 
        class="mobile-menu-toggle mr-4"
        @click="toggleMobileMenu"
        :class="{ active: isMobileMenuOpen }"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>

        <!-- User Operations -->
        <div class="user-section flex items-center">
        <LoginUserOperate />
      </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div class="mobile-menu" :class="{ open: isMobileMenuOpen }">
      <nav class="mobile-nav">
        <ul class="mobile-nav-list">
          <li 
            v-for="item in navItems" 
            :key="item.key" 
            class="mobile-nav-item"
            :class="{ active: isNavActive(item.key) }"
          >
            <a 
              href="#" 
              class="mobile-nav-link" 
              :class="{ active: isNavActive(item.key) }"
              @click="(e) => handleNavClick(e, item.key)"
            >
              {{ item.name }}
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LoginUserOperate from '@/components/LoginUserOperate/LoginUserOperate.vue'
import { useToast } from '@/components/Toast/useToast'

const router = useRouter()
const route = useRoute()
const { showToast } = useToast()
const isMobileMenuOpen = ref(false)

// 导航配置
const navItems = [
  { name: 'MetaApp广场', path: '/', key: 'metaapp' },
  { name: '协议广场', path: '/metaprotocol', key: 'metaprotocol' },
  { name: '服务和工具', path: '/services', key: 'services' },
  { name: '开发MetaApp', path: '/develop', key: 'develop' },
  { name: '文档', path: '/docs', key: 'docs' },
  { name: '交流区', path: '/community', key: 'community' }
]

// 判断导航项是否激活
const isNavActive = (navKey: string) => {
  if (navKey === 'metaapp') {
   
    return route.path === '/' || route.path.startsWith('/metaapp/')
  }
  return route.path === navItems.find(item => item.key === navKey)?.path
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// 导航点击处理
const handleNavClick = (e: Event, navKey: string) => {
  e.preventDefault()
  const navItem = navItems.find(item => item.key === navKey)
  if (navItem) {
    router.push(navItem.path)
    closeMobileMenu()
  }
}
</script>

<style lang="scss" scoped>
.header {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-container {
  max-width: 95%;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.logo-section {
  flex-shrink: 0;
  
  .logo {
    width: 180px;
    height: 25px;
  
    transition: transform 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
    }
  }
}

.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
  
  @media (max-width: 960px) {
    display: none;
  }
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 40px;
}

.nav-item {
  position: relative;
}

.nav-link {
  color: #333333;
  text-decoration: none;
  font-weight: 500;
  font-size: 16px;
  padding: 8px 0;
  transition: color 0.3s ease;
  position: relative;
  
  &:hover {
    color: #007bff;
  }
  
  // 激活状态样式
  &.active {
    color: #007bff;
    font-weight: 600;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: #007bff;
    transition: width 0.3s ease;
  }
  
  &:hover::after,
  &.active::after {
    width: 100%;
  }
}

.user-section {
  flex-shrink: 0;
  
 
}

.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  
  @media (max-width: 960px) {
    display: flex;
  }
  
  .hamburger-line {
    width: 100%;
    height: 2px;
    background: #333333;
    transition: all 0.3s ease;
    transform-origin: center;
  }
  
  &.active {
    .hamburger-line:nth-child(1) {
      transform: rotate(45deg) translate(6px, 6px);
    }
    
    .hamburger-line:nth-child(2) {
      opacity: 0;
    }
    
    .hamburger-line:nth-child(3) {
      transform: rotate(-45deg) translate(6px, -6px);
    }
  }
}

.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-100%);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  
  &.open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }
  
  @media (min-width: 769px) {
    display: none;
  }
}

.mobile-nav {
  padding: 20px;
}

.mobile-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mobile-nav-item {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.mobile-nav-link {
  color: #333333;
  text-decoration: none;
  font-weight: 500;
  font-size: 18px;
  display: block;
  padding: 12px 0;
  transition: color 0.3s ease;
  position: relative;
  
  &:hover {
    color: #007bff;
  }
  
  // 激活状态样式
  &.active {
    color: #007bff;
    font-weight: 600;
    
    &::before {
      content: '';
      position: absolute;
      left: -20px;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 20px;
      background: #007bff;
      border-radius: 2px;
    }
  }
}

@media (max-width: 1280px){
  .header-container {
    max-width: 100%;
  }
}

// 响应式断点
@media (max-width: 1024px) {
  .header-container {
    padding: 0 16px;
  }
  
  .nav-list {
    gap: 30px;
  }
}

@media (max-width: 768px) {
  .header-container {
    height: 60px;
    padding: 0 16px;
  }
  
  .logo {
    height: 35px;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0 12px;
  }
  
  .logo {
    height: 30px;
  }
}
</style>

