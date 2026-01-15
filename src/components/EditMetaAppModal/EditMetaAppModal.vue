<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useCreateProtocols } from '@/hooks/use-create-protocols'
import { useToast } from '@/components/Toast/useToast'
import SuccessModal from '@/components/SuccessModal/SuccessModal.vue'
import ProtocolAttachmentUpload from '@/components/ProtocolAttachmentUpload/ProtocolAttachmentUpload.vue'
import type { PinInfo } from '@/api/ManV2'

interface Props {
  modelValue: boolean
  metaApp: PinInfo | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const { uploadApp } = useCreateProtocols()
const { showToast } = useToast()

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

// MIME type options
const contentTypeOptions = [
  { value: 'application/zip', label: 'ZIP压缩包' },
  { value: 'application/x-tar', label: 'TAR压缩包' },
  { value: 'application/x-7z-compressed', label: '7Z压缩包' },
  { value: 'application/x-rar-compressed', label: 'RAR压缩包' },
  { value: 'application/gzip', label: 'GZIP压缩包' },
  { value: 'application/json', label: 'JSON数据' },
  { value: 'application/xml', label: 'XML文档' },
  { value: 'text/plain', label: '纯文本' },
  { value: 'text/html', label: 'HTML网页' },
  { value: 'text/css', label: 'CSS样式表' },
  { value: 'application/javascript', label: 'JavaScript文件' },
  { value: 'application/pdf', label: 'PDF文档' },
  { value: 'image/jpeg', label: 'JPEG图片' },
  { value: 'image/png', label: 'PNG图片' },
  { value: 'image/gif', label: 'GIF图片' },
  { value: 'image/svg+xml', label: 'SVG矢量图' },
  { value: 'image/webp', label: 'WebP图片' },
  { value: 'video/mp4', label: 'MP4视频' },
  { value: 'video/webm', label: 'WebM视频' },
  { value: 'audio/mpeg', label: 'MP3音频' },
  { value: 'audio/wav', label: 'WAV音频' },
  { value: 'application/octet-stream', label: '二进制流' }
]

// MIME type options
const codeTypeOptions = [
  { value: 'application/zip', label: 'ZIP压缩包' },
  { value: 'application/x-tar', label: 'TAR压缩包' },
  { value: 'application/x-7z-compressed', label: '7Z压缩包' },
  { value: 'application/x-rar-compressed', label: 'RAR压缩包' },
  { value: 'application/gzip', label: 'GZIP压缩包' },
  { value: 'application/json', label: 'JSON数据' },
  { value: 'application/xml', label: 'XML文档' },
  { value: 'text/html', label: 'HTML网页' },
  { value: 'text/css', label: 'CSS样式表' },
  { value: 'application/javascript', label: 'JavaScript文件' },
]

// Custom tag input
const customTagInput = ref('')

// Add custom tag
const addCustomTag = () => {
  const tag = customTagInput.value.trim()
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
    customTagInput.value = ''
  }
}

// Remove tag
const removeTag = (index: number) => {
  formData.value.tags.splice(index, 1)
}

