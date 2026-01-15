<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input/'
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from '@/components/ai-elements/model-selector'
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import {
  Message,
  MessageAction,
  MessageActions,
  MessageAttachment,
  MessageAttachments,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from '@/components/ai-elements/message'

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewConsole,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from '@/components/ai-elements/web-preview'
import { Shimmer } from '@/components/ai-elements/shimmer'

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CopyIcon,
  ExternalLinkIcon,
  Maximize2Icon,
  MousePointerClickIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  CheckIcon
} from 'lucide-vue-next'
import { nanoid } from 'nanoid'
import { ref, watch, nextTick, onMounted,computed, onBeforeUnmount } from 'vue'

// 流式更新的状态管理
interface StreamingState {
  currentTokenIndex: number
  tokens: string[]
  finalContent: string
  timeoutId?: ReturnType<typeof setTimeout>
}

import HeaderControls from './prompt-input-header-controls.vue'
import { useVibeCodingSocket } from '@/hooks/use-vibe_coding_socket'
import type { UnifiedMessage } from '@/hooks/use-vibe_coding_socket'
import { MessageType as SocketMessageType, UserIntent } from '@/hooks/use-vibe_coding_socket'

interface Attachment {
  type: 'file'
  url: string
  mediaType?: string
  filename?: string
}

interface Version {
  id: string
  content: string
}

interface ReasoningData {
  content: string
  isStreaming: boolean
}

interface WebPreviewLog {
  level: 'log' | 'warn' | 'error'
  message: string
  timestamp: Date
}

interface WebPreviewData {
  url: string
  defaultUrl?: string
  logs?: WebPreviewLog[]
  fullscreen?: boolean
}

interface MessageType {
  key: string
  from: 'user' | 'assistant'
  requestId?: string  // 后端返回的 requestId，用于关联同一请求的消息
  versions?: Version[]
  content?: string
  attachments?: Attachment[]
  reasoning?: ReasoningData  // 如果存在此字段，则渲染为 Reasoning 组件
  webPreview?: WebPreviewData  // 如果存在此字段，则渲染为 WebPreview 组件
  isThinking?: boolean  // 标识为 "Thinking..." 消息，需要闪烁动画
}

const SUBMITTING_TIMEOUT = 200
const STREAMING_TIMEOUT = 2000

