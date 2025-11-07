<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot, Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
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

const { uploadProtocol } = useCreateProtocols()
const { showToast } = useToast()
const userStore=useUserStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
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
  protocolAttachments: [] as string[], // 改为数组类型
  metadata: '',
  protocolContentType: mimeTypes[1], // 默认 application/json5
  protocolEncoding: encodingTypes[0], // 默认 utf-8
})

const metaDataItems = ref<MetaDataItem[]>([])
const nextId = ref(1)
const isSubmitting = ref(false)

// 附件上传组件引用
const attachmentUploadRef = ref<InstanceType<typeof ProtocolAttachmentUpload>>()

// 成功弹窗状态
const showSuccessModal = ref(false)
const successTxid = ref('')

// 计算属性：判断表单是否有效
const isFormValid = computed(() => {
  // 1. 必填字段不能为空
  if (!formData.value.title.trim()) return false
  if (!formData.value.protocolName.trim()) return false

  // 2. 协议内容（MetaData）必须不为空
  if (metaDataItems.value.length === 0) return false

  // 3. 每个 MetaData 项的必填字段必须填写
  for (const item of metaDataItems.value) {
    // Key 不能为空
    if (!item.key.trim()) return false
    // Value 已改为非必填，不再验证
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

  // 等待 DOM 更新后滚动到新添加的元素
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
  // 当切换到Boolean类型且当前值为空时，设置默认值为'false'
  if (item.valueType === 'Boolean' && !item.value) {
    item.value = 'false'
  }
}

// 处理文件选择成功
const handleFilesSelected = (files: any[]) => {
  console.log('文件选择成功:', files)
  // 可以在这里添加额外的处理逻辑
}

// 处理文件移除
const handleFilesRemoved = (files: any[]) => {
  console.log('文件已移除:', files)
  // 可以在这里添加额外的处理逻辑
}

// 解析值根据类型
const parseValue = (value: string, type: string): any => {
  // 如果 value 为空，根据类型返回默认值
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
        // 解析布尔值
        const lowerValue = value.trim().toLowerCase()
        return lowerValue === 'true' || lowerValue === '1'
      case 'Number':
        const num = Number(value)
        if (isNaN(num)) {
          throw new Error('Invalid number')
        }
        return num
      case 'Object':
        // 尝试解析为JSON对象
        try {
          // 首先尝试标准JSON解析
          const parsedObj = JSON.parse(value)
          if (typeof parsedObj !== 'object' || Array.isArray(parsedObj)) {
            throw new Error('Not a valid object')
          }
          return parsedObj
        } catch (jsonError) {
          // 如果标准JSON解析失败，尝试修复常见的JSON格式问题
          try {
            // 修复key没有双引号的问题，包括嵌套对象
            let fixedJson = value.trim()
            
            // 递归修复所有key的双引号问题
            const fixKeys = (str: string): string => {
              // 匹配 key: 模式（key可能是字母数字下划线）
              return str.replace(/(\w+):/g, '"$1":')
            }
            
            fixedJson = fixKeys(fixedJson)
            const parsedObj = JSON.parse(fixedJson)
            
            if (typeof parsedObj !== 'object' || Array.isArray(parsedObj)) {
              throw new Error('Not a valid object')
            }
            return parsedObj
          } catch (fixError) {
            // 如果还是失败，尝试更复杂的修复
            try {
              // 处理更复杂的嵌套结构
              let complexFixed = value.trim()
              
              // 修复所有可能的key格式问题
              complexFixed = complexFixed.replace(/(\w+):/g, '"$1":')
              
              // 修复字符串值没有引号的问题（简单情况）
              complexFixed = complexFixed.replace(/:\s*([^",{\[\s][^,}\]]*?)([,}])/g, ': "$1"$2')
              
              const parsedObj = JSON.parse(complexFixed)
              if (typeof parsedObj !== 'object' || Array.isArray(parsedObj)) {
                throw new Error('Not a valid object')
              }
              return parsedObj
            } catch (complexError) {
              throw new Error('Invalid object format')
            }
          }
        }
      case 'Array':
        // 尝试解析为JSON数组
        try {
          const parsedArr = JSON.parse(value)
          if (!Array.isArray(parsedArr)) {
            throw new Error('Not a valid array')
          }
          return parsedArr
        } catch (jsonError) {
          // 如果标准JSON解析失败，尝试修复常见的JSON格式问题
          try {
            // 修复key没有双引号的问题（如果数组包含对象）
            let fixedJson = value.trim()
            
            // 修复所有可能的key格式问题
            fixedJson = fixedJson.replace(/(\w+):/g, '"$1":')
            
            // 修复字符串值没有引号的问题（简单情况）
            fixedJson = fixedJson.replace(/:\s*([^",{\[\s][^,}\]]*?)([,}])/g, ': "$1"$2')
            
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
    // 如果解析失败，返回原始字符串值
    console.warn(`Failed to parse value as ${type}:`, error)
    return value.trim()
  }
}

// 生成JSON5格式的协议内容
const generateProtocolContent = () => {
  const content: any = {}

  metaDataItems.value.forEach(item => {
    if (item.key) {
      content[item.key] = {
        value: parseValue(item.value, item.valueType),
        description: item.description
      }
    }
  })

  return content
}

// 生成带注释的JSON5字符串
const generateJSON5WithComments = () => {
  let result = '{\n'

  metaDataItems.value.forEach((item, index) => {
    if (item.key) {
      if (item.description) {
        result += ` //${item.description}\n`
      }

      const parsedValue = parseValue(item.value, item.valueType)
      
      // 根据value类型生成正确的JSON格式
      let valueStr = ''
      switch (item.valueType) {
        case 'String':
          // 字符串类型：确保用双引号包围
          valueStr = `"${parsedValue}"`
          break
        case 'Number':
          // 数字类型：直接显示，不需要引号
          valueStr = parsedValue.toString()
          break
        case 'Boolean':
          // 布尔类型：直接显示true或false，不需要引号
          valueStr = parsedValue ? 'true' : 'false'
          break
        case 'Object':
          // 对象类型：格式化为标准JSON格式
          try {
            // 使用JSON.stringify重新格式化，确保key有双引号
            const objStr = JSON.stringify(parsedValue, null, 2)
            // 为每行添加适当的缩进
            valueStr = objStr.split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n')
          } catch (error) {
            // 如果解析失败，当作字符串处理
            valueStr = `"${item.value}"`
          }
          break
        case 'Array':
          // 数组类型：格式化为标准JSON格式
          try {
            // 使用JSON.stringify重新格式化，确保格式正确
            const arrStr = JSON.stringify(parsedValue, null, 2)
            // 为每行添加适当的缩进
            valueStr = arrStr.split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n')
          } catch (error) {
            // 如果解析失败，当作字符串处理
            valueStr = `"${item.value}"`
          }
          break
        default:
          // 默认情况：当作字符串处理
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
  // 验证必填字段
  if (!formData.value.title.trim()) {
    showToast('请填写标题', 'warning')
    return
  }
  if (!formData.value.protocolName.trim()) {
    showToast('请填写协议名称', 'warning')
    return
  }

  // 验证协议内容不为空
  if (metaDataItems.value.length === 0) {
    showToast('协议内容不能为空，请至少添加一个字段', 'warning')
    return
  }

  // 验证Body
  for (const item of metaDataItems.value) {
    if (!item.key.trim()) {
      showToast('请填写所有Body项的Key', 'warning')
      return
    }
    // Value 已改为非必填，不再验证
  }

  try {
    isSubmitting.value = true

    // 先上传文件到链上获取路径
    let parsedAttachments: string[] = []
    if (attachmentUploadRef.value && attachmentUploadRef.value.selectedItems.length > 0) {
      showToast('正在上传附件到链上...', 'info')

      try {
        // 调用附件上传组件的上传方法
        const paths = await attachmentUploadRef.value.uploadFilesToChain()

        // paths 已经是完整路径格式，如: ["metafile://txidi0", "metacode://txidi0"]
        parsedAttachments = paths

        showToast(`附件处理成功，共 ${paths.length} 个附件`, 'success')
      } catch (error) {
        showToast(`附件处理失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
        return
      }
    }

    // 解析 metadata (可以是任意类型)
    let parsedMetadata: any = ''
    if (formData.value.metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(formData.value.metadata)
      } catch (error) {
        // 如果无法解析为JSON,则当作字符串处理
        parsedMetadata = formData.value.metadata
      }
    }

    // 构建协议数据
    const protocolContent = generateJSON5WithComments()
    
    const metaidData = {
      path: `/protocols/metaprotocol`,
      body: {
        title: formData.value.title,
        path:`/protocols/${formData.value.protocolName.trim().toLocaleLowerCase()}`,
        version: formData.value.version,
        authors:userStore.last.name || userStore.last.metaid.slice(0,6),
        intro: formData.value.intro,
        protocolName: formData.value.protocolName,
        protocolAttachments: parsedAttachments,
        metadata: parsedMetadata,
        protocolContent: protocolContent,
        protocolContentType: formData.value.protocolContentType.value,
      },
      contentType: 'application/json',
      encoding: 'utf-8' as const,
      version: '1.0.0',
      operation: 'create' as const
    }

    console.log('提交协议数据:', metaidData)
    const options={
      serialAction:'finish' as const,
    }
    
    // 调用上链方法
    const result = await uploadProtocol(metaidData,options)
    
    console.log('协议上链结果:', result)

    // 提取 txid
    const txid = result?.txid || result?.txids?.[0]

    // 重置表单并关闭提交弹窗
    resetForm()
    isOpen.value = false

    // 显示成功提示
    showToast('协议提交成功！', 'success')

    // 如果有 txid，显示成功弹窗
    if (txid) {
      successTxid.value = txid
      showSuccessModal.value = true

      // 在控制台输出信息
      console.log('✅ 协议已成功提交到链上')
      console.log('🔗 TxID:', txid)
    }
  } catch (error) {
    console.error('提交协议失败:', error)
    showToast(`提交失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
  } finally {
    isSubmitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  formData.value = {
    title: '',
    protocolName: '',
    version: '1.0.0',
    intro: '',
    protocolAttachments: [], // 重置为空数组
    metadata: '',
    protocolContentType: mimeTypes[1],
    protocolEncoding: encodingTypes[0],
  }
  metaDataItems.value = []
  nextId.value = 1
  
  // 清空附件上传组件
  if (attachmentUploadRef.value) {
    attachmentUploadRef.value.clearFiles()
  }
}

// 关闭弹窗
const handleClose = () => {
  if (!isSubmitting.value) {
    isOpen.value = false
  }
}

// 获取placeholder
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
                  提交协议
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
                        协议名称 <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.protocolName"
                        type="text"
                        class="form-input"
                        placeholder="例如: myprotocol"
                        required
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
                        placeholder="1.0.0"
                      />
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

                    <!-- Protocol Encoding -->
                    <div class="form-item">
                      <label class="form-label">
                        编码格式
                      </label>
                      <Listbox v-model="formData.protocolEncoding">
                        <div class="relative">
                          <ListboxButton class="form-select">
                            <span class="block truncate">{{ formData.protocolEncoding.label }}</span>
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
                                v-for="encoding in encodingTypes"
                                :key="encoding.value"
                                :value="encoding"
                                v-slot="{ active, selected }"
                              >
                                <li :class="[active ? 'bg-purple-100' : '', 'select-option']">
                                  <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">
                                    {{ encoding.label }}
                                  </span>
                                </li>
                              </ListboxOption>
                            </ListboxOptions>
                          </transition>
                        </div>
                      </Listbox>
                    </div>

                    <!-- 协议可选信息 -->
                    <div class="mt-6 space-y-4">
                      <h5 class="text-sm font-semibold text-gray-700 border-l-4 border-blue-500 pl-3">
                        协议可选信息
                      </h5>

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
                  </div>

                  <!-- 协议内容信息部分 -->
                  <div class="space-y-6">
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

                    <!-- MetaData Items -->
                    <div v-if="metaDataItems.length === 0" class="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p class="mt-4">暂无字段，点击"添加字段"按钮开始创建</p>
                    </div>

                    <div v-else class="space-y-4">
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
                            <label class="form-label-sm">Value</label>
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
                            <label class="form-label-sm">描述 (Description)</label>
                            <input
                              v-model="item.description"
                              type="text"
                              class="form-input-sm"
                              placeholder="字段描述，将作为注释显示"
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
                  {{ isSubmitting ? '提交中...' : '提交协议' }}
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
  
  /* JSON 语法高亮 */
  color: #e5e7eb;
  
  /* 滚动条样式 */
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
</style>
