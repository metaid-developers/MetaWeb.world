<template>
  <section class="banner">
    <!-- Banner Content -->
    <div class="banner-content">
      <!-- Title -->
      <h1 class="banner-title">这一代互联网由我们来创造</h1>

      <!-- Description -->
      <p class="banner-description">
        MetaWeb是一个完全基于区块链技术的网络。每一个应用，每一笔交易都保存在公链上，不受任何第三方限制
      </p>

      <!-- Icons -->
      <div class="banner-icons">
        <div class="icon-item" v-for="(icon, index) in icons" :key="index">
          <img :src="icon.src" :alt="icon.alt" class="icon-img" />
        </div>
      </div>
    </div>

    <!-- Background Gradient -->
    <div class="banner-bg"></div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Icons data
const icons = ref([
  { src: new URL('@/assets/images/Group1.svg', import.meta.url).href, alt: '聊天' },
  { src: new URL('@/assets/images/Group2.svg', import.meta.url).href, alt: '笔记本' },
  { src: new URL('@/assets/images/Group3.svg', import.meta.url).href, alt: '邮箱' },
  { src: new URL('@/assets/images/Group4.svg', import.meta.url).href, alt: '邮件' },
  { src: new URL('@/assets/images/Group5.svg', import.meta.url).href, alt: '复选框' },
  { src: new URL('@/assets/images/Group6.svg', import.meta.url).href, alt: '图片' },
])
</script>

<style lang="scss" scoped>
.banner {
  position: relative;
  background: #000;
  height: 100%;
  max-width: 100%;
  width: 1280px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 40px 0px;
  margin: 50px auto 0;
  border-radius: 16px;

  @media (max-width: 1024px) {
    padding: 30px 0px;
    height: 260px;
  }

  @media (max-width: 768px) {
    padding: 24px 0;
    height: auto;
    min-height: 240px;
  }

  @media (max-width: 480px) {
    padding: 20px 0;
    margin-top: 30px;
    max-width: 100%;
  }
}

.banner-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  //background-position: 100% 100%;
  background-image: url("@/assets/images/banner.svg");
  pointer-events: none;
  z-index: 1;
  background-repeat: no-repeat;
}

.banner-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1200px;
  text-align: center;
  color: white;

}

.banner-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px 0;
  line-height: 1.2;
  letter-spacing: 0.5px;

  @media (max-width: 1024px) {
    font-size: 32px;
    margin-bottom: 14px;
  }

  @media (max-width: 768px) {
    font-size: 26px;
    margin-bottom: 12px;
  }

  @media (max-width: 480px) {
    font-size: 22px;
    margin-bottom: 10px;
  }
}

.banner-description {
  font-size: 15px;
  font-weight: 400;
  line-height: 1.6;
  margin: 0 0 32px 0;
  opacity: 0.9;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 1024px) {
    font-size: 14px;
    margin-bottom: 28px;
  }

  @media (max-width: 768px) {
    font-size: 13px;
    margin-bottom: 24px;
    padding: 0 10px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    margin-bottom: 20px;
    line-height: 1.5;
  }
}

.banner-icons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 50px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 20px;
  }

  @media (max-width: 480px) {
  gap: 12px;
  }
}

.icon-item {
  width: 70px;
  height: 70px;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }

  @media (max-width: 480px) {
    // width: 50px;
    // height: 50px;
  }
}

.icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}
</style>