const messages = ref<MessageType[]>([
  {
    key: nanoid(),
    from: 'assistant',
    content: `👋 欢迎使用 MetaWeb AI 智能体！

我是你的 AI 编程助手，可以帮助你完成以下任务：

🎯 **生成应用**
   • 描述你的应用需求，我会为你生成完整的代码
   • 例如："创建一个待办事项应用"

🔧 **修改应用**
   • 告诉我需要修改的功能或样式
   • 例如："将按钮改为蓝色，添加动画效果"

💬 **代码对话**
   • 询问编程问题，获取代码建议
   • 例如："如何实现用户认证功能？"

❓ **技术提问**
   • 解答技术疑问，提供最佳实践
   • 例如："Vue 3 的 Composition API 有什么优势？"

---

💡 **使用提示：**
   • 在下方输入框输入你的需求或问题
   • 支持自然语言描述，越详细越好
   • 可以随时修改和完善你的应用

🚀 开始你的创作之旅吧！`,
  },
//  {
//     key: nanoid(),
//     from: 'assistant',
//     versions: [
//       {
//         id: nanoid(),
//         content: `# Vue Composition API Guide

// The Vue Composition API is a set of functions that let you use Vue’s reactivity and lifecycle features inside the \`setup()\` function of your components. Here's what you need to know:

// ## Core Composables

// ### ref()
// Creates reactive primitive values:

// \`\`\`vue
// <script setup>
// import { ref } from 'vue'

// const count = ref(0)
// <\/script>

// <template>
//   <button @click="count++">Count: {{ count }}</button>
// </template>
// \`\`\`

// ### watch()
// Runs side effects when reactive values change:

// \`\`\`vue
// <script setup>
// import { ref, watch } from 'vue'

// const count = ref(0)

// watch(count, (newVal, oldVal) => {
//   console.log(\`Count changed from \${oldVal} to \${newVal}\`)
// })
//   const count = ref(0)

// watch(count, (newVal, oldVal) => {
//   console.log(\`Count changed from \${oldVal} to \${newVal}\`)
// })const count = ref(0)

// watch(count, (newVal, oldVal) => {
//   console.log(\`Count changed from \${oldVal} to \${newVal}\`)
// })const count = ref(0)

// watch(count, (newVal, oldVal) => {
//   console.log(\`Count changed from \${oldVal} to \${newVal}\`)
// })const count = ref(0)

// watch(count, (newVal, oldVal) => {
//   console.log(\`Count changed from \${oldVal} to \${newVal}\`)
// })const count = ref(0)

// watch(count, (newVal, oldVal) => {
//   console.log(\`Count changed from \${oldVal} to \${newVal}\`)
// })
// <\/script>
// \`\`\`

// ## When to Use the Composition API

// - ✅ **For complex logic** — Easier to organize and reuse reactive state
// - ✅ **For reusable code** — Create your own composables (like custom hooks)
// - ✅ **For TypeScript support** — More type-friendly than Options API
// - ❌ **For simple components** — The Options API might be enough

// ## Rules of the Composition API

// 1. Only use Vue composables **inside \`setup()\`** or other composables
// 2. Always return what you want to use in your template from \`setup()\`

// Would you like to explore more advanced composables like \`computed\` or \`onMounted\`?`,
//       },
//       {
//         id: nanoid(),
//         content: `The Vue Composition API is a modern way to write components in Vue 3. It replaces the Options API’s data, methods, and computed properties with a single \`setup()\` function.

// Here are the most common composables:

// - **ref()** — creates reactive primitive values
// - **reactive()** — makes entire objects reactive
// - **computed()** — creates derived reactive values
// - **watch()** — runs side effects on data changes
// - **onMounted()** — lifecycle hook for when a component is mounted

// Here's a simple example:

// \`\`\`vue
// <script setup>
// import { ref, onMounted } from 'vue'

// const count = ref(0)

// onMounted(() => {
//   console.log('Component mounted!')
// })
// <\/script>

// <template>
//   <button @click="count++">Clicked {{ count }} times</button>
// </template>
// \`\`\`

// Which specific composable would you like to learn more about?`,
//       },
//       {
//         id: nanoid(),
//         content: `Absolutely! The Vue Composition API brings a new, more flexible way to manage logic and reactivity in Vue components.

// ## Key Benefits

// 1. **Cleaner code organization** — Group related logic by feature
// 2. **Reusable logic** — Build and share your own composables
// 3. **Better TypeScript support** — Stronger typing than the Options API

// ## Most Popular Composables

// | Composable | Purpose |
// |-------------|----------|
// | ref | Reactive primitive values |
// | reactive | Reactive objects |
// | computed | Derived reactive values |
// | watch | React to data changes |
// | onMounted | Run code when component mounts |
// | onUnmounted | Cleanup logic when destroyed |

// The beauty of the Composition API is that it lets you reuse stateful logic without changing your component structure. Want to dive into a specific composable?`,
//       },
//     ],
//   },

  //   {
  //   key: nanoid(),
  //   from: 'assistant',
  //   webPreview: {
  //     url:`https://www.ai-elements-vue.com/components/vibe-coding/web-preview`
  //   },
  // },
  // {
  //   key: '123',
  //   from: 'assistant',
  //   content: 'How do Vue composition APIs work and when should I use them?',
  //   // attachments: [
  //   //   {
  //   //     type: 'file',
  //   //     url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
  //   //     mediaType: 'image/jpeg',
  //   //     filename: 'palace-of-fine-arts.jpg',
  //   //   },
  //   //   // {
  //   //   //   type: 'file',
  //   //   //   url: '',
  //   //   //   mediaType: 'application/pdf',
  //   //   //   filename: 'vue-compositions-guide.pdf',
  //   //   // },
  //   // ],
  // },
  // {
  //   key: '123',
  //   from: 'assistant',
  //   content: 'How do Vue composition APIs work and when should I use them?2222',
  //   // attachments: [
  //   //   {
  //   //     type: 'file',
  //   //     url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
  //   //     mediaType: 'image/jpeg',
  //   //     filename: 'palace-of-fine-arts.jpg',
  //   //   },
  //   //   // {
  //   //   //   type: 'file',
  //   //   //   url: '',
  //   //   //   mediaType: 'application/pdf',
  //   //   //   filename: 'vue-compositions-guide.pdf',
  //   //   // },
  //   // ],
  // },
//   {
//     key: nanoid(),
//     from: 'assistant',
//     versions: [
    
//       {
//         id: nanoid(),
//         content: `# Vue Composition API Guide

// The Vue Composition API is a set of functions that let you use Vue's reactivity and lifecycle features inside the \`setup()\` function of your components. Here's what you need to know:

// ## Core Composables

// ### ref()
// Creates reactive primitive values:

// \`\`\`vue
// <script setup>
// import { ref } from 'vue'

// const count = ref(0)
// <\/script>

// <template>
//   <button @click="count++">Count: {{ count }}</button>
// </template>
// \`\`\`

// ### watch()
// Runs side effects when reactive values change:

// \`\`\`vue
// <script setup>
// import { ref, watch } from 'vue'

// const count = ref(0)

// watch(count, (newVal, oldVal) => {
//   console.log(\`Count changed from \${oldVal} to \${newVal}\`)
// })
// <\/script>
// \`\`\`

// ## When to Use the Composition API

// - ✅ **For complex logic** — Easier to organize and reuse reactive state
// - ✅ **For reusable code** — Create your own composables (like custom hooks)
// - ✅ **For TypeScript support** — More type-friendly than Options API
// - ❌ **For simple components** — The Options API might be enough

// ## Rules of the Composition API

// 1. Only use Vue composables **inside \`setup()\`** or other composables
// 2. Always return what you want to use in your template from \`setup()\`

// Would you like to explore more advanced composables like \`computed\` or \`onMounted\`?`,
//       },
//       {
//         id: nanoid(),
//         content: `The Vue Composition API is a modern way to write components in Vue 3. It replaces the Options API's data, methods, and computed properties with a single \`setup()\` function.

// Here are the most common composables:

// - **ref()** — creates reactive primitive values
// - **reactive()** — makes entire objects reactive
// - **computed()** — creates derived reactive values
// - **watch()** — runs side effects on data changes
// - **onMounted()** — lifecycle hook for when a component is mounted

// Here's a simple example:

// \`\`\`vue
// <script setup>
// import { ref, onMounted } from 'vue'

// const count = ref(0)

// onMounted(() => {
//   console.log('Component mounted!')
// })
// <\/script>

// <template>
//   <button @click="count++">Clicked {{ count }} times</button>
// </template>
// \`\`\`

// Which specific composable would you like to learn more about?`,
//       },
//       {
//         id: nanoid(),
//         content: `Absolutely! The Vue Composition API brings a new, more flexible way to manage logic and reactivity in Vue components.

// ## Key Benefits

// 1. **Cleaner code organization** — Group related logic by feature
// 2. **Reusable logic** — Build and share your own composables
// 3. **Better TypeScript support** — Stronger typing than the Options API

// ## Most Popular Composables

// | Composable | Purpose |
// |-------------|----------|
// | ref | Reactive primitive values |
// | reactive | Reactive objects |
// | computed | Derived reactive values |
// | watch | React to data changes |
// | onMounted | Run code when component mounts |
// | onUnmounted | Cleanup logic when destroyed |

// The beauty of the Composition API is that it lets you reuse stateful logic without changing your component structure. Want to dive into a specific composable?`,
//       },
//     ],
//   },
])

const liked = ref<Record<string, boolean>>({})
const disliked = ref<Record<string, boolean>>({})

function handleCopy(content: string) {
  navigator.clipboard.writeText(content)
}

function handlerSelect(m){
  // 如果模型被禁用，不允许选择
  if (m.disabled) {
    return
  }
  modelId.value = m.id;
  modelSelectorOpen.value = false;
}

function handleRetry() {
  console.log('Retrying...')
}

function toggleLike(key: string) {
  liked.value = {
    ...liked.value,
    [key]: !liked.value[key],
  }
}

function toggleDislike(key: string) {
  disliked.value = {
    ...disliked.value,
    [key]: !disliked.value[key],
  }
}

function hasMultipleVersions(message: MessageType) {
  return message.versions && message.versions.length > 1
}

function handleBranchChange(index: number) {
  console.log('Branch changed to:', index)
}

