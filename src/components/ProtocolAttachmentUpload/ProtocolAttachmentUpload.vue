<template>
  <div class="protocol-attachment-upload">
    <!-- 模式切换 -->
    <div class="mode-toggle">
      <button
        type="button"
        :class="{ active: inputMode === 'file' }"
        @click="inputMode = 'file'"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        上传文件
      </button>
      <button
        type="button"
        :class="{ active: inputMode === 'txid' }"
        @click="inputMode = 'txid'"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M11 4H4C3.45 4 3 4.45 3 5V19C3 19.55 3.45 20 4 20H18C18.55 20 19 19.55 19 19V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        手动输入TXID
      </button>
    </div>

    <!-- 上传区域 -->
    <div
      v-if="inputMode === 'file'"
      class="upload-area"
      :class="{ 'drag-over': isDragOver }"
      @click="triggerFileInput"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="upload-content">
        <div class="upload-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="upload-text">
          <h4>点击选择文件或拖拽文件到此处</h4>
          <p class="file-types">支持任意类型文件</p>
          <p class="file-limit">单个文件大小限制: 1MB</p>
          <p class="upload-note">文件将在提交协议时上传到链上</p>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        multiple
        :accept="acceptedTypes"
        @change="handleFileSelect"
        style="display: none;"
      />
    </div>

    <!-- TXID输入区域 -->
    <div v-if="inputMode === 'txid'" class="txid-input-area">
      <div class="txid-input-wrapper">
        <div class="prefix-selector">
          <select v-model="selectedPrefix">
            <option value="metafile://">metafile://</option>
            <option value="metacode://">metacode://</option>
          </select>
        </div>
        <input
          v-model="txidInput"
          type="text"
          class="txid-input"
          placeholder="请输入txid（如：9efda111d8...）"
          @keyup.enter="addTxidItem"
        />
        <button type="button" class="add-txid-btn" @click="addTxidItem">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          添加
        </button>
      </div>
      <p class="txid-hint">输入完整的txid，系统将自动生成格式如：metafile://9efda111d8...i0</p>
    </div>

    <!-- 已选择附件列表 -->
    <div class="selected-files" v-if="selectedItems.length > 0">
      <div class="files-header">
        <h5 class="files-title">已选择的协议附件</h5>
        <span class="files-count">{{ selectedItems.length }} 个附件</span>
      </div>

      <div class="files-grid">
        <div
          v-for="(item, index) in selectedItems"
          :key="index"
          class="file-card"
        >
          <!-- TXID类型附件 -->
          <template v-if="item.type === 'txid'">
            <div class="file-preview">
              <div class="file-icon txid-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="file-info">
              <div class="file-name" :title="item.fullPath">{{ item.fullPath }}</div>
              <div class="file-meta">
                <span class="file-type">TXID引用</span>
              </div>
            </div>
          </template>

          <!-- 文件类型附件 -->
          <template v-else>
            <div class="file-preview">
              <!-- 图片预览 -->
              <div v-if="isImageFile(item.fileType) && item.preview" class="image-preview">
                <img :src="item.preview" :alt="item.name" />
              </div>

              <!-- 视频预览 -->
              <div v-else-if="isVideoFile(item.fileType) && item.preview" class="video-preview">
                <img :src="item.preview" :alt="item.name" />
                <div class="video-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>

              <!-- PDF文件图标 -->
              <div v-else-if="isPdfFile(item.fileType)" class="file-icon pdf-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <!-- 办公文档图标 -->
              <div v-else-if="isOfficeFile(item.fileType)" class="file-icon office-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <!-- 压缩包图标 -->
              <div v-else-if="isZipFile(item.fileType)" class="file-icon zip-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M21 16V8C21 6.9 20.1 6 19 6H5C3.9 6 3 6.9 3 8V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 10H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <!-- 文本文件图标 -->
              <div v-else-if="isTextFile(item.fileType)" class="file-icon text-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <!-- 音频文件图标 -->
              <div v-else-if="isAudioFile(item.fileType)" class="file-icon audio-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18V5L21 3V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6 15C7.66 15 9 13.66 9 12C9 10.34 7.66 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M18 15C19.66 15 21 13.66 21 12C21 10.34 19.66 9 18 9C16.34 9 15 10.34 15 12C15 13.66 16.34 15 18 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <!-- 默认文件图标 -->
              <div v-else class="file-icon default-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="file-info">
              <div class="file-name" :title="item.name">{{ item.name }}</div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(item.size) }}</span>
                <span class="file-type">{{ getFileTypeLabel(item.fileType) }}</span>
              </div>
            </div>
          </template>

          <button
            type="button"
            class="remove-btn"
            @click="removeItem(index)"
            title="移除附件"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="file-actions">
        <button type="button" class="clear-all-btn" @click="clearAllItems" v-if="selectedItems.length > 0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6M19 6V20C19 20.55 18.55 21 18 21H6C5.45 21 5 20.55 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          清空所有附件
        </button>
        <button type="button" class="add-more-btn" @click="inputMode === 'file' ? triggerFileInput() : null">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          添加更多附件
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileToAttachmentItem, IsEncrypt } from '@/lib/file'
import { useCreateProtocols } from '@/hooks/use-create-protocols'
import { useToast } from '@/components/Toast/useToast'
import { TxComposer } from 'meta-contract'