// Form data
const formData = ref({
  title: '',
  appName: '',
  prompt: '',
  icon: '',
  coverImg: '',
  introImgs: [] as string[],
  intro: '',
  disabled: false,
  runtime: [] as string[],
  indexFile: '',
  version: 'v1.0.0',
  contentType: 'application/zip',
  codeType:'application/zip',
  content: '',
  code: '',
  contentHash: '',
  metadata: '',
  tags: []
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
const isFormValid = computed(() => {
  return !!(
    formData.value.title.trim() &&
    formData.value.appName.trim() &&
    formData.value.runtime.length > 0 &&
    formData.value.icon &&
    formData.value.coverImg
  )
})

// Auto-increment version
const incrementVersion = (version: string): string => {
  // Parse version like v1.0.0 to v1.0.1, max v1.0.99 then v1.1.0
  const match = version.match(/^v(\d+)\.(\d+)\.(\d+)$/)
  if (!match) return 'v1.0.1'

  let [, major, minor, patch] = match.map(Number)

  patch++
  if (patch > 99) {
    patch = 0
    minor++
  }

  return `v${major}.${minor}.${patch}`
}

// Helper function to convert protocol path to SelectedTxidItem
const createTxidItem = (path: string): any => {
  if (!path) return null

  // Parse metafile://txidi0 or metacode://txidi0 format
  const match = path.match(/^(metafile:\/\/|metacode:\/\/)(.+)$/i)
  if (!match) return null

  const prefix = match[1]
  const txidWithSuffix = match[2]

  // Remove i0 suffix if present
  const txid = txidWithSuffix.replace(/i0$/, '')

  return {
    type: 'txid',
    prefix,
    txid,
    fullPath: path
  }
}

// Watch for metaApp changes and pre-fill form
watch(() => props.metaApp, (metaApp) => {
  if (metaApp && metaApp.contentSummary) {
    const summary = metaApp.contentSummary

    // Parse contentSummary if it's a string
    const parsedSummary = typeof summary === 'string' ? JSON.parse(summary) : summary

    // Pre-fill form data
    formData.value = {
      title: parsedSummary.title || '',
      appName: parsedSummary.appName || '',
      prompt: parsedSummary.prompt || '',
      icon: parsedSummary.icon || '',
      coverImg: parsedSummary.coverImg || '',
      introImgs: parsedSummary.introImgs || [],
      intro: parsedSummary.intro || '',
      disabled: parsedSummary.disabled || false,
      runtime: parsedSummary.runtime ? parsedSummary.runtime.split('/') : [],
      indexFile: parsedSummary.indexFile || '',
      version: incrementVersion(parsedSummary.version || 'v1.0.0'),
      contentType: parsedSummary.contentType || 'application/zip',
      codeType:parsedSummary.codeType || 'application/zip',
      content: parsedSummary.content || '',
      code: parsedSummary.code || '',
      contentHash: parsedSummary.contentHash || '',
      metadata: parsedSummary.metadata ? (typeof parsedSummary.metadata === 'string' ? parsedSummary.metadata : JSON.stringify(parsedSummary.metadata, null, 2)) : '',
      tags: parsedSummary.tags || []
    }

    // Pre-fill file upload components for icon
    if (parsedSummary.icon) {
      setTimeout(() => {
        const item = createTxidItem(parsedSummary.icon)
        if (item) {
          iconUploadRef.value?.addExistingAttachments([item])
        }
      }, 100)
    }

    // Pre-fill file upload components for coverImg
    if (parsedSummary.coverImg) {
      setTimeout(() => {
        const item = createTxidItem(parsedSummary.coverImg)
        if (item) {
          coverUploadRef.value?.addExistingAttachments([item])
        }
      }, 100)
    }

    // Pre-fill file upload components for introImgs
    if (parsedSummary.introImgs && parsedSummary.introImgs.length > 0) {
      setTimeout(() => {
        const items = parsedSummary.introImgs
          .map((img: string) => createTxidItem(img))
          .filter((item: any) => item !== null)
        if (items.length > 0) {
          introImgsUploadRef.value?.addExistingAttachments(items)
        }
      }, 100)
    }

    // Pre-fill file upload components for content
    if (parsedSummary.content) {
      setTimeout(() => {
        const item = createTxidItem(parsedSummary.content)
        if (item) {
          contentUploadRef.value?.addExistingAttachments([item])
        }
      }, 100)
    }

    // Pre-fill file upload components for code (metacode format)
    if (parsedSummary.code) {
      setTimeout(() => {
        const item = createTxidItem(parsedSummary.code)
        if (item) {
          codeUploadRef.value?.addExistingAttachments([item])
        }
      }, 100)
    }
  }
}, { immediate: true })

// Upload single file and get metafile link
const uploadSingleFile = async (uploadRef: any, fieldName: string): Promise<string> => {
  if (!uploadRef?.value || uploadRef.value.selectedItems.length === 0) {
    return ''
  }

  try {
    showToast(`正在上传${fieldName}到链上...`, 'info')
    const paths = await uploadRef.value.uploadFilesToChain()
    if (paths.length > 0) {
      return paths[0]
    }

    throw new Error('上传失败：未获取到路径')
  } catch (error) {
    throw new Error(`${fieldName}上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// Upload multiple files and get metafile links array
const uploadMultipleFiles = async (uploadRef: any, fieldName: string): Promise<string[]> => {
  if (!uploadRef?.value || uploadRef.value.selectedItems.length === 0) {
    return []
  }

  try {
    showToast(`正在上传${fieldName}到链上...`, 'info')
    const paths = await uploadRef.value.uploadFilesToChain()

    return paths
  } catch (error) {
    throw new Error(`${fieldName}上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// Submit form
const handleSubmit = async () => {
  if (!props.metaApp) {
    showToast('未找到要编辑的MetaApp', 'error')
    return
  }

  // Validate all required fields
  const requiredFields = [
    { name: '标题', value: formData.value.title.trim() },
    { name: '应用名称', value: formData.value.appName.trim() }
  ]

  for (const { name, value } of requiredFields) {
    if (!value) {
      showToast(`请填写${name}`, 'warning')
      return
    }
  }

  // Validate runtime separately (array check)
  if (formData.value.runtime.length === 0) {
    showToast('请选择至少一个运行时环境', 'warning')
    return
  }

  // Validate required fields: icon, coverImg
  if (!formData.value.icon) {
    showToast('请上传应用图标', 'warning')
    return
  }

  if (!formData.value.coverImg) {
    showToast('请上传封面图', 'warning')
    return
  }

  try {
    isSubmitting.value = true

    // Upload files if they were changed (check if they are File objects)
    let icon = formData.value.icon
    let coverImg = formData.value.coverImg

    // Only upload if user selected new files
    if (iconUploadRef.value && iconUploadRef.value.selectedItems.length > 0 && iconUploadRef.value.selectedItems.some((item: any) => item.type === 'file')) {
      icon = await uploadSingleFile(iconUploadRef, '应用图标')
    }

    if (coverUploadRef.value && coverUploadRef.value.selectedItems.length > 0 && coverUploadRef.value.selectedItems.some((item: any) => item.type === 'file')) {
      coverImg = await uploadSingleFile(coverUploadRef, '封面图')
    }

    // Upload optional files
    let introImgs = formData.value.introImgs
    if (introImgsUploadRef.value && introImgsUploadRef.value.selectedItems.length > 0 && introImgsUploadRef.value.selectedItems.some((item: any) => item.type === 'file')) {
      introImgs = await uploadMultipleFiles(introImgsUploadRef, '简介图')
    }

    let content = formData.value.content
    
    if (contentUploadRef.value && contentUploadRef.value.selectedItems.length > 0 && contentUploadRef.value.selectedItems.some((item: any) => item.type === 'file')) {
      
      content = await uploadSingleFile(contentUploadRef, '应用内容包')
    }

    

    let code = formData.value.code
    if (codeUploadRef.value && codeUploadRef.value.selectedItems.length > 0 && codeUploadRef.value.selectedItems.some((item: any) => item.type === 'file')) {
      
      code = await uploadSingleFile(codeUploadRef, '源码包')
    }
    
    showToast('正在提交编辑...', 'success')

    // Parse metadata (optional)
    let parsedMetadata: any = ''
    if (formData.value.metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(formData.value.metadata)
      } catch (error) {
        parsedMetadata = formData.value.metadata
      }
    }

    // Build MetaApp protocol data
    const metaAppData: any = {
      title: formData.value.title,
      appName: formData.value.appName,
      runtime: formData.value.runtime.join('/'),
      icon: icon,
      prompt: formData.value.prompt,
      coverImg: coverImg,
      introImgs: introImgs,
      intro: formData.value.intro,
      disabled: formData.value.disabled,
      indexFile: formData.value.indexFile,
      code: code,
      contentHash: formData.value.contentHash,
      metadata: parsedMetadata,
      tags: formData.value.tags,
      version: formData.value.version,
      contentType: formData.value.contentType,
      codeType:formData.value.contentType || 'application/zip',
      content: content
    }

    

    const metaidData = {
      path: `@${props.metaApp.id}`,
      body: metaAppData,
      contentType: 'application/json',
      encoding: 'utf-8' as const,
      version: '1.0.0',
      operation: 'modify' as const
    }

    console.log('提交编辑MetaApp数据:', metaidData)

    const options = {
      serialAction: 'finish' as const,
    }

    // Call uploadApp method
    const result = await uploadApp(metaidData, options)

    console.log('MetaApp编辑上链结果:', result)

    // Extract txid
    const txid = result?.txid || result?.txids?.[0]

    // Reset form and close modal
    resetForm()
    isOpen.value = false

    showToast('MetaApp编辑成功！', 'success')

    // Emit success event to refresh parent list
    emit('success')

    // Show success modal if txid exists
    if (txid) {
      successTxid.value = txid
      showSuccessModal.value = true

      console.log('✅ MetaApp编辑已成功提交到链上')
      console.log('🔗 TxID:', txid)
    }
  } catch (error) {
    console.error('提交编辑失败:', error)
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
    disabled: false,
    runtime: [],
    indexFile: '',
    version: 'v1.0.0',
    contentType: 'application/zip',
    codeType:'application/zip',
    content: '',
    code: '',
    contentHash: '',
    metadata: '',
    tags: []
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

// Handle icon attachment changes
const handleIconChange = (items: any[]) => {
  if (items.length > 0) {
    const item = items[0]
    formData.value.icon = item.type === 'txid' ? item.fullPath : ''
  }
}

const handleIconRemove = () => {
  if (iconUploadRef.value?.selectedItems.length === 0) {
    formData.value.icon = ''
  }
}

// Handle cover image attachment changes
const handleCoverChange = (items: any[]) => {
  if (items.length > 0) {
    const item = items[0]
    formData.value.coverImg = item.type === 'txid' ? item.fullPath : ''
  }
}

const handleCoverRemove = () => {
  if (coverUploadRef.value?.selectedItems.length === 0) {
    formData.value.coverImg = ''
  }
}

// Handle intro images attachment changes
const handleIntroImgsChange = () => {
  if (introImgsUploadRef.value) {
    const txidItems = introImgsUploadRef.value.selectedItems.filter((item: any) => item.type === 'txid')
    formData.value.introImgs = txidItems.map((item: any) => item.fullPath)
  }
}

const handleIntroImgsRemove = () => {
  if (introImgsUploadRef.value) {
    const txidItems = introImgsUploadRef.value.selectedItems.filter((item: any) => item.type === 'txid')
    formData.value.introImgs = txidItems.map((item: any) => item.fullPath)
  }
}

// Handle content attachment changes
const handleContentChange = (items: any[]) => {
  if (items.length > 0) {
    const item = items[0]
    formData.value.content = item.type === 'txid' ? item.fullPath : ''
  }
}

const handleContentRemove = () => {
  if (contentUploadRef.value?.selectedItems.length === 0) {
    formData.value.content = ''
  }
}

// Handle code attachment changes
const handleCodeChange = (items: any[]) => {
  if (items.length > 0) {
    const item = items[0]
    formData.value.code = item.type === 'txid' ? item.fullPath : ''
  }
}

const handleCodeRemove = () => {
  if (codeUploadRef.value?.selectedItems.length === 0) {
    formData.value.code = ''
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
              class="w-full max-w-[800px] h-[90vh] transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all flex flex-col"
            >
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <DialogTitle as="h3" class="text-xl font-bold text-gray-900">
                  编辑 MetaApp
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

                    <!-- Disabled -->
                    <div class="form-item">
                      <label class="form-label">
                        应用状态
                      </label>
                      <div class="flex gap-6 mt-2">
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            v-model="formData.disabled"
                            :value="false"
                            class="w-4 h-4 text-purple-600 focus:ring-purple-500"
                          />
                          <span class="text-sm text-gray-700">启用 (false)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            v-model="formData.disabled"
                            :value="true"
                            class="w-4 h-4 text-purple-600 focus:ring-purple-500"
                          />
                          <span class="text-sm text-gray-700">禁用 (true)</span>
                        </label>
                      </div>
                      <p class="text-xs text-gray-500 mt-1">
                        设置应用是否禁用，默认为启用状态
                      </p>
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
                        应用图标 <span class="text-red-500">*</span>
                      </label>
                      <ProtocolAttachmentUpload
                        ref="iconUploadRef"
                        :max-files="1"
                        accepted-types="image/*"
                        @items-selected="handleIconChange"
                        @items-removed="handleIconRemove"
                      />
                      <p class="text-xs text-gray-500 mt-1">
                        格式将自动转换为 metafile://{`{PINID}`}
                      </p>
                    </div>

                    <!-- Cover Image -->
                    <div class="form-item">
                      <label class="form-label">
                        封面图 <span class="text-red-500">*</span>
                      </label>
                      <ProtocolAttachmentUpload
                        ref="coverUploadRef"
                        :max-files="1"
                        accepted-types="image/*"
                        @items-selected="handleCoverChange"
                        @items-removed="handleCoverRemove"
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
                        @items-selected="handleIntroImgsChange"
                        @items-removed="handleIntroImgsRemove"
                      />
                      <p class="text-xs text-gray-500 mt-1">
                        可上传多张图片，格式将自动转换为 metafile://{`{PINID}`} 数组
                      </p>
                    </div>

                    <!-- Content Package -->
                    <div class="form-item">
                      <label class="form-label">
                        应用运行包 <span class="text-gray-400 text-xs">(可选)</span>
                      </label>
                      <ProtocolAttachmentUpload
                        ref="contentUploadRef"
                        :max-files="1"
                        accepted-types=".zip,.rar,.7z,.tar,.gz"
                        @items-selected="handleContentChange"
                        @items-removed="handleContentRemove"
                      />
                      <p class="text-xs text-gray-500 mt-1">
                        上传MetaApp内容，格式将自动转换为 metafile://{`{PINID}`}
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
                        @items-selected="handleCodeChange"
                        @items-removed="handleCodeRemove"
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

                    <!-- Runtime -->
                    <div class="form-item">
                      <label class="form-label">
                        运行时环境 <span class="text-red-500">*</span>
                      </label>
                      <div class="grid grid-cols-2 gap-3 mt-2">
                        <label
                          v-for="runtime in runtimeOptions"
                          :key="runtime.value"
                          class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all hover:border-purple-400 hover:bg-purple-50"
                          :class="formData.runtime.includes(runtime.value) ? 'border-purple-500 bg-purple-50' : 'border-gray-300'"
                        >
                          <input
                            type="checkbox"
                            :value="runtime.value"
                            v-model="formData.runtime"
                            class="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                          />
                          <span class="text-sm font-medium text-gray-700">{{ runtime.label }}</span>
                        </label>
                      </div>
                      <p class="text-xs text-gray-500 mt-2">
                        可多选，选中的环境将以"/"分隔（如：browser/ios）
                      </p>
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
                        placeholder="v1.0.0"
                      />
                      <p class="text-xs text-gray-500 mt-1">
                        版本号已自动递增，您也可以手动修改
                      </p>
                    </div>

                    <!-- Content Type -->
                    <div class="form-item">
                      <label class="form-label">
                        内容类型
                      </label>
                      <select v-model="formData.contentType" class="form-input">
                        <option v-for="contentType in contentTypeOptions" :key="contentType.value" :value="contentType.value">
                          {{ contentType.value }} ({{ contentType.label }})
                        </option>
                      </select>
                    </div>

                     <!-- Content Type -->
                    <div class="form-item">
                      <label class="form-label">
                        源码类型
                      </label>
                      <select v-model="formData.codeType" class="form-input">
                        <option v-for="contentType in codeTypeOptions" :key="contentType.value" :value="contentType.value">
                          {{ contentType.value }} ({{ contentType.label }})
                        </option>
                      </select>
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

                    <!-- Tags (Optional) -->
                    <div class="form-item">
                      <label class="form-label">
                        应用标签 <span class="text-gray-400 text-xs">(可选)</span>
                      </label>

                      <!-- Selected Tags Display -->
                      <div v-if="formData.tags.length > 0" class="flex flex-wrap gap-2 mb-3">
                        <span
                          v-for="(tag, index) in formData.tags"
                          :key="index"
                          class="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {{ tag }}
                          <button
                            type="button"
                            @click="removeTag(index)"
                            class="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      </div>

                      <!-- Custom Tag Input -->
                      <div class="flex gap-2">
                        <input
                          v-model="customTagInput"
                          type="text"
                          class="form-input flex-1"
                          placeholder="输入自定义标签"
                          @keyup.enter="addCustomTag"
                        />
                        <button
                          type="button"
                          @click="addCustomTag"
                          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          添加
                        </button>
                      </div>

                      <p class="text-xs text-gray-500 mt-2">
                        输入自定义标签，支持多选
                      </p>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Footer -->
              <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <!-- Validation Error Message -->
                <div v-if="!isFormValid" class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                    <div class="text-sm text-yellow-800">
                      <p class="font-semibold">请完善所有必填项目</p>
                      <ul class="mt-1 list-disc list-inside text-xs">
                        <li>标题、应用名称</li>
                        <li>应用图标、封面图</li>
                        <li>运行时环境</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end gap-3">
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
                    {{ isSubmitting ? '提交中...' : '提交编辑' }}
                  </button>
                </div>
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