const models = [
  {
    id: 'glm-4.6',
    name: 'GLM-4.6',
    chef: 'OpenAI',
    chefSlug: 'openai',
    providers: ['openai', 'azure'],
    disabled: false,
  },
  {
    id: 'glm-4.7',
    name: 'GLM-4.7',
    chef: 'OpenAI',
    chefSlug: 'openai',
    providers: ['openai', 'azure'],
    disabled: false,
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek-V3.2',
    chef: 'OpenAI',
    chefSlug: 'openai',
    providers: ['openai', 'azure'],
    disabled: false,
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude 4 Opus',
    chef: 'Anthropic',
    chefSlug: 'anthropic',
    providers: ['anthropic', 'azure', 'google', 'amazon-bedrock'],
    disabled: true,
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude 4 Sonnet',
    chef: 'Anthropic',
    chefSlug: 'anthropic',
    providers: ['anthropic', 'azure', 'google', 'amazon-bedrock'],
    disabled: true,
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    chef: 'Google',
    chefSlug: 'google',
    providers: ['google'],
    disabled: true,
  },
]

const modelId = ref<string>(models[0].id)
const modelSelectorOpen = ref(false)
const status = ref<'submitted' | 'streaming' | 'ready' | 'error'>('ready')
const selectedModelData = computed(() => models.find(m => m.id === modelId.value))

// 消息容器引用
const messagesContainerRef = ref<HTMLElement | null>(null)

// 当前活动的 reasoning 消息 key（用于更新流式内容）
const currentReasoningKey = ref<string | null>(null)

// 追踪 "Thinking..." 消息的 key
const thinkingMessageKeys = ref<{
  firstThinking?: string  // handleSubmit 后 1 秒到 handleGenerateProjectStart 之间
  secondThinking?: string  // handleGenerateProjectStart 到 handleGenerateProjectResult 之间
}>({})

// 每个 reasoning 消息的流式更新状态
const streamingStates = ref<Record<string, StreamingState>>({})

// 将文本分割成 token 用于流式显示
function chunkIntoTokens(text: string): string[] {
  const tokenArray: string[] = []
  let i = 0
  while (i < text.length) {
    const chunkSize = Math.floor(Math.random() * 2) + 3
    tokenArray.push(text.slice(i, i + chunkSize))
    i += chunkSize
  }
  return tokenArray
}

// 流式更新单个 reasoning 消息的内容
function streamReasoningToken(messageKey: string) {
  const state = streamingStates.value[messageKey]
  if (!state) return

  const message = messages.value.find(m => m.key === messageKey)
  if (!message || !message.reasoning) {
    // 消息不存在或不再是 reasoning 类型，清理状态
    delete streamingStates.value[messageKey]
    return
  }

  if (state.currentTokenIndex >= state.tokens.length) {
    // 流式更新完成
    message.reasoning.isStreaming = false
    message.reasoning.content = state.finalContent
    delete streamingStates.value[messageKey]
    return
  }

  // 更新内容
  message.reasoning.content += state.tokens[state.currentTokenIndex]
  state.currentTokenIndex++

  // 继续下一个 token
  state.timeoutId = setTimeout(() => {
    streamReasoningToken(messageKey)
  }, 25)
}

// 开始流式更新 reasoning 消息
function startReasoningStream(messageKey: string, fullContent: string) {
  // 清理可能存在的旧状态
  const oldState = streamingStates.value[messageKey]
  if (oldState?.timeoutId) {
    clearTimeout(oldState.timeoutId)
  }

  const message = messages.value.find(m => m.key === messageKey)
  if (!message || !message.reasoning) return

  // 初始化状态
  const tokens = chunkIntoTokens(fullContent)
  streamingStates.value[messageKey] = {
    currentTokenIndex: 0,
    tokens,
    finalContent: fullContent,
  }

  // 重置内容并开始流式更新
  message.reasoning.content = ''
  message.reasoning.isStreaming = true

  // 开始流式更新
  streamReasoningToken(messageKey)
}

// 停止流式更新
function stopReasoningStream(messageKey: string) {
  const state = streamingStates.value[messageKey]
  if (state?.timeoutId) {
    clearTimeout(state.timeoutId)
  }
  delete streamingStates.value[messageKey]

  const message = messages.value.find(m => m.key === messageKey)
  if (message && message.reasoning) {
    message.reasoning.isStreaming = false
  }
}

// 创建 reasoning 消息的辅助函数
function createReasoningMessage(fullContent: string, isStreaming: boolean = true): MessageType {
  const key = nanoid()
  currentReasoningKey.value = key
  
  const message: MessageType = {
    key,
    from: 'assistant',
    reasoning: {
      content: '', // 初始为空，流式更新时填充
      isStreaming,
    },
  }
  
  // 如果 isStreaming 为 true，开始流式更新
  if (isStreaming && fullContent) {
    // 使用 nextTick 确保消息已添加到 messages 数组
    nextTick(() => {
      startReasoningStream(key, fullContent)
    })
  } else {
    // 不流式更新，直接设置内容
    if (message.reasoning) {
      message.reasoning.content = fullContent
    }
  }
  
  return message
}

// 更新 reasoning 消息内容的辅助函数
function updateReasoningContent(content: string, isStreaming: boolean) {
  if (currentReasoningKey.value) {
    const message = messages.value.find(m => m.key === currentReasoningKey.value)
    if (message && message.reasoning) {
      message.reasoning.content = content
      message.reasoning.isStreaming = isStreaming
    }
  }
}

// 完成 reasoning（转换为普通消息或移除）
function completeReasoning(finalContent?: string) {
  if (currentReasoningKey.value) {
    const message = messages.value.find(m => m.key === currentReasoningKey.value)
    if (message && message.reasoning) {
      if (finalContent) {
        // 转换为普通消息
        message.content = finalContent
        delete message.reasoning
      } else {
        // 只更新状态，保留 reasoning 组件但不再流式更新
        message.reasoning.isStreaming = false
      }
      currentReasoningKey.value = null
    }
  }
}

// 创建 WebPreview 消息的辅助函数
function createWebPreviewMessage(url: string, options?: {
  defaultUrl?: string
  logs?: WebPreviewLog[]
  fullscreen?: boolean
}): MessageType {
  return {
    key: nanoid(),
    from: 'assistant',
    webPreview: {
      url,
      defaultUrl: options?.defaultUrl || url,
      logs: options?.logs || [],
      fullscreen: options?.fullscreen || false,
    },
  }
}