// 定义接口
interface SelectedFileItem {
  type: 'file'
  file: File
  name: string
  size: number
  fileType: string
  preview?: string
}

interface SelectedTxidItem {
  type: 'txid'
  prefix: string
  txid: string
  fullPath: string
}

type SelectedItem = SelectedFileItem | SelectedTxidItem

// Props
interface Props {
  maxFiles?: number
  acceptedTypes?: string
}

const props = withDefaults(defineProps<Props>(), {
  maxFiles: 10,
  acceptedTypes: '*' // 支持任意类型文件
})

// Emits
const emit = defineEmits<{
  'items-selected': [items: SelectedItem[]]
  'items-removed': [items: SelectedItem[]]
}>()

// 响应式数据
const selectedItems = ref<SelectedItem[]>([])
const selectedFiles = ref<SelectedFileItem[]>([]) // 保留用于向后兼容
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement>()
const inputMode = ref<'file' | 'txid'>('file')
const selectedPrefix = ref<string>('metafile://')
const txidInput = ref<string>('')

// 使用hooks
const { createFile } = useCreateProtocols()
const { showToast } = useToast()

// 文件大小限制 (1MB)
const MAX_FILE_SIZE =1 * 1024 * 1024

// 验证文件
const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return `文件 "${file.name}" 超过5MB大小限制`
  }
  return null
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 判断文件类型
const isImageFile = (type: string): boolean => {
  return type.startsWith('image/')
}

const isVideoFile = (type: string): boolean => {
  return type.startsWith('video/')
}

const isPdfFile = (type: string): boolean => {
  return type === 'application/pdf'
}

const isZipFile = (type: string): boolean => {
  return type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar') || type.includes('gz')
}

const isOfficeFile = (type: string): boolean => {
  return type.includes('word') || type.includes('excel') || type.includes('powerpoint') || 
         type.includes('officedocument') || type.includes('msword') || type.includes('ms-excel') ||
         type.includes('ms-powerpoint') || type.includes('openxmlformats')
}

const isTextFile = (type: string): boolean => {
  return type.startsWith('text/') || type.includes('plain')
}

const isAudioFile = (type: string): boolean => {
  return type.startsWith('audio/')
}

// 获取文件类型标签
const getFileTypeLabel = (type: string): string => {
  if (isImageFile(type)) return '图片'
  if (isVideoFile(type)) return '视频'
  if (isPdfFile(type)) return 'PDF'
  if (isOfficeFile(type)) return '办公文档'
  if (isZipFile(type)) return '压缩包'
  if (isTextFile(type)) return '文本'
  if (isAudioFile(type)) return '音频'
  return '文件'
}

// 生成文件预览
const generateFilePreview = async (file: File): Promise<string | null> => {
  try {
    if (isImageFile(file.type)) {
      // 图片文件：生成base64预览
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(file)
      })
    } else if (isVideoFile(file.type)) {
      // 视频文件：生成第一帧预览
      return new Promise((resolve) => {
        const video = document.createElement('video')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          video.currentTime = 1 // 跳转到第1秒
        }
        
        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const dataURL = canvas.toDataURL('image/jpeg', 0.8)
            resolve(dataURL)
          } else {
            resolve(null)
          }
        }
        
        video.onerror = () => resolve(null)
        video.src = URL.createObjectURL(file)
        video.load()
      })
    }
    
    // 其他文件类型不生成预览
    return null
  } catch (error) {
    console.error('生成文件预览失败:', error)
    return null
  }
}

