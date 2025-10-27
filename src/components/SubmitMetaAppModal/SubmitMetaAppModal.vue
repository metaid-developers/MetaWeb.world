<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useCreateProtocols } from '@/hooks/use-create-protocols'
import { useToast } from '@/components/Toast/useToast'
import { useUserStore } from '@/stores/user'
import SuccessModal from '@/components/SuccessModal/SuccessModal.vue'
import ProtocolAttachmentUpload from '@/components/ProtocolAttachmentUpload/ProtocolAttachmentUpload.vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { uploadApp, createFile } = useCreateProtocols()
const { showToast } = useToast()
const userStore = useUserStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Runtime options
const runtimeOptions = [
  { value: 'browser', label: 'Browser' },
  { value: 'android', label: 'Android' },
  { value: 'ios', label: 'iOS' },
  { value: 'windows', label: 'Windows' },
  { value: 'macOS', label: 'macOS' },
  { value: 'linux', label: 'Linux' }
]

// Form data
const formData = ref({
  title: '',
  appName: '',
  prompt: '',
  icon: '',
  coverImg: '',
  introImgs: [] as string[],
  intro: '',
  runtime: 'browser',
  indexFile: '',
  version: 'v1.0.0',
  contentType: 'application/zip',
  content: '',
  code: '',
  contentHash: '',
  metadata: ''
})

const isSubmitting = ref(false)

// File upload refs
const iconUploadRef = ref<InstanceType<typeof ProtocolAttachmentUpload>>()
const coverUploadRef = ref<InstanceType<typeof ProtocolAttachmentUpload>>()
const introImgsUploadRef = ref<InstanceType<typeof ProtocolAttachmentUpload>>()
const contentUploadRef = ref<InstanceType<typeof ProtocolAttachmentUpload>>()
const codeUploadRef = ref<InstanceType<typeof ProtocolAttachmentUpload>>()

// Success modal
const showSuccessModal = ref(false)
const successTxid = ref('')

// Computed: form validation
// Required fields: title, appName, runtime, content
const isFormValid = computed(() => {
  return !!(
    formData.value.title.trim() &&
    formData.value.appName.trim() &&
    formData.value.runtime.trim() &&
    (contentUploadRef.value && contentUploadRef.value.selectedFiles.length > 0)
  )
})