// 滚动到底部的函数
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
    }
  })
}

// 监听 messages 变化，自动滚动到底部
watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  }
)

// 监听 messages 中的 reasoning 消息，自动开始流式更新
watch(
  () => messages.value.filter(m => m.reasoning).map(m => ({
    key: m.key,
    isStreaming: m.reasoning?.isStreaming,
    content: m.reasoning?.content,
  })),
  (newReasons, oldReasons) => {
    // 检查新增的或状态改变的 reasoning 消息
    newReasons.forEach((newReason) => {
      if (newReason.isStreaming && newReason.content) {
        const state = streamingStates.value[newReason.key]
        if (!state && newReason.content.length > 0) {
          // 还没有开始流式更新，且内容不为空，开始流式显示
          const fullContent = newReason.content
          // 重置内容为空，然后开始流式更新
          const message = messages.value.find(m => m.key === newReason.key)
          if (message && message.reasoning) {
            message.reasoning.content = ''
            startReasoningStream(newReason.key, fullContent)
          }
        }
      }
    })
  },
  { deep: true }
)

// Socket 连接
const { 
  connect, 
  disconnect, 
  sendUserMessage,
  sendCancelRequest,
  sendTestRequest, 
  onMessage,
  offMessage,
  onGenerateProjectResult, 
  offGenerateProjectResult, 
  onGenerateProjectStart, 
  offGenerateProjectStart, 
  onCodeStream, 
  offCodeStream
} = useVibeCodingSocket()

// 当前代码流的 key
const current_stream_key = ref<string | null>(null)

// 当前请求 ID 和会话 ID
const currentRequestId = ref<string | null>(null)
const currentSessionId = ref<string | null>(null)
const currentCheckpointId = ref<string | null>(null)

// 移除 "Thinking..." 消息的辅助函数
function removeThinkingMessage(key: string | undefined) {
  if (!key) return
  const index = messages.value.findIndex(m => m.key === key)
  if (index !== -1) {
    messages.value.splice(index, 1)
  }
}

// 统一消息处理函数（新的事件系统）
const handleUnifiedMessage = (message: UnifiedMessage) => {
  console.log('📨 Received unified message:', message)
  
  // 更新当前请求和会话 ID
  if (message.requestId) {
    currentRequestId.value = message.requestId
  }
  if (message.sessionId) {
    currentSessionId.value = message.sessionId
  }

  // 统一处理消息类型（不区分大小写，兼容后端可能返回的大小写不一致）
  const messageType = String(message.type || '').toUpperCase()
  
  switch (messageType) {
    
    case SocketMessageType.INTENT_ANALYSIS:
      handleIntentAnalysis(message as any)
      break
    case SocketMessageType.CHAT_RESPONSE:
      handleChatResponse(message as any)
      break
    case SocketMessageType.CODE_GENERATION_START:
      // handleCodeGenerationStart(message as any)
      break
    case SocketMessageType.CODE_STREAM:
      handleCodeStreamMessage(message as any)
      break
    case SocketMessageType.CODE_GENERATION_COMPLETE:
      handleCodeGenerationComplete(message as any)
      break
    case SocketMessageType.ERROR:
      handleErrorMessage(message as any)
      break
    case SocketMessageType.LOG:
      handleLogMessage(message as any)
      break
    case SocketMessageType.CHECKPOINT:
      handleCheckpointMessage(message as any)
      break
    default:
      console.warn('⚠️ Unknown message type:', messageType, message)
      // 对于未知类型，尝试作为普通消息显示
      if (message.requestId) {
        const unknownMessage: MessageType = {
          key: nanoid(),
          from: 'assistant',
          requestId: message.requestId,
          content: `[${messageType}] ${JSON.stringify(message)}`,
        }
        messages.value.push(unknownMessage)
        scrollToBottom()
      }
  }
}

// 处理意图分析消息
const handleIntentAnalysis = (message: any) => {
  // 移除第一个 "Thinking..." 消息
  removeThinkingMessage(thinkingMessageKeys.value.firstThinking)
  thinkingMessageKeys.value.firstThinking = undefined

  // 如果是未知意图，不显示意图分析消息（提升用户体验）
  if (message.intent === UserIntent.UNKNOWN) {
    return
  }

  // 显示意图分析结果
  const intentTextMap: Record<string, string> = {
    [UserIntent.GENERATE_APP]: '🎯 生成应用',
    [UserIntent.MODIFY_APP]: '🔧 修改应用',
    [UserIntent.CHAT]: '💬 普通对话',
    [UserIntent.QUESTION]: '❓ 提问',
  }
  
  const intentText = intentTextMap[message.intent]

  // 如果找不到对应的意图文本，也不显示（避免显示 undefined）
  if (!intentText) {
    return
  }

  const intentMessage: MessageType = {
    key: nanoid(),
    from: 'assistant',
    requestId: message.requestId,
    content: intentText,
  }
  
  messages.value.push(intentMessage)
  scrollToBottom()
}

// 处理对话响应消息（支持流式更新）
const handleChatResponse = (message: any) => {
  if (!message.requestId) {
    console.warn('⚠️ Chat response message missing requestId:', message)
    return
  }

  // 通过 requestId 查找或创建消息
  let chatMessage = messages.value.find(
    m => m.requestId === message.requestId && 
         m.from === 'assistant' && 
         !m.reasoning && 
         !m.webPreview
  )

  if (!chatMessage) {
    // 创建新的对话消息（第一次收到该 requestId 的消息）
    chatMessage = {
      key: nanoid(),
      from: 'assistant',
      requestId: message.requestId,
      content: message.content || '',
    }
    messages.value.push(chatMessage)
  } else {
    // 流式更新：将新的内容追加到现有内容后面（后端是流式输出）
    // message.content 是本次新增的内容片段，不是完整内容
    const newContent = message.content || ''
    chatMessage.content = (chatMessage.content || '') + newContent
  }
  
  // 如果后端返回 isComplete: true 或 is_complete: true，表示对话响应完成，重置状态为 ready
  if (message.isComplete === true || message.is_complete === true) {
    status.value = 'ready'
    console.log('✅ Chat response completed, status reset to ready, requestId:', message.requestId)
  }
  
  scrollToBottom()
}

