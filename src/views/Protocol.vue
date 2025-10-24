<template>
  <div class="protocol-view">
    <Banner />
    <ProtocolList />
  </div>
</template>

<script setup lang="ts">
import Banner from '@/components/Banner/Banner.vue'
import ProtocolList from '@/components/ProtocolList/ProtocolList.vue'
</script>

<style lang="scss" scoped>
.protocol-view {
  width: 100%;
}
</style>
