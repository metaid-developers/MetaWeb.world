import { ref } from 'vue'
import { io, type Socket } from 'socket.io-client'

// 用户意图类型
export enum UserIntent {
  GENERATE_APP = 'GENERATE_APP',
  MODIFY_APP = 'MODIFY_APP',
  CHAT = 'CHAT',
  QUESTION = 'QUESTION',
  UNKNOWN = 'UNKNOWN',
}

// 消息类型
export enum MessageType {
  INTENT_ANALYSIS = 'INTENT_ANALYSIS',
  CHAT_RESPONSE = 'CHAT_RESPONSE',
  CODE_GENERATION_START = 'CODE_GENERATION_START',
  CODE_STREAM = 'CODE_STREAM',
  CODE_GENERATION_COMPLETE = 'CODE_GENERATION_COMPLETE',
  PROJECT_ANALYSIS = 'PROJECT_ANALYSIS',
  ERROR = 'ERROR',
  LOG = 'LOG',
  CHECKPOINT = 'CHECKPOINT',
}

// 基础消息接口
export interface BaseMessage {
  type: MessageType
  timestamp: string
  requestId: string
  sessionId: string
}

// 意图分析消息
export interface IntentAnalysisMessage extends BaseMessage {
  type: MessageType.INTENT_ANALYSIS
  intent: UserIntent
  confidence: number
  reason?: string
  suggestedAction?: string
}

// 对话响应消息
export interface ChatResponseMessage extends BaseMessage {
  type: MessageType.CHAT_RESPONSE
  content: string
  isStreaming?: boolean
  isComplete?: boolean  // 标识对话响应是否完成
}

// 代码生成开始消息
export interface CodeGenerationStartMessage extends BaseMessage {
  type: MessageType.CODE_GENERATION_START
  features?: string[]
  message?: string
}

// 代码流消息
export interface CodeStreamMessage extends BaseMessage {
  type: MessageType.CODE_STREAM
  content: string
  isComplete?: boolean  // 标识代码流是否完成
}

// 代码生成完成消息
export interface CodeGenerationCompleteMessage extends BaseMessage {
  type: MessageType.CODE_GENERATION_COMPLETE
  success: boolean
  project_name?: string
  preview_url?: string
  message?: string
  project_type?: string
  error_details?: string
  suggestion?: string
}

// 错误消息
export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR
  error: string
  details?: string
}

// 日志消息
export interface LogMessage extends BaseMessage {
  type: MessageType.LOG
  level: 'info' | 'warn' | 'error'
  message: string
}

// 检查点消息
export interface CheckpointMessage extends BaseMessage {
  type: MessageType.CHECKPOINT
  checkpointId: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  progress?: number
  data?: any
}

// 统一消息类型
export type UnifiedMessage =
  | IntentAnalysisMessage
  | ChatResponseMessage
  | CodeGenerationStartMessage
  | CodeStreamMessage
  | CodeGenerationCompleteMessage
  | ErrorMessage
  | LogMessage
  | CheckpointMessage

// 用户输入消息（发送给服务器）
export interface UserInputMessage {
  content: string
  model: string
  sessionId: string
  checkpointId?: string
}

// 向后兼容的接口（保留）
interface GenerateProjectRequest {
  description: string
  style_preference?: string
  features?: string[]
  modal?: string
}

interface GenerateProjectResult {
  success: boolean
  project_name?: string
  preview_url?: string
  message?: string
  project_type?: string
  error_details?: string
  suggestion?: string
}

interface GenerateProjectStart {
  message?: string
}

