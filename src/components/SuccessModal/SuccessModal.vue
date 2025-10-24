<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'

interface Props {
  modelValue: boolean
  txid?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 生成区块浏览器链接
const explorerUrl = computed(() => {
  return props.txid ? `https://www.mvcscan.com/tx/${props.txid}` : ''
})

// 跳转到区块浏览器
const viewTxid = () => {
  if (explorerUrl.value) {
    window.open(explorerUrl.value, '_blank')
  }
}

// 关闭弹窗
const handleClose = () => {
  isOpen.value = false
}
</script>

<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" class="relative z-[10000]" @close="handleClose">
      <!-- 背景遮罩 -->
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-50" />
      </TransitionChild>

      <!-- Dialog 容器 -->
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all"
            >
              <!-- 成功图标和标题 -->
              <div class="px-6 pt-8 pb-6 text-center">
                <!-- 成功图标 -->
                <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg class="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <!-- 标题 -->
                <DialogTitle as="h3" class="text-2xl font-bold text-gray-900 mb-2">
                  创建成功
                </DialogTitle>

                <!-- 描述 -->
                <p class="text-sm text-gray-500 mb-6">
                  您的协议已成功提交到链上
                </p>

                <!-- TxID 显示区域 -->
                <div v-if="txid" class="bg-gray-50 rounded-lg p-4 mb-6">
                  <p class="text-xs text-gray-500 mb-2">交易ID (TxID)</p>
                  <p class="text-sm font-mono text-gray-700 break-all mb-3">
                    {{ txid }}
                  </p>
                  <button
                    @click="viewTxid"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    查看 TxID
                  </button>
                </div>
              </div>

              <!-- 底部按钮 -->
              <div class="px-6 py-4 bg-gray-50 flex justify-center">
                <button
                  @click="handleClose"
                  class="px-6 py-2.5 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all"
                >
                  关闭
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped>
/* 无需额外样式，使用 Tailwind CSS */
</style>
