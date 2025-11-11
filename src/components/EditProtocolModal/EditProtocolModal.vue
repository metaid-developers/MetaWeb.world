<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot, Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { useCreateProtocols } from '@/hooks/use-create-protocols'
import { useToast } from '@/components/Toast/useToast'
import { useUserStore } from '@/stores/user'
import SuccessModal from '@/components/SuccessModal/SuccessModal.vue'
import ProtocolAttachmentUpload from '@/components/ProtocolAttachmentUpload/ProtocolAttachmentUpload.vue'

interface Props {
  modelValue: boolean
  protocolData: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const { uploadProtocol } = useCreateProtocols()
const { showToast } = useToast()
const userStore = useUserStore()
const route = useRoute()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 版本历史记录
const modifyHistory = computed(() => {
  return props.protocolData?.modify_history || []
})

// 是否显示版本历史面板
const hasVersionHistory = computed(() => {
  return modifyHistory.value.length > 0
})

// MIME类型选项
const mimeTypes = [
  { value: 'application/json', label: 'application/json' },
  { value: 'application/json5', label: 'application/json5' },
  { value: 'application/xml', label: 'application/xml' },
  { value: 'text/plain', label: 'text/plain' },
  { value: 'text/html', label: 'text/html' },
  { value: 'application/javascript', label: 'application/javascript' },
  { value: 'application/yaml', label: 'application/yaml' },
]

// 编码格式选项
const encodingTypes = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'utf-16', label: 'UTF-16' },
  { value: 'ascii', label: 'ASCII' },
  { value: 'base64', label: 'Base64' },
  { value: 'binary', label: 'Binary' },
]

// 数据类型选项
const dataTypes = [
  { value: 'String', label: 'String' },
  { value: 'Number', label: 'Number' },
  { value: 'Boolean', label: 'Boolean' },
  { value: 'Object', label: 'Object' },
  { value: 'Array', label: 'Array' },
]

// 表单数据
interface MetaDataItem {
  id: number
  key: string
  valueType: string
  value: string
  description: string
}

const formData = ref({
  title: '',
  protocolName: '',
  version: '1.0.0',
  intro: '',
  protocolAttachments: [] as string[],
  metadata: '',
  protocolContentType: mimeTypes[1],
  protocolEncoding: encodingTypes[0],
})

// 保存原始版本号（用于body.version）
const originalVersion = ref('1.0.0')
// 自增后的版本号（用于metaidData.version）
const incrementedVersion = ref('1.0.1')

const metaDataItems = ref<MetaDataItem[]>([])
const nextId = ref(1)
const isSubmitting = ref(false)
const isDragging = ref(false)
const showVersionHistory = ref(false)

// 附件上传组件引用
const attachmentUploadRef = ref<InstanceType<typeof ProtocolAttachmentUpload>>()

// 成功弹窗状态
const showSuccessModal = ref(false)
const successTxid = ref('')

// 处理文件选择成功
const handleFilesSelected = (files: any[]) => {
  console.log('文件选择成功:', files)
}

// 处理文件移除
const handleFilesRemoved = (files: any[]) => {
  console.log('文件已移除:', files)
}

// 版本号自增逻辑
const incrementVersion = (currentVersion: string): string => {
  const parts = currentVersion.split('.')
  if (parts.length !== 3) return '1.0.1'

  let [major, minor, patch] = parts.map(Number)

  // 增加 patch 版本号
  patch++

  // 如果 patch 达到 10，重置为 0 并增加 minor
  if (patch >= 10) {
    patch = 0
    minor++
  }

  // 如果 minor 达到 10，重置为 0 并增加 major
  if (minor >= 10) {
    minor = 0
    major++
  }

  return `${major}.${minor}.${patch}`
}