// 处理代码生成开始消息
const handleCodeGenerationStart = (message: any) => {
  // 移除第二个 "Thinking..." 消息
  removeThinkingMessage(thinkingMessageKeys.value.secondThinking)
  thinkingMessageKeys.value.secondThinking = undefined

  // 添加 reasoning 消息
  const reasoningText = message.message || '正在准备代码生成...'
  const reasoningMessage: MessageType = {
    key: nanoid(),
    from: 'assistant',
    requestId: message.requestId,
    reasoning: {
      content: `✅ 开始分析用户需求\n\n${reasoningText}`,
      isStreaming: false,
    },
  }
  
  messages.value.push(reasoningMessage)
  scrollToBottom()
}

// 处理代码流消息（支持流式更新）
const handleCodeStreamMessage = (message: any) => {
  if (!message.requestId) {
    console.warn('⚠️ Code stream message missing requestId:', message)
    // 如果没有 requestId，使用向后兼容的方式
    handleCodeStream({ content: message.content })
    return
  }

  const newContent = message.content || ''
  
  // 通过 requestId 查找代码消息的索引（只查找包含代码块标记的消息，避免匹配到 checkpointMessage 等其他消息）
  // 代码消息的特征：包含 '```' 标记
  let codeMessageIndex = messages.value.findIndex(
    m => m.requestId === message.requestId && 
         m.from === 'assistant' &&
         !m.reasoning &&
         !m.webPreview &&
         m.content && 
         m.content.includes('```')
  )

  // 如果找不到代码消息，不查找其他类型的消息（如 checkpointMessage），直接创建新的代码消息
  // 这样可以避免将代码内容错误地追加到 checkpointMessage 等其他消息中

  if (codeMessageIndex === -1) {
    // 创建新的代码消息（第一次收到该 requestId 的代码流）
    const newKey = nanoid()
    const codeMessage: MessageType = {
      key: newKey,
      from: 'assistant',
      requestId: message.requestId,
      content: `\`\`\`html\n${newContent}\`\`\``,
    }
    messages.value.push(codeMessage)
    current_stream_key.value = newKey
  } else {
    // 流式更新：将新的内容追加到现有内容后面（后端是流式输出）
    // message.content 是本次新增的内容片段，不是完整内容
    // 使用 splice 替换数组中的对象，确保 Vue 响应式更新
    const existingMessage = messages.value[codeMessageIndex]
    const currentContent = existingMessage.content || ''
    
    let updatedContent: string
    if (!currentContent) {
      // 如果消息存在但没有内容，初始化代码块
      updatedContent = `\`\`\`html\n${newContent}\`\`\``
      // 更新 current_stream_key
      if (existingMessage.key) {
        current_stream_key.value = existingMessage.key
      }
    } else {
      // 移除代码块结束标记，追加新内容，再添加结束标记
      // 保持开始标记不变，只处理结束标记
      const contentWithoutEnd = currentContent.replace(/\n?\`\`\`$/, '') || ''
      updatedContent = contentWithoutEnd + newContent + '\n\`\`\`'
    }

    
    
    // 使用 splice 替换数组中的对象，确保响应式更新
    messages.value.splice(codeMessageIndex, 1, {
      ...existingMessage,
      content: updatedContent,
    })
  }
  
  // 如果后端返回 isComplete: true 或 is_complete: true，表示代码流完成，重置状态为 ready
  // 注意：代码流完成后通常还会收到 CODE_GENERATION_COMPLETE 消息，那里也会重置状态
  // 但为了确保状态及时更新，这里也检查一下
  if (message.isComplete === true || message.is_complete === true) {
    status.value = 'ready'
    console.log('✅ Code stream completed, status reset to ready, requestId:', message.requestId)
  }
  
  scrollToBottom()
}

// 处理代码生成完成消息
const handleCodeGenerationComplete = (message: any) => {
  // 清空代码流的 key
  current_stream_key.value = null
  

  // 移除第二个 "Thinking..." 消息
  removeThinkingMessage(thinkingMessageKeys.value.secondThinking)
  thinkingMessageKeys.value.secondThinking = undefined
  
  if (message.success && message.previewUrl) {
    // 添加成功消息
    const projectName = message.projectName || '未命名项目'
    const previewUrl = message.previewUrl || ''
    const successMessage: MessageType = {
      key: nanoid(),
      from: 'assistant',
      requestId: message.requestId,
      content: `🎉 项目生成成功\n\n项目名称: ${projectName}\n项目预览地址: ${previewUrl}`,
    }
    messages.value.push(successMessage)

    // 创建 WebPreview 消息
    const webPreviewMessage: MessageType = {
      key: nanoid(),
      from: 'assistant',
      requestId: message.requestId,
      webPreview: {
        url: previewUrl,
        defaultUrl: previewUrl,
        fullscreen: false,
      },
    }
    messages.value.push(webPreviewMessage)
  } else {
    
    // 添加失败消息
    const errorMsg = message.message || message.error_details || '未知错误'
    const errorMessage: MessageType = {
      key: nanoid(),
      from: 'assistant',
      requestId: message.requestId,
      content: `❌ 项目生成失败: ${errorMsg}`,
    }
    messages.value.push(errorMessage)
  }

  status.value = 'ready'
  scrollToBottom()
}

// 处理错误消息
const handleErrorMessage = (message: any) => {
  const errorText = message.error || '未知错误'
  const detailsText = message.details || ''
  const errorMessage: MessageType = {
    key: nanoid(),
    from: 'assistant',
    requestId: message.requestId,
    content: `❌ 错误: ${errorText}${detailsText ? '\n' + detailsText : ''}`,
  }
  messages.value.push(errorMessage)
  status.value = 'ready'
  scrollToBottom()
}

// 处理日志消息
const handleLogMessage = (message: any) => {
  const logLevel = message.level || 'info'
  const logText = message.message || ''
  
  // 根据日志级别决定是否显示在界面上
  if (logLevel === 'error') {
    console.error('[Server Log]', logText)
    // 错误日志也显示在界面上
    const logMessage: MessageType = {
      key: nanoid(),
      from: 'assistant',
      requestId: message.requestId,
      content: `⚠️ [${logLevel.toUpperCase()}] ${logText}`,
    }
    messages.value.push(logMessage)
    scrollToBottom()
  } else if (logLevel === 'warn') {
    console.warn('[Server Log]', logText)
  } else {
    console.log('[Server Log]', logText)
  }
}

// 处理检查点消息
const handleCheckpointMessage = (message: any) => {
  
  currentCheckpointId.value = message.checkpointId
  console.log('📌 Checkpoint:', {
    id: message.checkpointId,
    status: message.status,
    progress: message.progress,
  })
  
  // 根据检查点状态更新 UI
  if (message.status === 'completed' || message.status === 'failed') {
    status.value = 'ready'
  }
  
  // 可选：显示检查点信息
  if (message.progress !== undefined) {
    const checkpointStatus = message.status || 'unknown'
    const checkpointProgress = message.progress || 0
    
    // 根据状态选择对应的图标和文本
    const statusMap: Record<string, { icon: string; text: string }> = {
      running: { icon: '🔄', text: '运行中...' },
      completed: { icon: '✅', text: '已完成' },
      failed: { icon: '❌', text: '失败' },
      paused: { icon: '⏸️', text: '已暂停' },
      created:{icon: '🔄', text: '生成中...'}
    }
    
    const statusInfo = statusMap[checkpointStatus] || { icon: '📌', text: '未知状态' }
    const progressText = checkpointProgress > 0 ? `进度: ${checkpointProgress}%` : ''
    const statusText = `任务状态: ${statusInfo.text}`
    
    const checkpointMessage: MessageType = {
      key: nanoid(),
      from: 'assistant',
      requestId: message.requestId,
      content: `${statusInfo.icon} ${statusText}${progressText ? '\n' + progressText : ''}`,
    }
    messages.value.push(checkpointMessage)
    scrollToBottom()
  }
}

// 监听生成项目开始事件（向后兼容）
const handleGenerateProjectStart = (result: {
  message?: string
}) => {
  // 移除第一个 "Thinking..." 消息
  removeThinkingMessage(thinkingMessageKeys.value.firstThinking)
  thinkingMessageKeys.value.firstThinking = undefined

  // 添加第二个 "Thinking..." 消息
  const secondThinkingKey = nanoid()
  thinkingMessageKeys.value.secondThinking = secondThinkingKey
  messages.value.push({
    key: secondThinkingKey,
    from: 'assistant',
     content: '生成中...',
    isThinking: true,
  })

  // 添加 reasoning 消息
  messages.value.push({
    key: nanoid(),
    from: 'assistant',
    reasoning: {
      content: `✅ 开始分析用户需求\n\n${result.message || ''}`,
      isStreaming: true,
    },
  })
}

// 监听代码流事件
const handleCodeStream = (result: {
  content?: string
}) => {
  if (!result.content) return
  
  // 如果是第一次推送，创建新消息
  if (!current_stream_key.value) {
    const key = nanoid()
    const newContent = result.content || ''
    current_stream_key.value = key
    messages.value.push({
      key: current_stream_key.value,
      from: 'assistant',
      content: `\`\`\`html\n${newContent}\`\`\``,
    })
  } else {
    
    // 后续推送，追加内容到现有消息
    messages.value.forEach((item) => {
      if (item.key === current_stream_key.value) {
        const currentContent = item.content || ''
        const newContent = result.content || ''
        
        if (currentContent) {
          // 移除结尾的 ```，追加新内容，再添加 ```
          const contentWithoutEnd = currentContent.replace(/\`\`\`$/, '') || ''
          item.content = contentWithoutEnd + newContent + '\`\`\`'
        } else {
          // 如果内容为空，初始化
          item.content = `\`\`\`html\n${newContent}\`\`\``
        }
      }
    })
  }
}

// 监听生成项目结果
const handleGenerateProjectResult = (result: {
  success: boolean
  project_name?: string
  preview_url?: string
  message?: string
}) => {
  // 清空代码流的 key
  current_stream_key.value = null

  // 移除第二个 "Thinking..." 消息
  removeThinkingMessage(thinkingMessageKeys.value.secondThinking)
  thinkingMessageKeys.value.secondThinking = undefined

  if (result.success && result.preview_url) {
    // 可选：同时添加一个文本消息说明
    messages.value.push({
      key: nanoid(),
      from: 'assistant',
      content: `🎉 项目生成成功
      \n项目名称: ${result.project_name || '未命名项目'}
      \n项目预览地址: ${result.preview_url}`,
      attachments: [],
    })

    // 成功时创建 WebPreview 消息
    const webPreviewMessage = createWebPreviewMessage(result.preview_url, {
      defaultUrl: result.preview_url,
      fullscreen: false,
    })
    messages.value.push(webPreviewMessage)

  } else {
    // 失败时创建普通文本消息
    const errorMessage = `❌ 项目生成失败: ${result.message || '未知错误'}`
    messages.value.push({
      key: nanoid(),
      from: 'assistant',
      content: errorMessage,
      attachments: [],
    })
  }
    status.value = 'ready'
}

// 组件挂载时连接 socket
onMounted(() => {
  connect()
  
  // 监听新的统一消息事件
  onMessage(handleUnifiedMessage)
  
  // 向后兼容的事件监听（保留）
  onGenerateProjectResult(handleGenerateProjectResult)
  onGenerateProjectStart(handleGenerateProjectStart)
  onCodeStream(handleCodeStream)
  
  // 检查是否有需要流式更新的 reasoning 消息
  nextTick(() => {
    messages.value.forEach((message) => {
      if (message.reasoning && message.reasoning.isStreaming && message.reasoning.content) {
        const fullContent = message.reasoning.content
        // 重置内容为空，然后开始流式更新
        message.reasoning.content = ''
        startReasoningStream(message.key, fullContent)
      }
    })
  })
})

// 组件卸载时断开 socket 连接
onBeforeUnmount(() => {
  // 移除新的统一消息事件监听
  offMessage(handleUnifiedMessage)
  
  // 向后兼容的事件监听移除
  offGenerateProjectResult(handleGenerateProjectResult)
  offGenerateProjectStart(handleGenerateProjectStart)
  offCodeStream(handleCodeStream)
  disconnect()
  
  // 清理所有流式更新状态
  Object.values(streamingStates.value).forEach((state) => {
    if (state.timeoutId) {
      clearTimeout(state.timeoutId)
    }
  })
  streamingStates.value = {}
})

function handleSubmit(message: PromptInputMessage) {
  console.log('🔵 handleSubmit called, status:', status.value, 'message text:', message.text?.substring(0, 50))
  
  const hasText = !!message.text
  const hasAttachments = message.files?.length > 0

 
   
  // 如果状态不是 ready，表示用户要中止当前任务
  if(status.value !== 'ready'){
    
    console.log('⚠️ Status is not ready, current status:', status.value, 'User wants to cancel the current request.')
    
    // 发送中止请求
    // 如果 currentRequestId 有值，说明服务端已经开始返回数据，需要带上 requestId
    // 如果 currentRequestId 没有值，说明服务端还没开始返回数据，只需要带上 sessionId
    sendCancelRequest(currentRequestId.value || undefined)
    
    // 重置状态为 ready
    status.value = 'ready'
    
    // 清理当前请求相关的状态
    currentRequestId.value = null
    
    // 停止所有流式更新
    Object.values(streamingStates.value).forEach((state) => {
      if (state.timeoutId) {
        clearTimeout(state.timeoutId)
      }
    })
    streamingStates.value = {}
    
    // 清理 "Thinking..." 消息
    removeThinkingMessage(thinkingMessageKeys.value.firstThinking)
    removeThinkingMessage(thinkingMessageKeys.value.secondThinking)
    thinkingMessageKeys.value = {}
    
    console.log('✅ Cancel request sent, status reset to ready')
    return
  }

   if (!hasText && !hasAttachments) {
    console.log('⚠️ No text or attachments, returning')
    return
  }

  // 清理之前的 "Thinking..." 消息（如果有）
  removeThinkingMessage(thinkingMessageKeys.value.firstThinking)
  removeThinkingMessage(thinkingMessageKeys.value.secondThinking)
  thinkingMessageKeys.value = {}

  // 将消息添加到 messages 数组
  messages.value.push({
    key: nanoid(),
    from: 'user',
    content: message.text,
    attachments: message.files?.map(file => ({
      type: 'file' as const,
      url: file.url || '',
      mediaType: file.mimeType,
      filename: file.name,
    })) || [],
  })

  status.value = 'submitted'

  // eslint-disable-next-line no-console
  console.log('Submitting message:', message)

  // 使用新的 user_message 事件发送消息
  const modelId = selectedModelData.value?.id || 'glm-4.6'
  sendUserMessage(message.text, modelId, currentCheckpointId.value || undefined)

  // 1 秒后添加第一个 "Thinking..." 消息
  setTimeout(() => {
    const firstThinkingKey = nanoid()
    thinkingMessageKeys.value.firstThinking = firstThinkingKey
    const thinkingMessage = {
      key: firstThinkingKey,
      from: 'assistant' as const,
       content: 'Thinking...',
       isThinking: true,
    }
    messages.value.push(thinkingMessage)
    // eslint-disable-next-line no-console
    console.log('Added first thinking message:', thinkingMessage, 'Total messages:', messages.value.length)
  }, 1000)
 
  setTimeout(() => {
    status.value = 'streaming'
  }, SUBMITTING_TIMEOUT)

  // setTimeout(() => {
  //   status.value = 'ready'
  // }, STREAMING_TIMEOUT)
}
</script>

<template>
  <div class="develop-container bg-white">
    <div ref="messagesContainerRef" class="messages-container">
      <div class="flex flex-col gap-4">
        <template v-for="message in messages" :key="message.key">
          <!-- Reasoning 消息 -->
          <Reasoning
            v-if="message.reasoning"
            :is-streaming="message.reasoning.isStreaming"
            class="w-full"
          >
            <ReasoningTrigger />
            <ReasoningContent :content="message.reasoning.content" />
          </Reasoning>

          <!-- WebPreview 消息 -->
          <div
            v-else-if="message.webPreview"
            class="w-full"
          >
            <WebPreview
              :default-url="message.webPreview.defaultUrl || message.webPreview.url"
              :style="{ height: message.webPreview.fullscreen ? '100%' : '400px' }"
              @url-change="(url) => {
                if (message.webPreview) {
                  message.webPreview.url = url
                }
              }"
            >
              <WebPreviewNavigation>
                <WebPreviewNavigationButton
                  tooltip="Go back"
                  @click="() => console.log('Go back', message.key)"
                >
                  <ArrowLeftIcon class="size-4" />
                </WebPreviewNavigationButton>
                <WebPreviewNavigationButton
                  tooltip="Go forward"
                  @click="() => console.log('Go forward', message.key)"
                >
                  <ArrowRightIcon class="size-4" />
                </WebPreviewNavigationButton>
                <WebPreviewNavigationButton
                  tooltip="Reload"
                  @click="() => console.log('Reload', message.key)"
                >
                  <RefreshCcwIcon class="size-4" />
                </WebPreviewNavigationButton>
                <WebPreviewUrl />
                <WebPreviewNavigationButton
                  tooltip="Select"
                  @click="() => console.log('Select', message.key)"
                >
                  <MousePointerClickIcon class="size-4" />
                </WebPreviewNavigationButton>
                <WebPreviewNavigationButton
                  tooltip="Open in new tab"
                  @click="() => {
                    if (message.webPreview?.url) {
                      window.open(message.webPreview.url, '_blank')
                    }
                  }"
                >
                  <ExternalLinkIcon class="size-4" />
                </WebPreviewNavigationButton>
                <WebPreviewNavigationButton
                  tooltip="Maximize"
                  @click="() => {
                    if (message.webPreview) {
                      message.webPreview.fullscreen = !message.webPreview.fullscreen
                    }
                  }"
                >
                  <Maximize2Icon class="size-4" />
                </WebPreviewNavigationButton>
              </WebPreviewNavigation>

              <WebPreviewBody :src="message.webPreview.url" />

              <WebPreviewConsole
                v-if="message.webPreview.logs && message.webPreview.logs.length > 0"
                :logs="message.webPreview.logs"
              />
            </WebPreview>
          </div>

          <!-- 普通消息 -->
          <Message
            v-else
            :from="message.from"
          >
          <!-- Multiple versions with branch selector -->
          <MessageBranch
            v-if="hasMultipleVersions(message)"
            :default-branch="0"
            @branch-change="handleBranchChange"
          >
            <MessageBranchContent>
              <MessageContent
                v-for="version in message.versions"
                :key="version.id"
              >
                <MessageResponse :content="version.content" />
              </MessageContent>
            </MessageBranchContent>

            <MessageToolbar v-if="message.from === 'assistant'">
              <MessageBranchSelector :from="message.from">
                <MessageBranchPrevious />
                <MessageBranchPage />
                <MessageBranchNext />
              </MessageBranchSelector>

              <MessageActions>
                <MessageAction
                  label="Retry"
                  tooltip="Regenerate response"
                  @click="handleRetry"
                >
                  <RefreshCcwIcon class="size-4" />
                </MessageAction>

            <MessageAction
                  label="Like"
                  tooltip="Like this response"
                  @click="toggleLike(message.key)"
                >
                  <ThumbsUpIcon
                    class="size-4"
                    :fill="liked[message.key] ? 'currentColor' : 'none'"
                  />
                </MessageAction> 

                <MessageAction
                  label="Dislike"
                  tooltip="Dislike this response"
                  @click="toggleDislike(message.key)"
                >
                  <ThumbsDownIcon
                    class="size-4"
                    :fill="disliked[message.key] ? 'currentColor' : 'none'"
                  />
                </MessageAction> 

                <MessageAction
                  label="Copy"
                  tooltip="Copy to clipboard"
                  @click="handleCopy(message.versions?.find((v) => v.id)?.content || '')"
                >
                  <CopyIcon class="size-4" />
                </MessageAction>
              </MessageActions>
            </MessageToolbar>
          </MessageBranch>

          <!-- Single version without branch selector -->
          <div v-else>
            <MessageAttachments
              v-if="message.attachments && message.attachments.length > 0"
              class="mb-2"
            >
              <MessageAttachment
                v-for="attachment in message.attachments"
                :key="attachment.url"
                :data="{ ...attachment, mediaType: attachment.mediaType ?? 'application/octet-stream' }"
              />
            </MessageAttachments>

            <MessageContent>
              <template v-if="message.isThinking">
                <div class="text-muted-foreground">
                  <Shimmer class="text-gray">
                    {{ message.content }}
                  </Shimmer>
                </div>
              </template>
              <MessageResponse v-else-if="message.from === 'assistant'" :content="message.content" />
              <template v-else>
                {{ message.content }}
              </template>
            </MessageContent>

            <MessageActions v-if="message.from === 'assistant' && message.versions">
              <MessageAction
                label="Retry"
                tooltip="Regenerate response"
                @click="handleRetry"
              >
                <RefreshCcwIcon class="size-4" />
              </MessageAction>

              <MessageAction
                label="Like"
                tooltip="Like this response"
                @click="toggleLike(message.key)"
              >
                <ThumbsUpIcon
                  class="size-4"
                  :fill="liked[message.key] ? 'currentColor' : 'none'"
                />
              </MessageAction>

              <MessageAction
                label="Dislike"
                tooltip="Dislike this response"
                @click="toggleDislike(message.key)"
              >
                <ThumbsDownIcon
                  class="size-4"
                  :fill="disliked[message.key] ? 'currentColor' : 'none'"
                />
              </MessageAction>

              <MessageAction
                label="Copy"
                tooltip="Copy to clipboard"
                @click="handleCopy(message.content || '')"
              >
                <CopyIcon class="size-4" />
              </MessageAction>
              </MessageActions>
            </div>
          </Message>
        </template>
      </div>
    </div>

    <div class="prompt-input-wrap">
      <PromptInputProvider
        @submit="handleSubmit"
        
      >
      <PromptInput
        multiple
        global-drop class="w-full"
      >
        <!-- <PromptInputAttachments>
          <template #default="{ file }">
            <PromptInputAttachment :file="file" />
          </template>
        </PromptInputAttachments> -->

        <PromptInputBody>
          <PromptInputTextarea />
        </PromptInputBody>

        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <!-- <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent> -->
            </PromptInputActionMenu>

            <!-- <PromptInputSpeechButton /> -->

          

         <ModelSelector v-model:open="modelSelectorOpen">
              <ModelSelectorTrigger as-child>
                <PromptInputButton>
                  <ModelSelectorLogo
                    v-if="selectedModelData?.chefSlug"
                    :provider="selectedModelData.chefSlug"
                  />
                  <ModelSelectorName v-if="selectedModelData?.name">
                    {{ selectedModelData.name }}
                  </ModelSelectorName>
                </PromptInputButton>
              </ModelSelectorTrigger>

              <ModelSelectorContent>
                <Command>
                  <ModelSelectorInput placeholder="Search models..." />
                  <ModelSelectorList>
                    <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>

                    <ModelSelectorGroup
                      v-for="chef in ['OpenAI', 'Anthropic', 'Google']"
                      :key="chef"
                      :heading="chef"
                    >
                      <ModelSelectorItem
                        v-for="m in models.filter((item) => item.chef === chef)"
                        :key="m.id"
                        :value="m.id"
                        :disabled="m.disabled"
                        @select="handlerSelect(m)"
                      >
                        <ModelSelectorLogo :provider="m.chefSlug" />
                        <ModelSelectorName>{{ m.name }}</ModelSelectorName>

                        <ModelSelectorLogoGroup>
                          <ModelSelectorLogo
                            v-for="provider in m.providers"
                            :key="provider"
                            :provider="provider"
                          />
                        </ModelSelectorLogoGroup>

                        <CheckIcon v-if="modelId === m.id" class="ml-auto size-4" />
                        <div v-else class="ml-auto size-4" ></div>
                      </ModelSelectorItem>
                    </ModelSelectorGroup>
                  </ModelSelectorList>
                </Command>
              </ModelSelectorContent>
            </ModelSelector> 
          </PromptInputTools>

          <PromptInputSubmit :status="status" />
        </PromptInputFooter>
      </PromptInput>

      <HeaderControls />
    </PromptInputProvider>
    </div>
  </div>
</template>

<style scoped>
.develop-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  width: 90%;
  padding: 20px 0;
  box-sizing: border-box;
  overflow-y: auto;
}

@media (min-height: 750px) {
  .develop-container {
    overflow-y: hidden;
  }
}

.messages-container {
  flex: 1;
  min-height: 0;
  height: 70vh;
  padding: 0 20px 50px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.prompt-input-wrap {
  width: 100%;
  height: 28vh;
  padding: 20px 20px 0 20px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
  box-sizing: border-box;
}

.prompt-input-wrap:focus-within {
  border-top-color: transparent;
}
</style>