interface CodeStream {
  content?: string
}
//
export function useVibeCodingSocket(serverUrl = import.meta.env.VITE_VIBE_CODE_BASE_URL) {
  
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)

  // 连接 socket
  function connect() {
    if (socket.value?.connected) {
      console.log('Socket already connected')
      return
    }

    console.log(`Connecting to socket server: ${serverUrl}`)

    // 解析 URL，提取基础路径
    const url = new URL(serverUrl)
    const basePath = url.pathname // 例如: '/vide-coding' 或 '/'
    
    // 构建 Socket.IO 路径
    // 如果 basePath 是根路径 '/'，使用默认的 '/socket.io/'
    // 如果有子路径（如 '/vide-coding'），使用 '/vide-coding/socket.io/'
    const socketPath = basePath === '/' || basePath === '' 
      ? '/socket.io/' 
      : `${basePath}/socket.io/`
    
    // 使用域名根路径作为连接地址
    const actualServerUrl = `${url.protocol}//${url.host}`

    console.log(`=== Socket.IO 连接配置 ===`)
    console.log(`原始 serverUrl: ${serverUrl}`)
    console.log(`实际连接地址: ${actualServerUrl}`)
    console.log(`Socket.IO 路径: ${socketPath}`)
    console.log(`完整连接 URL: ${actualServerUrl}${socketPath}`)
    console.log(`========================`)

    socket.value = io(actualServerUrl, {
      path: socketPath, // 指定 Socket.IO 的路径
      // 先尝试 polling，成功后再升级到 websocket（更稳定，适合通过反向代理）
      // 这样可以避免直接 WebSocket 连接失败的问题
      transports: ['polling', 'websocket'],
      // 允许自动从 polling 升级到 websocket
      upgrade: true,
      // 记住升级状态，下次直接使用 websocket
      rememberUpgrade: true,
      // 连接选项
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      // 增加超时时间
      timeout: 20000,
      // 强制新连接（避免复用旧连接）
      forceNew: false,
      // 自动连接
      autoConnect: true,
      // 添加额外的选项以支持反向代理
      withCredentials: false,
    })

    // 连接成功
    socket.value.on('connect', () => {
      isConnected.value = true
      console.log(`✅ Socket connected! ID: ${socket.value?.id}`)
      console.log(`传输方式: ${socket.value.io.engine.transport.name}`)
    })

    // 监听传输方式升级
    socket.value.io.on('upgrade', () => {
      console.log(`🔄 传输方式已升级到: ${socket.value?.io.engine.transport.name}`)
    })

    // 监听传输方式错误
    socket.value.io.on('upgradeError', (error) => {
      console.warn('⚠️ 传输方式升级失败，继续使用 polling:', error)
    })

    // 连接失败
    socket.value.on('connect_error', (error) => {
      console.error('=== Socket 连接错误详情 ===')
      console.error('错误消息:', error.message)
      console.error('错误类型:', error?.type)
      console.error('错误描述:', error?.description)
      console.error('连接地址:', actualServerUrl)
      console.error('Socket.IO 路径:', socketPath)
      console.error('完整连接 URL:', `${actualServerUrl}${socketPath}`)
      console.error('========================')
      isConnected.value = false
    })

    // 断开连接
    socket.value.on('disconnect', (reason) => {
      isConnected.value = false
      console.log('Socket disconnected:', reason)
    })

    // 重新连接
    socket.value.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected (attempt: ${attemptNumber})`)
      isConnected.value = true
    })

    // 重新连接尝试
    socket.value.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Attempting to reconnect (${attemptNumber}/5)...`)
    })

    // 重新连接失败
    socket.value.on('reconnect_failed', () => {
      console.error('Socket reconnection failed')
    })
  }

  // 断开连接
  function disconnect() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
      console.log('Socket disconnected manually')
    }
  }

  // 发送用户消息（新的事件系统）
  function sendUserMessage(
    content: string,
    model: string = 'glm-4.6',
    checkpointId?: string
  ) {
    if (!socket.value || !isConnected.value) {
      console.error('Socket is not connected')
      return
    }

    const sessionId = socket.value.id || 'unknown'
    const messageData: UserInputMessage = {
      content,
      model,
      sessionId,
      ...(checkpointId && { checkpointId }),
    }

    console.log('Sending user_message:', messageData)
    socket.value.emit('user_message', messageData)
  }

  // 发送中止请求事件
  function sendCancelRequest(requestId?: string) {
    
    if (!socket.value || !isConnected.value) {
      console.error('Socket is not connected')
      return
    }

    const sessionId = socket.value.id || 'unknown'
    const cancelData: {
      sessionId: string
      requestId?: string
    } = {
      sessionId,
      ...(requestId && { requestId }),
    }

    console.log('Sending cancel_request:', cancelData)
    socket.value.emit('cancel_request', cancelData)
  }

  // 发送测试请求（向后兼容，内部转换为新格式）
  function sendTestRequest(
    description: string,
    stylePreference?: string,
    features?: string[],
    modal: string = 'glm-4.6'
  ) {
    // 使用新的 user_message 事件
    sendUserMessage(description, modal)
  }

  // 监听统一消息事件（新的事件系统）
  function onMessage(callback: (message: UnifiedMessage) => void) {
    if (!socket.value) {
      console.error('Socket is not initialized')
      return
    }

    socket.value.on('message', callback)
  }

  // 移除统一消息事件监听
  function offMessage(callback: (message: UnifiedMessage) => void) {
    if (socket.value) {
      socket.value.off('message', callback)
    }
  }

  // 向后兼容的事件监听（保留）
  // 监听生成项目结果
  function onGenerateProjectResult(
    callback: (result: GenerateProjectResult) => void
  ) {
    if (!socket.value) {
      console.error('Socket is not initialized')
      return
    }

    socket.value.on('generate_project_result', callback)
  }

  // 移除事件监听
  function offGenerateProjectResult(
    callback: (result: GenerateProjectResult) => void
  ) {
    if (socket.value) {
      socket.value.off('generate_project_result', callback)
    }
  }

  // 监听生成项目开始事件
  function onGenerateProjectStart(
    callback: (result: GenerateProjectStart) => void
  ) {
    if (!socket.value) {
      console.error('Socket is not initialized')
      return
    }

    socket.value.on('generate_project_start', callback)
  }

  // 移除生成项目开始事件监听
  function offGenerateProjectStart(
    callback: (result: GenerateProjectStart) => void
  ) {
    if (socket.value) {
      socket.value.off('generate_project_start', callback)
    }
  }

  // 监听代码流事件
  function onCodeStream(
    callback: (result: CodeStream) => void
  ) {
    if (!socket.value) {
      console.error('Socket is not initialized')
      return
    }

    socket.value.on('code_stream', callback)
  }

  // 移除代码流事件监听
  function offCodeStream(
    callback: (result: CodeStream) => void
  ) {
    if (socket.value) {
      socket.value.off('code_stream', callback)
    }
  }

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    // 新的事件系统
    sendUserMessage,
    sendCancelRequest,
    onMessage,
    offMessage,
    // 向后兼容的方法
    sendTestRequest,
    onGenerateProjectResult,
    offGenerateProjectResult,
    onGenerateProjectStart,
    offGenerateProjectStart,
    onCodeStream,
    offCodeStream,
  }
}