// Upload single file and get metafile link
const uploadSingleFile = async (uploadRef: any, fieldName: string): Promise<string> => {
  if (!uploadRef?.value || uploadRef.value.selectedFiles.length === 0) {
    return ''
  }

  try {
    showToast(`正在上传${fieldName}到链上...`, 'info')
    const txids = await uploadRef.value.uploadFilesToChain()

    if (txids.length > 0) {
      return `metafile://${txids[0]}i0`
    }

    throw new Error('上传失败：未获取到交易ID')
  } catch (error) {
    throw new Error(`${fieldName}上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// Upload multiple files and get metafile links array
const uploadMultipleFiles = async (uploadRef: any, fieldName: string): Promise<string[]> => {
  if (!uploadRef?.value || uploadRef.value.selectedFiles.length === 0) {
    return []
  }

  try {
    showToast(`正在上传${fieldName}到链上...`, 'info')
    const txids = await uploadRef.value.uploadFilesToChain()

    return txids.map(txid => `metafile://${txid}i0`)
  } catch (error) {
    throw new Error(`${fieldName}上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// Submit form
const handleSubmit = async () => {
  // Validate required fields only: title, appName, runtime, content
  if (!formData.value.title.trim()) {
    showToast('请填写标题', 'warning')
    return
  }
  if (!formData.value.appName.trim()) {
    showToast('请填写应用名称', 'warning')
    return
  }
  if (!formData.value.runtime.trim()) {
    showToast('请选择运行时环境', 'warning')
    return
  }

  // Validate required file upload: content only
  if (!contentUploadRef.value || contentUploadRef.value.selectedFiles.length === 0) {
    showToast('请上传应用内容包', 'warning')
    return
  }

  try {
    isSubmitting.value = true

    // Upload required file: content
    const content = await uploadSingleFile(contentUploadRef, '应用内容包')

    // Upload optional files
    const icon = await uploadSingleFile(iconUploadRef, '应用图标')
    const coverImg = await uploadSingleFile(coverUploadRef, '封面图')
    const introImgs = await uploadMultipleFiles(introImgsUploadRef, '简介图')
    const code = await uploadSingleFile(codeUploadRef, '源码包')

    showToast('文件上传成功，正在提交MetaApp...', 'success')

    // Parse metadata (optional)
    let parsedMetadata: any = ''
    if (formData.value.metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(formData.value.metadata)
      } catch (error) {
        parsedMetadata = formData.value.metadata
      }
    }

    // Build MetaApp protocol data with required fields
    const metaAppData: any = {
      title: formData.value.title,
      appName: formData.value.appName,
      runtime: formData.value.runtime,
      version: formData.value.version,
      contentType: formData.value.contentType,
      content: content
    }

    // Add optional fields only if they have values
    if (formData.value.prompt.trim()) {
      metaAppData.prompt = formData.value.prompt
    }
    if (icon) {
      metaAppData.icon = icon
    }
    if (coverImg) {
      metaAppData.coverImg = coverImg
    }
    if (introImgs.length > 0) {
      metaAppData.introImgs = introImgs
    }
    if (formData.value.intro.trim()) {
      metaAppData.intro = formData.value.intro
    }
    if (formData.value.indexFile.trim()) {
      metaAppData.indexFile = formData.value.indexFile
    }
    if (code) {
      metaAppData.code = code
    }
    if (formData.value.contentHash.trim()) {
      metaAppData.contentHash = formData.value.contentHash
    }
    if (parsedMetadata) {
      metaAppData.metadata = parsedMetadata
    }

    const metaidData = {
      path: `/protocols/metaapp`,
      body: metaAppData,
      contentType: 'application/json',
      encoding: 'utf-8' as const,
      version: '1.0.0',
      operation: 'create' as const
    }

    console.log('提交MetaApp数据:', metaidData)

    const options = {
      serialAction: 'finish' as const,
    }

    // Call uploadApp method
    const result = await uploadApp(metaidData, options)

    console.log('MetaApp上链结果:', result)

    // Extract txid
    const txid = result?.txid || result?.txids?.[0]

    // Reset form and close modal
    resetForm()
    isOpen.value = false

    showToast('MetaApp提交成功！', 'success')

    // Show success modal if txid exists
    if (txid) {
      successTxid.value = txid
      showSuccessModal.value = true

      console.log('✅ MetaApp已成功提交到链上')
      console.log('🔗 TxID:', txid)
    }
  } catch (error) {
    console.error('提交MetaApp失败:', error)
    showToast(`提交失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Reset form
const resetForm = () => {
  formData.value = {
    title: '',
    appName: '',
    prompt: '',
    icon: '',
    coverImg: '',
    introImgs: [],
    intro: '',
    runtime: 'browser',
    indexFile: '',
    version: 'v1.0.0',
    contentType: 'application/zip',
    content: '',
    code: '',
    contentHash: '',
    metadata: ''
  }

  // Clear all file upload components
  iconUploadRef.value?.clearFiles()
  coverUploadRef.value?.clearFiles()
  introImgsUploadRef.value?.clearFiles()
  contentUploadRef.value?.clearFiles()
  codeUploadRef.value?.clearFiles()
}

// Close modal
const handleClose = () => {
  if (!isSubmitting.value) {
    isOpen.value = false
  }
}
</script>

<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" class="relative z-[9999]" static>
      <!-- Background overlay -->
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

      <!-- Dialog container -->
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
              class="w-[90vw] h-[90vh] transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all flex flex-col"
            >
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <DialogTitle as="h3" class="text-xl font-bold text-gray-900">
                  提交 MetaApp
                </DialogTitle>
                <button
                  @click="handleClose"
                  :disabled="isSubmitting"
                  class="rounded-lg p-1 hover:bg-white/50 transition-colors disabled:opacity-50"
                  aria-label="关闭"
                >
                  <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Content -->
              <div class="px-6 py-6 flex-1 overflow-y-auto">
                <form @submit.prevent="handleSubmit" class="space-y-8">
                  <!-- Basic Information -->
                  <div class="space-y-6">
                    <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span class="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded"></span>
                      基础信息
                    </h4>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Title -->
                      <div class="form-item">
                        <label class="form-label">
                          标题 <span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model="formData.title"
                          type="text"
                          class="form-input"
                          placeholder="请输入MetaApp标题"
                          required
                        />
                      </div>

                      <!-- App Name -->
                      <div class="form-item">
                        <label class="form-label">
                          应用名称 <span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model="formData.appName"
                          type="text"
                          class="form-input"
                          placeholder="请输入应用名称"
                          required
                        />
                      </div>
                    </div>

                    <!-- Prompt (Optional for AI-generated apps) -->
                    <div class="form-item">
                      <label class="form-label">
                        生成提示词 <span class="text-gray-400 text-xs">(可选)</span>
                      </label>
                      <textarea
                        v-model="formData.prompt"
                        class="form-input resize-none"
                        placeholder="如果是AI生成的应用，请填写生成提示词；开发者自行开发的应用可不填"
                        rows="3"
                      ></textarea>
                      <p class="text-xs text-gray-500 mt-1">
                        仅AI生成的应用需要填写此项
                      </p>
                    </div>

                    <!-- Intro -->
                    <div class="form-item">
                      <label class="form-label">
                        应用简介 <span class="text-gray-400 text-xs">(可选)</span>
                      </label>
                      <textarea
                        v-model="formData.intro"
                        class="form-input resize-none"
                        placeholder="请输入应用说明简介"
                        rows="4"
                      ></textarea>
                    </div>
                  </div>

                  <!-- File Uploads -->
                  <div class="space-y-6">
                    <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span class="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded"></span>
                      文件资源
                    </h4>

                    <!-- Icon -->
                    <div class="form-item">
                      <label class="form-label">
                        应用图标 <span class="text-gray-400 text-xs">(可选)</span>
                      </label>
                      <ProtocolAttachmentUpload
                        ref="iconUploadRef"
                        :max-files="1"
                        accepted-types="image/*"
                      />
                      <p class="text-xs text-gray-500 mt-1">
                        格式将自动转换为 metafile://{`{PINID}`}
                      </p>
                    </div>

                    <!-- Cover Image -->
                    <div class="form-item">
                      <label class="form-label">
                        封面图 <span class="text-gray-400 text-xs">(可选)</span>
                      </label>
                      <ProtocolAttachmentUpload
                        ref="coverUploadRef"
                        :max-files="1"
                        accepted-types="image/*"
                      />
                      <p class="text-xs text-gray-500 mt-1">
                        格式将自动转换为 metafile://{`{PINID}`}
                      </p>
                    </div>

                    <!-- Intro Images -->
                    <div class="form-item">
                      <label class="form-label">
                        简介图 <span class="text-gray-400 text-xs">(可选)</span>
                      </label>
                      <ProtocolAttachmentUpload
                        ref="introImgsUploadRef"
                        :max-files="5"
                        accepted-types="image/*"
                      />
                      <p class="text-xs text-gray-500 mt-1">
                        可上传多张图片，格式将自动转换为 metafile://{`{PINID}`} 数组
                      </p>
                    </div>

                    <!-- Content Package -->
                    <div class="form-item">
                      <label class="form-label">
                        应用构建压缩包 <span class="text-red-500">*</span>
                      </label>
                      <ProtocolAttachmentUpload
                        ref="contentUploadRef"
                        :max-files="1"
                        accepted-types=".zip,.rar,.7z,.tar,.gz"
                      />
                      <p class="text-xs text-gray-500 mt-1">
                        上传MetaApp构建压缩包，格式将自动转换为 metafile://{`{PINID}`}
                      </p>
                    </div>

                    <!-- Source Code (Optional) -->
                    <div class="form-item">
                      <label class="form-label">
                        源码包 <span class="text-gray-400 text-xs">(可选)</span>
                      </label>
                      <ProtocolAttachmentUpload
                        ref="codeUploadRef"
                        :max-files="1"
                        accepted-types=".zip,.rar,.7z,.tar,.gz"
                      />
                      <p class="text-xs text-gray-500 mt-1">
                        格式将自动转换为 metacode://{`{PINID}`}
                      </p>
                    </div>
                  </div>

                  <!-- Technical Details -->
                  <div class="space-y-6">
                    <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span class="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded"></span>
                      技术信息
                    </h4>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Runtime -->
                      <div class="form-item">
                        <label class="form-label">
                          运行时环境 <span class="text-red-500">*</span>
                        </label>
                        <select v-model="formData.runtime" class="form-input" required>
                          <option v-for="runtime in runtimeOptions" :key="runtime.value" :value="runtime.value">
                            {{ runtime.label }}
                          </option>
                        </select>
                      </div>

                      <!-- Index File -->
                      <div class="form-item">
                        <label class="form-label">
                          索引文件 <span class="text-gray-400 text-xs">(可选)</span>
                        </label>
                        <input
                          v-model="formData.indexFile"
                          type="text"
                          class="form-input"
                          placeholder="例如: index.html"
                        />
                      </div>

                      <!-- Version -->
                      <div class="form-item">
                        <label class="form-label">
                          版本号
                        </label>
                        <input
                          v-model="formData.version"
                          type="text"
                          class="form-input"
                          placeholder="v1.0.1"
                        />
                      </div>

                      <!-- Content Type -->
                      <div class="form-item">
                        <label class="form-label">
                          内容类型
                        </label>
                        <input
                          v-model="formData.contentType"
                          type="text"
                          class="form-input"
                          placeholder="application/zip"
                        />
                      </div>
                    </div>

                    <!-- Content Hash (Optional) -->
                    <div class="form-item">
                      <label class="form-label">
                        内容哈希 <span class="text-gray-400 text-xs">(可选)</span>
                      </label>
                      <input
                        v-model="formData.contentHash"
                        type="text"
                        class="form-input"
                        placeholder="请输入内容哈希值"
                      />
                    </div>

                    <!-- Metadata (Optional) -->
                    <div class="form-item">
                      <label class="form-label">
                        元数据 <span class="text-gray-400 text-xs">(可选)</span>
                      </label>
                      <textarea
                        v-model="formData.metadata"
                        class="form-input resize-none"
                        placeholder="可以是任意类型的数据"
                        rows="3"
                      ></textarea>
                      <p class="text-xs text-gray-500 mt-1">
                        支持任意类型: 字符串、数字、对象、数组等
                      </p>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Footer -->
              <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  @click="handleClose"
                  :disabled="isSubmitting"
                  class="btn-secondary"
                >
                  取消
                </button>
                <button
                  type="button"
                  @click="handleSubmit"
                  :disabled="isSubmitting || !isFormValid"
                  class="btn-primary"
                >
                  <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isSubmitting ? '提交中...' : '提交 MetaApp' }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>

  <!-- Success Modal -->
  <SuccessModal v-model="showSuccessModal" :txid="successTxid" />
</template>

<style lang="scss" scoped>
.form-item {
  @apply flex flex-col gap-2;
}

.form-label {
  @apply block text-sm font-semibold text-gray-700;
}

.form-input {
  @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all;

  &::placeholder {
    @apply text-gray-400;
  }
}

select.form-input {
  @apply cursor-pointer;
}

.btn-primary {
  @apply inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none;
}

.btn-secondary {
  @apply px-6 py-2.5 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