// 解析协议内容并填充表单
const parseProtocolContent = (content: string) => {
  if (!content) return

  try {
    // 解析注释和JSON内容
    const lines = content.split('\n')
    const jsonLines: string[] = []
    const commentMap = new Map<string, string>() // key -> comment
    let currentComment = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // 检查是否是块注释 /** comment */
      if (trimmed.startsWith('/**') && trimmed.endsWith('*/')) {
        currentComment = trimmed.slice(3, -2).trim()
        continue // 不加入jsonLines
      }

      // 检查是否是单行注释 // comment
      if (trimmed.startsWith('//')) {
        currentComment = trimmed.slice(2).trim()
        continue // 不加入jsonLines
      }

      // 如果这一行包含key，保存之前的注释
      if (trimmed.includes(':') && !trimmed.startsWith('*')) {
        const keyMatch = trimmed.match(/["']?(\w+)["']?\s*:/)
        if (keyMatch) {
          const key = keyMatch[1]
          if (currentComment) {
            commentMap.set(key, currentComment)
            currentComment = '' // 清空已使用的注释
          }
        }
      }

      // 跳过多行注释中间的行 (以 * 开头但不是 /** 或 */)
      if (trimmed.startsWith('*') && !trimmed.startsWith('/**')) {
        continue
      }

      jsonLines.push(line)
    }

    const jsonStr = jsonLines.join('\n')
    const parsed = JSON.parse(jsonStr)

    // 清空现有items
    metaDataItems.value = []
    nextId.value = 1

    // 解析并填充
    Object.entries(parsed).forEach(([key, value]: [string, any]) => {
      let valueType = 'String'
      let valueStr = ''
      let description = commentMap.get(key) || '' // 从commentMap获取注释

      if (typeof value === 'boolean') {
        valueType = 'Boolean'
        valueStr = value.toString()
      } else if (typeof value === 'number') {
        valueType = 'Number'
        valueStr = value.toString()
      } else if (Array.isArray(value)) {
        valueType = 'Array'
        valueStr = JSON.stringify(value, null, 2)
      } else if (typeof value === 'object' && value !== null) {
        valueType = 'Object'
        valueStr = JSON.stringify(value, null, 2)
      } else {
        valueType = 'String'
        valueStr = String(value)
      }

      metaDataItems.value.push({
        id: nextId.value++,
        key,
        valueType,
        value: valueStr,
        description
      })
    })
  } catch (error) {
    console.error('解析协议内容失败:', error)
  }
}

// 监听协议数据变化，自动填充表单
watch(() => props.modelValue, (data) => {
  if (!data) return

  try {
    let contentSummary: any = {}

    if (props.protocolData.contentSummary) {
      if (typeof props.protocolData.contentSummary === 'object') {
        contentSummary = props.protocolData.contentSummary
      } else if (typeof props.protocolData.contentSummary === 'string') {
        contentSummary = JSON.parse(props.protocolData.contentSummary)
      }
    }

    // 填充基本信息
    formData.value.title = contentSummary.title || ''
    formData.value.protocolName = contentSummary.protocolName || ''
    formData.value.intro = contentSummary.intro || ''

    // 保存原始版本号（用于body）
    originalVersion.value = contentSummary.version || '1.0.0'
    // 计算自增后的版本号（用于metaidData外层）
    incrementedVersion.value = incrementVersion(contentSummary.version || '1.0.0')
    // formData中显示自增后的版本号
    formData.value.version = incrementedVersion.value

    // 设置内容类型
    const contentType = mimeTypes.find(t => t.value === contentSummary.protocolContentType)
    if (contentType) {
      formData.value.protocolContentType = contentType
    }

    // 解析协议内容
    if (contentSummary.protocolContent) {
      parseProtocolContent(contentSummary.protocolContent)
    }

    // 填充 metadata
    if (contentSummary.metadata) {
      formData.value.metadata = typeof contentSummary.metadata === 'string'
        ? contentSummary.metadata
        : JSON.stringify(contentSummary.metadata, null, 2)
    }

    // 保存 protocolAttachments 到 formData 并回填到UI
    if (contentSummary.protocolAttachments && Array.isArray(contentSummary.protocolAttachments)) {
      formData.value.protocolAttachments = contentSummary.protocolAttachments

      // 延迟处理，等待组件挂载
      nextTick(() => {
        if (attachmentUploadRef.value && contentSummary.protocolAttachments.length > 0) {
          // 将 metafile://PINID 或 metacode://PINID 格式转换为组件可识别的 SelectedTxidItem
          const attachmentItems = contentSummary.protocolAttachments
            .map((attachment: string) => {
              // 解析 prefix 和 txid
              // 格式: metafile://9efda111d8...i0 或 metacode://xxxxx
              const match = attachment.match(/^(metafile:\/\/|metacode:\/\/)(.+)$/)

              if (match) {
                const prefix = match[1]
                let txid = match[2]

                // 移除末尾的i0（如果有）
                if (txid.endsWith('i0')) {
                  txid = txid.slice(0, -2)
                }

                return {
                  type: 'txid' as const,
                  prefix: prefix,
                  txid: txid,
                  fullPath: attachment
                }
              }

              // 如果格式不匹配，返回null
              return null
            })
            .filter((item: any): item is { type: 'txid'; prefix: string; txid: string; fullPath: string } => item !== null)

          // 调用组件的addExistingAttachments方法来回填附件
          if (attachmentUploadRef.value.addExistingAttachments && attachmentItems.length > 0) {
            attachmentUploadRef.value.addExistingAttachments(attachmentItems)
          }
        }
      })
    }
  } catch (error) {
    console.error('填充表单数据失败:', error)
  }
}, { immediate: true, deep: true })

// 计算属性：判断表单是否有效
const isFormValid = computed(() => {
  if (!formData.value.title.trim()) return false
  if (!formData.value.protocolName.trim()) return false
  if (metaDataItems.value.length === 0) return false

  for (const item of metaDataItems.value) {
    if (!item.key.trim()) return false
  }

  return true
})

// 添加新的MetaData项
const addMetaDataItem = async () => {
  const newId = nextId.value++
  metaDataItems.value.push({
    id: newId,
    key: '',
    valueType: 'String',
    value: '',
    description: ''
  })

  await nextTick()
  const newElement = document.querySelector(`[data-item-id="${newId}"]`)
  if (newElement) {
    newElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }
}

// 删除MetaData项
const removeMetaDataItem = (id: number) => {
  metaDataItems.value = metaDataItems.value.filter(item => item.id !== id)
}

// 处理Value类型变化
const handleValueTypeChange = (item: MetaDataItem) => {
  if (item.valueType === 'Boolean' && !item.value) {
    item.value = 'false'
  }
}

// 解析值根据类型
const parseValue = (value: string, type: string): any => {
  if (!value || !value.trim()) {
    switch (type) {
      case 'String':
        return ''
      case 'Number':
        return 0
      case 'Boolean':
        return false
      case 'Object':
        return {}
      case 'Array':
        return []
      default:
        return ''
    }
  }

  try {
    switch (type) {
      case 'Boolean':
        const lowerValue = value.trim().toLowerCase()
        return lowerValue === 'true' || lowerValue === '1'
      case 'Number':
        const num = Number(value)
        if (isNaN(num)) {
          throw new Error('Invalid number')
        }
        return num
      case 'Object':
        try {
          const parsedObj = JSON.parse(value)
          if (typeof parsedObj !== 'object' || Array.isArray(parsedObj)) {
            throw new Error('Not a valid object')
          }
          return parsedObj
        } catch (jsonError) {
          try {
            let fixedJson = value.trim()
            fixedJson = fixedJson.replace(/(\w+):/g, '"$1":')
            const parsedObj = JSON.parse(fixedJson)

            if (typeof parsedObj !== 'object' || Array.isArray(parsedObj)) {
              throw new Error('Not a valid object')
            }
            return parsedObj
          } catch (fixError) {
            throw new Error('Invalid object format')
          }
        }
      case 'Array':
        try {
          const parsedArr = JSON.parse(value)
          if (!Array.isArray(parsedArr)) {
            throw new Error('Not a valid array')
          }
          return parsedArr
        } catch (jsonError) {
          try {
            let fixedJson = value.trim()
            fixedJson = fixedJson.replace(/(\w+):/g, '"$1":')
            const parsedArr = JSON.parse(fixedJson)
            if (!Array.isArray(parsedArr)) {
              throw new Error('Not a valid array')
            }
            return parsedArr
          } catch (fixError) {
            throw new Error('Invalid array format')
          }
        }
      case 'String':
      default:
        return value.trim()
    }
  } catch (error) {
    console.warn(`Failed to parse value as ${type}:`, error)
    return value.trim()
  }
}

// 生成带注释的JSON5字符串
const generateJSON5WithComments = () => {
  let result = '{\n'

  metaDataItems.value.forEach((item, index) => {
    if (item.key) {
      if (item.description) {
        result += ` /** ${item.description} */\n`
      }

      const parsedValue = parseValue(item.value, item.valueType)

      let valueStr = ''
      switch (item.valueType) {
        case 'String':
          valueStr = `"${parsedValue}"`
          break
        case 'Number':
          valueStr = parsedValue.toString()
          break
        case 'Boolean':
          valueStr = parsedValue ? 'true' : 'false'
          break
        case 'Object':
          try {
            const objStr = JSON.stringify(parsedValue, null, 2)
            valueStr = objStr.split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n')
          } catch (error) {
            valueStr = `"${item.value}"`
          }
          break
        case 'Array':
          try {
            const arrStr = JSON.stringify(parsedValue, null, 2)
            valueStr = arrStr.split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n')
          } catch (error) {
            valueStr = `"${item.value}"`
          }
          break
        default:
          valueStr = `"${parsedValue}"`
      }

      result += ` "${item.key}": ${valueStr}`

      if (index < metaDataItems.value.length - 1) {
        result += ','
      }
      result += '\n'
    }
  })

  result += '}'
  return result
}

// 提交表单
const handleSubmit = async () => {
  if (!formData.value.title.trim()) {
    showToast('请填写标题', 'warning')
    return
  }

  if (!formData.value.protocolName.trim()) {
    showToast('请填写协议名称', 'warning')
    return
  }

  if (metaDataItems.value.length === 0) {
    showToast('协议内容不能为空，请至少添加一个字段', 'warning')
    return
  }

  for (const item of metaDataItems.value) {
    if (!item.key.trim()) {
      showToast('请填写所有Body项的Key', 'warning')
      return
    }
  }

  try {
    isSubmitting.value = true

    // 先上传文件到链上获取路径
    let parsedAttachments: string[] = []

    // 如果有附件（包括原有的和新上传的），统一处理
    if (attachmentUploadRef.value && attachmentUploadRef.value.selectedItems.length > 0) {
      // 检查是否有需要上传的文件
      const hasFilesToUpload = attachmentUploadRef.value.selectedItems.some((item: any) => item.type === 'file')

      if (hasFilesToUpload) {
        showToast('正在上传附件到链上...', 'info')
      }

      try {
        // uploadFilesToChain会处理所有selectedItems：
        // - txid类型：直接使用fullPath
        // - file类型：上传到链上并返回metafile://路径
        const paths = await attachmentUploadRef.value.uploadFilesToChain()
        parsedAttachments = paths

        if (hasFilesToUpload) {
          const fileCount = attachmentUploadRef.value.selectedItems.filter((item: any) => item.type === 'file').length
          showToast(`附件处理成功，共上传 ${fileCount} 个新文件`, 'success')
        }
      } catch (error) {
        showToast(`附件处理失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
        return
      }
    }

    // 解析 metadata
    let parsedMetadata: any = ''
    if (formData.value.metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(formData.value.metadata)
      } catch (error) {
        parsedMetadata = formData.value.metadata
      }
    }

    // 构建协议数据
    const protocolContent = generateJSON5WithComments()

    const metaidData = {
      path: `@${props.protocolData?.id}`,
      body: {
        title: formData.value.title,
        path: `/protocols/${formData.value.protocolName.trim().toLowerCase()}`,
        version: formData.value.version,
        authors: userStore.last.name || userStore.last.metaid.slice(0, 6),
        intro: formData.value.intro,
        protocolName: formData.value.protocolName,
        protocolAttachments: parsedAttachments,
        metadata: parsedMetadata,
        protocolContent: protocolContent,
        protocolContentType: formData.value.protocolContentType.value,
      },
      contentType: 'application/json',
      encoding: 'utf-8' as const,
      version: originalVersion.value , // 使用自增后的版本号
      operation: 'modify' as const
    }

    console.log('提交编辑协议数据:', metaidData)
    const options = {
      serialAction: 'finish' as const,
    }

    const result = await uploadProtocol(metaidData, options)

    console.log('协议编辑上链结果:', result)

    const txid = result?.txid || result?.txids?.[0]

    isOpen.value = false
    emit('success')

    showToast('协议编辑成功！', 'success')

    if (txid) {
      successTxid.value = txid
      showSuccessModal.value = true

      console.log('✅ 协议编辑已成功提交到链上')
      console.log('🔗 TxID:', txid)
    }
  } catch (error) {
    console.error('编辑协议失败:', error)
    showToast(`编辑失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
  } finally {
    isSubmitting.value = false
  }
}

// 关闭弹窗
const handleClose = () => {
  if (!isSubmitting.value) {
    isOpen.value = false
  }
}

// 拖拽处理
const handleDragEnter = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (e.target === e.currentTarget) {
    isDragging.value = false
  }
}

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]

  if (!file.name.endsWith('.json')) {
    showToast('请拖放 .json 格式的文件', 'warning')
    return
  }

  try {
    const text = await file.text()
    const jsonData = JSON.parse(text)

    parseJsonToMetadataItems(jsonData)
    showToast('JSON文件解析成功', 'success')
  } catch (error) {
    console.error('JSON解析失败:', error)
    showToast(`JSON解析失败: ${error instanceof Error ? error.message : '格式错误'}`, 'error')
  }
}

const parseJsonToMetadataItems = (jsonData: any) => {
  metaDataItems.value = []
  nextId.value = 1

  Object.entries(jsonData).forEach(([key, value]) => {
    let valueType = 'String'
    let valueStr = ''
    let description = ''

    if (typeof value === 'object' && value !== null) {
      if ('value' in value && 'description' in value) {
        const v = (value as any).value
        description = (value as any).description || ''

        if (typeof v === 'boolean') {
          valueType = 'Boolean'
          valueStr = v.toString()
        } else if (typeof v === 'number') {
          valueType = 'Number'
          valueStr = v.toString()
        } else if (Array.isArray(v)) {
          valueType = 'Array'
          valueStr = JSON.stringify(v, null, 2)
        } else if (typeof v === 'object' && v !== null) {
          valueType = 'Object'
          valueStr = JSON.stringify(v, null, 2)
        } else {
          valueType = 'String'
          valueStr = String(v)
        }
      } else {
        if (Array.isArray(value)) {
          valueType = 'Array'
          valueStr = JSON.stringify(value, null, 2)
        } else {
          valueType = 'Object'
          valueStr = JSON.stringify(value, null, 2)
        }
      }
    } else if (typeof value === 'boolean') {
      valueType = 'Boolean'
      valueStr = value.toString()
    } else if (typeof value === 'number') {
      valueType = 'Number'
      valueStr = value.toString()
    } else {
      valueType = 'String'
      valueStr = String(value)
    }

    metaDataItems.value.push({
      id: nextId.value++,
      key,
      valueType,
      value: valueStr,
      description
    })
  })
}

const getPlaceholder = (type: string) => {
  switch (type) {
    case 'Boolean':
      return 'true 或 false'
    case 'Object':
      return '{"example": "value"}'
    case 'Array':
      return '["item1", "item2"]'
    case 'Number':
      return '123'
    default:
      return '请输入值'
  }
}
</script>

<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" class="relative z-[9999]" static>
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
              class="w-full max-w-[800px] h-[90vh] transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all flex flex-col"
            >
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <DialogTitle as="h3" class="text-xl font-bold text-gray-900">
                  编辑协议
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
                  <!-- 协议基础信息部分 -->
                  <div class="space-y-6">
                    <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span class="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded"></span>
                      协议基础信息
                    </h4>

                    <!-- Title -->
                    <div class="form-item">
                      <label class="form-label">
                        标题 <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.title"
                        type="text"
                        class="form-input"
                        placeholder="请输入协议标题"
                        required
                      />
                    </div>

                    <!-- Protocol Name -->
                    <div class="form-item">
                      <label class="form-label">
                        协议名称
                      </label>
                      <input
                        v-model="formData.protocolName"
                        type="text"
                        class="form-input bg-gray-50"
                        placeholder="例如: myprotocol"
                        readonly
                      />
                    </div>

                    <!-- Version (readonly, auto-incremented) -->
                    <div class="form-item">
                      <label class="form-label">
                        版本号
                      </label>

                      <!-- Version History Panel -->
                      <div v-if="hasVersionHistory" class="mb-3">
                        <button
                          type="button"
                          @click="showVersionHistory = !showVersionHistory"
                          class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <svg
                            class="w-4 h-4 transform transition-transform"
                            :class="{ 'rotate-90': showVersionHistory }"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                          <span>版本历史 ({{ modifyHistory.length }} 个版本)</span>
                        </button>

                        <div
                          v-show="showVersionHistory"
                          class="mt-3 space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50"
                        >
                          <div
                            v-for="(item, index) in modifyHistory"
                            :key="index"
                            class="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-purple-300 transition-colors"
                          >
                            <div class="flex items-center gap-3">
                              <span
                                v-if="index === modifyHistory.length - 1"
                                class="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded"
                              >
                                当前版本
                              </span>
                              <span
                                v-else
                                class="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded"
                              >
                                历史版本
                              </span>
                              <span class="text-sm font-mono text-gray-700">
                                {{ index === modifyHistory.length - 1 ? originalVersion : '' }}
                              </span>
                            </div>
                            <a
                              :href="`https://manapi.metaid.io/pin/ver/${route.params.id}/${index}`"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 hover:underline"
                            >
                              <span>查看详情</span>
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>

                      <input
                        v-model="formData.version"
                        type="text"
                        class="form-input"
                        placeholder="输入版本号或留空自动递增"
                      />
                      <p class="text-xs text-gray-500 mt-1">
                        版本号将自动递增（如: 1.0.0 → 1.0.1 → 1.0.9 → 1.1.0），也可手动输入
                      </p>
                    </div>

                    <!-- Protocol Content Type -->
                    <div class="form-item">
                      <label class="form-label">
                        协议主体类型
                      </label>
                      <Listbox v-model="formData.protocolContentType">
                        <div class="relative">
                          <ListboxButton class="form-select">
                            <span class="block truncate">{{ formData.protocolContentType.label }}</span>
                            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                              </svg>
                            </span>
                          </ListboxButton>
                          <transition
                            leave-active-class="transition duration-100 ease-in"
                            leave-from-class="opacity-100"
                            leave-to-class="opacity-0"
                          >
                            <ListboxOptions class="select-options">
                              <ListboxOption
                                v-for="type in mimeTypes"
                                :key="type.value"
                                :value="type"
                                v-slot="{ active, selected }"
                              >
                                <li :class="[active ? 'bg-purple-100' : '', 'select-option']">
                                  <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">
                                    {{ type.label }}
                                  </span>
                                </li>
                              </ListboxOption>
                            </ListboxOptions>
                          </transition>
                        </div>
                      </Listbox>
                    </div>

                    <!-- Intro -->
                    <div class="form-item">
                      <label class="form-label">
                        简介 (Intro)
                      </label>
                      <textarea
                        v-model="formData.intro"
                        class="form-input resize-none"
                        placeholder="请输入协议简介"
                        rows="3"
                      ></textarea>
                    </div>

                    <!-- Protocol Attachments -->
                    <div class="form-item">
                      <label class="form-label">
                        协议附件 (Protocol Attachments)
                      </label>
                      <ProtocolAttachmentUpload
                        ref="attachmentUploadRef"
                        @items-selected="handleFilesSelected"
                        @items-removed="handleFilesRemoved"
                      />
                      <p class="text-xs text-gray-500 mt-1">
                        支持文件上传或手动输入TXID，单个文件大小限制1MB，文件将在提交协议时上传到链上
                      </p>
                    </div>

                    <!-- Metadata -->
                    <div class="form-item">
                      <label class="form-label">
                        元数据 (Metadata)
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

                  <!-- 协议内容信息部分 -->
                  <div class="space-y-6">
                    <div class="sticky-header-section">
                      <div class="flex items-center justify-between">
                        <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <span class="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded"></span>
                          协议主体 (Body)
                        </h4>
                        <button
                          type="button"
                          @click="addMetaDataItem"
                          class="add-item-btn"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                          </svg>
                          添加字段
                        </button>
                      </div>
                    </div>

                    <!-- MetaData Items -->
                    <div
                      v-if="metaDataItems.length === 0"
                      class="drop-zone"
                      :class="{ 'drop-zone-active': isDragging }"
                      @dragenter="handleDragEnter"
                      @dragover="handleDragOver"
                      @dragleave="handleDragLeave"
                      @drop="handleDrop"
                    >
                      <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p class="mt-4">暂无字段，点击"添加字段"按钮开始创建</p>
                      <p class="mt-2 text-sm text-purple-500 font-medium">或拖放 .json 文件到此处快速导入</p>
                    </div>

                    <div
                      v-else
                      class="space-y-4 relative"
                      @dragenter="handleDragEnter"
                      @dragover="handleDragOver"
                      @dragleave="handleDragLeave"
                      @drop="handleDrop"
                    >
                      <!-- Drag overlay -->
                      <div v-if="isDragging" class="drag-overlay">
                        <div class="drag-overlay-content">
                          <svg class="w-16 h-16 text-purple-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p class="text-xl font-semibold text-gray-900">释放以导入 JSON 文件</p>
                          <p class="text-sm text-gray-500 mt-2">将自动解析并填充字段</p>
                        </div>
                      </div>
                      <div
                        v-for="(item, index) in metaDataItems"
                        :key="item.id"
                        :data-item-id="item.id"
                        class="metadata-item"
                      >
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-sm font-semibold text-gray-600">字段 #{{ index + 1 }}</span>
                          <button
                            type="button"
                            @click="removeMetaDataItem(item.id)"
                            class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            title="删除"
                          >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div class="space-y-4">
                          <div class="form-item">
                            <label class="form-label-sm">Key <span class="text-red-500">*</span></label>
                            <input
                              v-model="item.key"
                              type="text"
                              class="form-input-sm"
                              placeholder="字段名称"
                              required
                            />
                          </div>

                          <div class="form-item">
                            <label class="form-label-sm">Value 类型</label>
                            <select
                              v-model="item.valueType"
                              class="form-input-sm"
                              @change="handleValueTypeChange(item)"
                            >
                              <option v-for="type in dataTypes" :key="type.value" :value="type.value">
                                {{ type.label }}
                              </option>
                            </select>
                            <p class="text-xs text-gray-500 mt-1">
                              指定下方 Value 字段的数据类型
                            </p>
                          </div>

                          <div class="form-item">
                            <label class="form-label-sm">Value(示例值)</label>
                            <!-- Boolean类型使用单选按钮 -->
                            <div v-if="item.valueType === 'Boolean'" class="flex gap-4 mt-2">
                              <label class="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  v-model="item.value"
                                  value="true"
                                  class="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                />
                                <span class="text-sm text-gray-700">true</span>
                              </label>
                              <label class="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  v-model="item.value"
                                  value="false"
                                  class="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                />
                                <span class="text-sm text-gray-700">false</span>
                              </label>
                            </div>
                            <!-- 其他类型使用文本框 -->
                            <textarea
                              v-else
                              v-model="item.value"
                              class="form-textarea-sm"
                              :placeholder="getPlaceholder(item.valueType)"
                              rows="3"
                            ></textarea>
                            <p class="text-xs text-gray-500 mt-1">
                              可选字段。不填写时根据类型使用默认值：String(""), Number(0), Boolean(false), Object({}), Array([])
                            </p>
                          </div>

                          <div class="form-item">
                            <label class="form-label-sm">注释 (Note)</label>
                            <input
                              v-model="item.description"
                              type="text"
                              class="form-input-sm"
                              placeholder="该字段将作为注释显示"
                            />
                          </div>
                        </div>
                      </div>

                      <!-- JSON 预览区域 -->
                      <div class="mt-6">
                        <div class="flex items-center justify-between mb-3">
                          <h5 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            JSON 预览
                          </h5>
                          <span class="text-xs text-gray-500">
                            实时显示协议内容
                          </span>
                        </div>

                        <div class="json-preview-container">
                          <pre class="json-preview-content">{{ generateJSON5WithComments() }}</pre>
                        </div>
                      </div>
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
                  {{ isSubmitting ? '提交中...' : '提交' }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>

  <!-- 成功提示弹窗 -->
  <SuccessModal v-model="showSuccessModal" :txid="successTxid" />
</template>

<style lang="scss" scoped>
.form-item {
  @apply flex flex-col gap-2;
}

.form-label {
  @apply block text-sm font-semibold text-gray-700;
}

.form-label-sm {
  @apply block text-xs font-semibold text-gray-600;
}

.form-input {
  @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all;

  &::placeholder {
    @apply text-gray-400;
  }
}

.form-input-sm {
  @apply w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all;

  &::placeholder {
    @apply text-gray-400;
  }
}

.form-textarea-sm {
  @apply w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none;

  &::placeholder {
    @apply text-gray-400;
  }
}

.form-select {
  @apply relative w-full cursor-pointer rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all;
}

.select-options {
  @apply absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10;
}

.select-option {
  @apply relative cursor-pointer select-none py-2 px-4 text-gray-900 hover:bg-purple-50 transition-colors;
}

.metadata-item {
  @apply p-5 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50 hover:border-purple-300 transition-all;
}

.add-item-btn {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all;
}

.btn-primary {
  @apply inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none;
}

.btn-secondary {
  @apply px-6 py-2.5 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed;
}

.json-preview-container {
  @apply bg-gray-900 border border-gray-700 rounded-lg overflow-hidden;
}

.json-preview-content {
  @apply text-white text-sm font-mono p-4 overflow-x-auto whitespace-pre-wrap;
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  line-height: 1.5;
  color: #e5e7eb;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  cursor: text;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #374151;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #6b7280;
    border-radius: 4px;

    &:hover {
      background: #9ca3af;
    }
  }
}

.sticky-header-section {
  @apply sticky top-0 z-10 bg-white py-3 mb-4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-left: -1.5rem;
  margin-right: -1.5rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.drop-zone {
  @apply text-center py-12 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 transition-all;

  &.drop-zone-active {
    @apply border-purple-500 bg-purple-50 scale-105;
    box-shadow: 0 0 20px rgba(147, 51, 234, 0.3);
  }
}

.drag-overlay {
  @apply absolute inset-0 bg-white/95 backdrop-blur-sm rounded-lg border-2 border-dashed border-purple-500 flex items-center justify-center z-20;
  animation: pulse 2s ease-in-out infinite;
}

.drag-overlay-content {
  @apply flex flex-col items-center justify-center;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.9;
  }
}
</style>