// 添加TXID项
const addTxidItem = () => {
  const txid = txidInput.value.trim()
  if (!txid) {
    showToast('请输入txid', 'warning')
    return
  }

  // 检查是否超过最大数量
  if (selectedItems.value.length >= props.maxFiles) {
    showToast(`最多只能添加 ${props.maxFiles} 个附件`, 'warning')
    return
  }

  // 构建完整路径: prefix + txid，如果txid不以i0结尾，则添加i0
  let fullPath: string
  if (txid.endsWith('i0')) {
    fullPath = `${selectedPrefix.value}${txid}`
  } else {
    fullPath = `${selectedPrefix.value}${txid}i0`
  }

  // 检查是否已存在相同的txid
  const exists = selectedItems.value.some(
    item => item.type === 'txid' && item.fullPath === fullPath
  )

  if (exists) {
    showToast('该TXID已存在', 'warning')
    return
  }

  // 创建txid项
  const txidItem: SelectedTxidItem = {
    type: 'txid',
    prefix: selectedPrefix.value,
    txid,
    fullPath
  }

  selectedItems.value.push(txidItem)
  emit('items-selected', [txidItem])

  // 清空输入
  txidInput.value = ''

  showToast('已添加TXID引用', 'success')
}

// 上传文件到链上（供外部调用）
const uploadFilesToChain = async (_options?:CreatePinOptions={}): Promise<string[]> => {
  const txids: string[] = []

  for (const item of selectedItems.value) {
    if (item.type === 'txid') {
      // TXID类型：直接使用txid，不需要上传
      txids.push(item.fullPath)
    } else {
      // 文件类型：需要上传到链上
      try {
        // 1. 将文件转换为AttachmentItem
        const attachmentItem = await FileToAttachmentItem(item.file, IsEncrypt.No)

        // 2. 构建metaidData
        const metaidData = {
          path: '/file',
          body: attachmentItem.data,
          contentType: `${attachmentItem.fileType};binary`,
          encoding: 'binary' as const,
          version: '1.0.0',
          operation: 'create' as const
        }

        // 3. 构建options
        const options = {
          attachments: [attachmentItem],
          mime: attachmentItem.fileType,
          chain: 'mvc' as const,
          network: 'mainnet' as const,
          ..._options
        }

        // 4. 调用createFile方法上传到链上
        const result = await createFile(metaidData, options)

        const txid = result?.txid || result?.txids?.[0]
        if (!txid) {
          throw new Error('上传失败：未获取到交易ID')
        }

        txids.push(`metafile://${txid}i0`)
      } catch (error) {
        console.error(`文件 "${item.name}" 上传失败:`, error)
        throw new Error(`文件 "${item.name}" 上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  return txids
}

// 处理文件选择
const processFiles = async (files: FileList) => {
  const newItems: SelectedFileItem[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    // 验证文件
    const error = validateFile(file)
    if (error) {
      showToast(error, 'warning')
      continue
    }

    // 检查是否超过最大附件数量
    if (selectedItems.value.length + newItems.length >= props.maxFiles) {
      showToast(`最多只能添加 ${props.maxFiles} 个附件`, 'warning')
      break
    }

    // 创建文件项
    const fileItem: SelectedFileItem = {
      type: 'file',
      file,
      name: file.name,
      size: file.size,
      fileType: file.type
    }

    // 生成预览
    const preview = await generateFilePreview(file)
    if (preview) {
      fileItem.preview = preview
    }

    newItems.push(fileItem)
  }

  // 添加到已选附件列表
  selectedItems.value.push(...newItems)
  selectedFiles.value.push(...newItems) // 保持向后兼容

  // 触发事件
  emit('items-selected', newItems)

  if (newItems.length > 0) {
    showToast(`已选择 ${newItems.length} 个文件`, 'success')
  }
}

// 触发文件输入
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    processFiles(target.files)
    // 清空input值，允许重复选择相同文件
    target.value = ''
  }
}

// 拖拽处理
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (event.dataTransfer?.files) {
    processFiles(event.dataTransfer.files)
  }
}

// 移除附件
const removeItem = (index: number) => {
  const removedItem = selectedItems.value[index]
  selectedItems.value.splice(index, 1)

  // 同步更新 selectedFiles（向后兼容）
  if (removedItem.type === 'file') {
    const fileIndex = selectedFiles.value.findIndex(f => f.file === removedItem.file)
    if (fileIndex !== -1) {
      selectedFiles.value.splice(fileIndex, 1)
    }
  }

  emit('items-removed', [removedItem])

  const itemName = removedItem.type === 'txid' ? removedItem.fullPath : removedItem.name
  showToast(`已移除附件 "${itemName}"`, 'info')
}

// 清空所有附件
const clearAllItems = () => {
  const removedItems = [...selectedItems.value]
  selectedItems.value = []
  selectedFiles.value = []
  emit('items-removed', removedItems)
  showToast('已清空所有附件', 'info')
}

// 保留旧方法名以向后兼容
const clearAllFiles = clearAllItems

// 获取选中的文件列表（仅返回文件类型）
const getSelectedFiles = () => {
  return selectedItems.value
    .filter((item): item is SelectedFileItem => item.type === 'file')
    .map(item => item.file)
}

// 暴露方法给父组件
defineExpose({
  uploadFilesToChain,
  getSelectedFiles,
  clearFiles: clearAllFiles,
  clearAllItems,
  selectedFiles: computed(() => selectedFiles.value),
  selectedItems: computed(() => selectedItems.value)
})
</script>

<style lang="scss" scoped>
.protocol-attachment-upload {
  // 模式切换按钮
  .mode-toggle {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    padding: 4px;
    background: #f3f4f6;
    border-radius: 8px;

    button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      background: transparent;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        color: #374151;
        background: rgba(255, 255, 255, 0.6);
      }

      &.active {
        color: #3b82f6;
        background: #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      svg {
        flex-shrink: 0;
      }
    }
  }

  // TXID输入区域
  .txid-input-area {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 24px;
    background: #f9fafb;

    .txid-input-wrapper {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;

      .prefix-selector {
        select {
          height: 42px;
          padding: 0 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          color: #374151;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            border-color: #3b82f6;
          }

          &:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        }
      }

      .txid-input {
        flex: 1;
        height: 42px;
        padding: 0 16px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        color: #374151;
        background: #ffffff;
        transition: all 0.2s ease;

        &::placeholder {
          color: #9ca3af;
        }

        &:hover {
          border-color: #3b82f6;
        }

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }

      .add-txid-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 42px;
        padding: 0 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #ffffff;
        background: #3b82f6;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }

    .txid-hint {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
      text-align: center;
    }
  }

  .upload-area {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #f9fafb;
    
    &:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }
    
    &.drag-over {
      border-color: #3b82f6;
      background: #eff6ff;
      transform: scale(1.02);
    }
    
  }
  
  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  
  .upload-icon {
    color: #6b7280;
    transition: color 0.3s ease;
  }
  
  .upload-area:hover .upload-icon {
    color: #3b82f6;
  }
  
  
  .upload-text {
    h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
    
    p {
      margin: 4px 0;
      font-size: 14px;
      color: #6b7280;
    }
  }
  
  .selected-files {
    margin-top: 24px;
    
    .files-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      
      .files-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #374151;
      }
      
      .files-count {
        font-size: 14px;
        color: #6b7280;
        background: #f3f4f6;
        padding: 4px 8px;
        border-radius: 12px;
      }
    }
    
    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
      
      @media (max-width: 640px) {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;
      }
    }
    
    .file-card {
      position: relative;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      transition: all 0.2s ease;
      overflow: hidden;
      
      &:hover {
        border-color: #3b82f6;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        transform: translateY(-2px);
      }
      
      .file-preview {
        display: flex;
        justify-content: center;
        margin-bottom: 12px;
        height: 80px;
        overflow: hidden;
        border-radius: 8px;
        background: #f8f9fa;
        
        .image-preview {
          width: 100%;
          height: 100%;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
          }
        }
        
        .video-preview {
          position: relative;
          width: 100%;
          height: 100%;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
          }
          
          .video-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
        }
        
        .file-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: #6b7280;
          transition: color 0.2s ease;

          &.txid-icon {
            color: #f59e0b;
          }

          &.pdf-icon {
            color: #dc2626;
          }

          &.office-icon {
            color: #2563eb;
          }

          &.zip-icon {
            color: #059669;
          }

          &.text-icon {
            color: #7c3aed;
          }

          &.audio-icon {
            color: #ea580c;
          }

          &.default-icon {
            color: #6b7280;
          }
        }
      }

      &:hover .file-preview .file-icon {
        color: #3b82f6;
      }

      &:hover .file-preview .file-icon.txid-icon {
        color: #f59e0b;
      }
      
      .file-info {
        text-align: center;
        
        .file-name {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
          word-break: break-all;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .file-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          
          .file-size {
            color: #6b7280;
            font-weight: 500;
          }
          
          .file-type {
            color: #3b82f6;
            background: #eff6ff;
            padding: 2px 6px;
            border-radius: 8px;
            font-weight: 500;
            display: inline-block;
          }
        }
      }
      
      .remove-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        background: rgba(255, 255, 255, 0.9);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        opacity: 0;
        
        &:hover {
          color: #dc2626;
          background: #fef2f2;
          transform: scale(1.1);
        }
      }
      
      &:hover .remove-btn {
        opacity: 1;
      }
    }
    
    .file-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      
      button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        
        &.clear-all-btn {
          color: #dc2626;
          background: #fef2f2;
          
          &:hover {
            background: #fee2e2;
            transform: translateY(-1px);
          }
        }
        
        &.add-more-btn {
          color: #3b82f6;
          background: #eff6ff;
          
          &:hover {
            background: #dbeafe;
            transform: translateY(-1px);
          }
        }
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
