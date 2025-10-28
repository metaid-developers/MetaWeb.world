<template>
  <div class="protocol-detail-view">
    <div class="detail-container">
      <!-- 面包屑导航 -->
      <nav class="breadcrumb">
        <router-link to="/metaprotocol" class="breadcrumb-link">协议广场</router-link>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">协议详情</span>
      </nav>

      <!-- Body Box - 主要内容区域 -->
      <div class="body-box">
        <!-- 协议头部 -->
        <div class="protocol-header">
          <h1 class="protocol-title">{{ protocolName }}: {{ protocolTitle }}</h1>
          <div class="protocol-meta">
            <span class="meta-item">
              <svg class="meta-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>创建者: {{ protocolAuthor }}</span>
            </span>
            <span class="meta-item">
              <svg class="meta-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>创建时间: {{formatDateTime(protocolDetail?.timestamp)  }}</span>
            </span>
          </div>
        </div>

        <!-- 协议描述 -->
        <div class="protocol-section">
          <h2 class="section-title">协议描述</h2>
          <div class="section-content">
            <p class="description-text">{{ protocolDescription }}</p>
          </div>
        </div>

        <!-- 协议内容 -->
        <div class="protocol-section">
          <h2 class="section-title">协议内容</h2>
          <div class="section-content">
            <div class="code-block">
              <pre><code>{{ protocolContent }}</code></pre>
            </div>
          </div>
        </div>

        <!-- 协议信息 -->
        <div class="protocol-section">
          <h2 class="section-title">协议信息</h2>
          <div class="section-content">
            <div class="info-grid">

                <div class="info-item">
                <span class="info-label">协议名:</span>
                <span class="info-value">{{ protocolName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Path:</span>
                <span class="info-value">{{ protocolPath }}</span>
              </div>


              <div class="info-item">
              
                <span class="info-label">协议 ID:</span>
                <span class="info-value">{{ protocolDetail?.id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">版本:</span>
                <span class="info-value">{{ protocolVersion }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">类型:</span>
                <span class="info-value">{{ protocolContentType }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">编码:</span>
                <span class="info-value">UTF-8</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 互动区域 -->
        <div class="protocol-section">
          <h2 class="section-title">互动</h2>
          <div class="section-content">
            <!-- 点赞区域 -->
            <div class="like-section">
              <button 
                class="like-btn"
                :class="{ 'liked': isLiked }"
                @click="handleLike"
                :disabled="isLiking"
              >
                <svg class="heart-icon" :class="{ 'liked': isLiked }" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="like-text">{{ isLiked ? '已点赞' : '点赞' }}</span>
                <span class="like-count">{{ likeCount }}</span>
              </button>
            </div>

            <!-- 评论区域 -->
            <div class="comment-section">
              <h3 class="comment-title">评论 ({{ comments.length }})</h3>
              
              <!-- 评论输入框 -->
              <div class="comment-input">
                <textarea
                  v-model="newComment"
                  placeholder="写下你的评论..."
                  class="comment-textarea"
                  rows="3"
                  @keydown.ctrl.enter="submitComment"
                ></textarea>
                <div class="comment-actions">
                  <button 
                    class="comment-submit-btn"
                    @click="submitComment"
                    :disabled="!newComment.trim() || isSubmittingComment"
                  >
                    {{ isSubmittingComment ? '发布中...' : '发布评论' }}
                  </button>
                </div>
              </div>

              <!-- 评论列表 -->
              <div class="comments-list" v-if="comments.length > 0">
                <div 
                  v-for="comment in comments" 
                  :key="comment.id"
                  class="comment-item"
                >
                  <div class="comment-header">
                    <div class="comment-author">
                      <div class="author-avatar">
                        {{ comment.author.slice(0, 2).toUpperCase() }}
                      </div>
                      <div class="author-info">
                        <span class="author-name">{{ comment.author }}</span>
                        <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                      </div>
                    </div>
                    <button 
                      class="reply-btn"
                      @click="toggleReply(comment.id)"
                    >
                      回复
                    </button>
                  </div>
                  
                  <div class="comment-content">
                    <p>{{ comment.content }}</p>
                  </div>

                  <!-- 回复输入框 -->
                  <div v-if="comment.showReply" class="reply-input">
                    <textarea
                      v-model="comment.replyText"
                      placeholder="写下你的回复..."
                      class="reply-textarea"
                      rows="2"
                    ></textarea>
                    <div class="reply-actions">
                      <button 
                        class="reply-submit-btn"
                        @click="submitReply(comment)"
                        :disabled="!comment.replyText.trim() || isSubmittingReply"
                      >
                        {{ isSubmittingReply ? '回复中...' : '回复' }}
                      </button>
                      <button 
                        class="reply-cancel-btn"
                        @click="cancelReply(comment.id)"
                      >
                        取消
                      </button>
                    </div>
                  </div>

                  <!-- 回复列表 -->
                  <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                    <div 
                      v-for="reply in comment.replies" 
                      :key="reply.id"
                      class="reply-item"
                    >
                      <div class="reply-header">
                        <div class="reply-author">
                          <div class="author-avatar small">
                            {{ reply.author.slice(0, 2).toUpperCase() }}
                          </div>
                          <div class="author-info">
                            <span class="author-name">{{ reply.author }}</span>
                            <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="reply-content">
                        <p>{{ reply.content }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-else class="empty-comments flex items-center justify-center">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p>还没有评论，来发表第一条评论吧！</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCreateProtocols } from '@/hooks/use-create-protocols'
import { useToast } from '@/components/Toast/useToast'
import { type PinDetail, getPinDetail } from '@/api/ManV2'
import { formatDateTime } from "@/utils/format";
// 接口定义
interface Comment {
  id: string
  author: string
  content: string
  createdAt: Date
  replies?: Reply[]
  showReply?: boolean
  replyText?: string
}

interface Reply {
  id: string
  author: string
  content: string
  createdAt: Date
  parentId: string
}

const route = useRoute()
const { createPayLike, createPayComment } = useCreateProtocols()
const { showToast } = useToast()

// 协议基本信息
const protocolId = ref('')
const protocolTitle = ref('')
const protocolDescription = ref('')
const protocolContentType=ref('')
const protocolVersion=ref('')
const protocolAuthor=ref('')
const protocolName=ref('')
const protocolPath=ref('')
const protocolDetail:Ref<PinDetail>=ref()

const protocolContent = ref()

// 点赞相关状态
const isLiked = ref(false)
const likeCount = ref(0)
const isLiking = ref(false)

// 评论相关状态
const newComment = ref('')
const isSubmittingComment = ref(false)
const isSubmittingReply = ref(false)
const comments = ref<Comment[]>([
  
])

// 点赞处理
const handleLike = async () => {

  return showToast('功能开发中，敬请期待', 'info')
  
  if (isLiking.value) return
  
  try {
    isLiking.value = true
    
    const metaidData = {
      path: '/protocols/paylike',
      body: {
        isLike: '1',
        likeTo: protocolId.value
      },
      contentType: 'application/json',
      encoding: 'utf-8' as const,
      version: '1.0.0',
      operation: 'create' as const
    }
    
    const result = await createPayLike(metaidData)
    
    if (result) {
      isLiked.value = !isLiked.value
      likeCount.value += isLiked.value ? 1 : -1
      showToast(isLiked.value ? '点赞成功！' : '取消点赞', 'success')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    showToast('点赞失败，请重试', 'error')
  } finally {
    isLiking.value = false
  }
}

// 提交评论
const submitComment = async () => {
  return showToast('功能开发中，敬请期待', 'info')
  if (!newComment.value.trim() || isSubmittingComment.value) return
  
  try {
    isSubmittingComment.value = true
    
    const metaidData = {
      path: '/protocols/paycomment',
      body: {
            content:newComment.value.trim(), //评论内容
            contentType:'text/plain', 
            commentTo:protocolId.value
      },
      contentType: 'application/json',
      encoding: 'utf-8' as const,
      version: '1.0.0',
      operation: 'create' as const
    }
    
    const result = await createPayComment(metaidData)
    
    if (result) {
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        author: 'Current User', // 这里应该从用户状态获取
        content: newComment.value.trim(),
        createdAt: new Date(),
        replies: []
      }
      
      comments.value.unshift(newCommentObj)
      newComment.value = ''
      showToast('评论发布成功！', 'success')
    }
  } catch (error) {
    console.error('评论发布失败:', error)
    showToast('评论发布失败，请重试', 'error')
  } finally {
    isSubmittingComment.value = false
  }
}

// 切换回复输入框
const toggleReply = (commentId: string) => {
  const comment = comments.value.find(c => c.id === commentId)
  if (comment) {
    comment.showReply = !comment.showReply
    if (!comment.showReply) {
      comment.replyText = ''
    }
  }
}

// 提交回复
const submitReply = async (comment: Comment) => {
  if (!comment.replyText?.trim() || isSubmittingReply.value) return
  
  try {
    isSubmittingReply.value = true
    
    const metaidData = {
      path: '/protocols/paycomment',
      body: {
        
        commentTo:protocolId.value,
        content: comment.replyText.trim(),
        contentType:'text/plain', 
        
      },
      contentType: 'application/json',
      encoding: 'utf-8' as const,
      version: '1.0.0',
      operation: 'create' as const
    }
    
    const result = await createPayComment(metaidData)
    
    if (result) {
      const newReply: Reply = {
        id: `${comment.id}-${Date.now()}`,
        author: 'Current User', // 这里应该从用户状态获取
        content: comment.replyText.trim(),
        createdAt: new Date(),
        parentId: comment.id
      }
      
      if (!comment.replies) {
        comment.replies = []
      }
      comment.replies.push(newReply)
      comment.replyText = ''
      comment.showReply = false
      showToast('回复发布成功！', 'success')
    }
  } catch (error) {
    console.error('回复发布失败:', error)
    showToast('回复发布失败，请重试', 'error')
  } finally {
    isSubmittingReply.value = false
  }
}

// 取消回复
const cancelReply = (commentId: string) => {
  const comment = comments.value.find(c => c.id === commentId)
  if (comment) {
    comment.showReply = false
    comment.replyText = ''
  }
}

// 格式化时间
const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN')
}

onMounted(async () => {
  protocolId.value = route.params.id as string

  // 获取协议详情
  try {
    const detail = await getPinDetail({
      numberOrId: protocolId.value
    })

    if (detail) {
      protocolDetail.value = detail

      // 解析contentSummary获取标题和描述
      try {
        let contentSummary: any = {}
        if (detail.contentSummary) {
          if (typeof detail.contentSummary === 'object') {
            contentSummary = detail.contentSummary
          } else if (typeof detail.contentSummary === 'string') {
            contentSummary = JSON.parse(detail.contentSummary)
          }
        }
        protocolContent.value=contentSummary?.protocolContent
        protocolDescription.value=contentSummary?.intro
        protocolTitle.value=contentSummary?.title
        protocolContentType.value=contentSummary?.protocolContentType
        protocolVersion.value=contentSummary?.version
        protocolAuthor.value=contentSummary?.authors
        protocolName.value=contentSummary?.protocolName
        protocolPath.value=contentSummary?.path
      } catch (e) {
        console.error('解析contentSummary失败:', e)
      
      }

    }
  } catch (error) {
    console.error('获取协议详情失败:', error)
    showToast('获取协议详情失败', 'error')
  }
})
</script>

<style lang="scss" scoped>
.protocol-detail-view {
  background: #f9fafb;
  min-height: calc(100vh - 200px);
  padding: 30px 0;

  @media (max-width: 768px) {
    padding: 20px 0;
  }

  @media (max-width: 480px) {
    padding: 16px 0;
  }
}

.detail-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;

  @media (max-width: 480px) {
    padding: 0 16px;
  }
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
    margin-bottom: 16px;
  }
}

.breadcrumb-link {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: #111827;
  }
}

.breadcrumb-separator {
  color: #d1d5db;
}

.breadcrumb-current {
  color: #111827;
  font-weight: 500;
}

.body-box {
  background: #ffffff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 30px;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    padding: 20px;
    border-radius: 8px;
  }
}

.protocol-header {
  padding-bottom: 24px;
  border-bottom: 2px solid #f3f4f6;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    padding-bottom: 20px;
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    padding-bottom: 16px;
    margin-bottom: 20px;
  }
}

.protocol-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 16px 0;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 24px;
    margin-bottom: 12px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
    margin-bottom: 10px;
  }
}

.protocol-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  color: #6b7280;
  font-size: 14px;

  @media (max-width: 480px) {
    gap: 16px;
    font-size: 13px;
  }
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 14px;
    height: 14px;
  }
}

.protocol-section {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    margin-bottom: 20px;
  }
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 12px;
    padding-bottom: 10px;
  }

  @media (max-width: 480px) {
    font-size: 16px;
    margin-bottom: 10px;
    padding-bottom: 8px;
  }
}

.section-content {
  color: #374151;
  line-height: 1.7;
}

.description-text {
  font-size: 15px;
  margin: 0;
  white-space: pre-wrap;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
    line-height: 1.6;
  }
}

.code-block {
  background: #1e293b;
  border-radius: 8px;
  padding: 20px;
  overflow-x: auto;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }

  pre {
    margin: 0;
    color: #e2e8f0;
    font-size: 14px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    line-height: 1.6;

    @media (max-width: 768px) {
      font-size: 13px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
      line-height: 1.5;
    }

    code {
      display: block;
      white-space: pre;
    }
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.info-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;

  @media (max-width: 480px) {
    padding: 10px;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

.info-label {
  font-weight: 600;
  color: #6b7280;
  margin-right: 8px;
  font-size: 14px;
  min-width: 80px;

  @media (max-width: 480px) {
    font-size: 13px;
    margin-right: 0;
    min-width: auto;
  }
}

.info-value {
  color: #111827;
  font-size: 14px;
  word-break: break-all;

  @media (max-width: 480px) {
    font-size: 13px;
  }
}

// 点赞区域样式
.like-section {
  margin-bottom: 32px;
  padding: 20px 0;
  border-bottom: 1px solid #e5e7eb;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  
  &:hover {
    border-color: #3b82f6;
    background: #f8faff;
    
    .heart-icon:not(.liked) {
      color: #3b82f6;
      transform: scale(1.05);
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.liked {
    border-color: #ef4444;
    background: #fef2f2;
    color: #ef4444;
    
    .heart-icon {
      color: #ef4444;
      fill: #ef4444;
    }
  }
}

.heart-icon {
  color: #6b7280;
  transition: all 0.3s ease;
  
  &.liked {
    color: #ef4444;
    fill: #ef4444;
    transform: scale(1.1);
  }
}

.like-text {
  color: inherit;
}

.like-count {
  background: #f3f4f6;
  color: #6b7280;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

// 评论区域样式
.comment-section {
  .comment-title {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 20px 0;
  }
}

.comment-input {
  margin-bottom: 32px;
  
  .comment-textarea {
    width: 100%;
    padding: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.5;
    resize: vertical;
    min-height: 80px;
    transition: border-color 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
    
    &::placeholder {
      color: #9ca3af;
    }
  }
  
  .comment-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
  
  .comment-submit-btn {
    padding: 10px 20px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

// 评论列表样式
.comments-list {
  .comment-item {
    padding: 20px 0;
    border-bottom: 1px solid #f3f4f6;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .comment-author {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .author-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    
    &.small {
      width: 32px;
      height: 32px;
      font-size: 12px;
    }
  }
  
  .author-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .author-name {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }
  
  .comment-time,
  .reply-time {
    font-size: 12px;
    color: #6b7280;
  }
  
  .reply-btn {
    padding: 6px 12px;
    background: #f3f4f6;
    color: #6b7280;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: #e5e7eb;
      color: #374151;
    }
  }
  
  .comment-content {
    margin-bottom: 16px;
    
    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: #374151;
    }
  }
}

// 回复输入框样式
.reply-input {
  margin-left: 52px;
  margin-bottom: 16px;
  
  .reply-textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.5;
    resize: vertical;
    min-height: 60px;
    transition: border-color 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
    
    &::placeholder {
      color: #9ca3af;
    }
  }
  
  .reply-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  
  .reply-submit-btn {
    padding: 6px 12px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .reply-cancel-btn {
    padding: 6px 12px;
    background: #f3f4f6;
    color: #6b7280;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: #e5e7eb;
      color: #374151;
    }
  }
}

// 回复列表样式
.replies-list {
  margin-left: 52px;
  margin-top: 16px;
  
  .reply-item {
    padding: 12px 0;
    border-bottom: 1px solid #f9fafb;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .reply-header {
    margin-bottom: 8px;
  }
  
  .reply-author {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .reply-content {
    p {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      color: #4b5563;
    }
  }
}

// 空状态样式
.empty-comments {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  
  svg {
    margin-right: 5px;
    //margin-bottom: 16px;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .like-section {
    margin-bottom: 24px;
    padding: 16px 0;
  }
  
  .like-btn {
    padding: 10px 16px;
    font-size: 13px;
  }
  
  .comment-section {
    .comment-title {
      font-size: 16px;
      margin-bottom: 16px;
    }
  }
  
  .comment-input {
    margin-bottom: 24px;
    
    .comment-textarea {
      padding: 12px;
      font-size: 13px;
    }
    
    .comment-submit-btn {
      padding: 8px 16px;
      font-size: 13px;
    }
  }
  
  .comments-list {
    .comment-item {
      padding: 16px 0;
    }
    
    .comment-author {
      gap: 10px;
    }
    
    .author-avatar {
      width: 36px;
      height: 36px;
      font-size: 13px;
      
      &.small {
        width: 28px;
        height: 28px;
        font-size: 11px;
      }
    }
    
    .author-name {
      font-size: 13px;
    }
    
    .comment-time,
    .reply-time {
      font-size: 11px;
    }
    
    .comment-content p {
      font-size: 13px;
    }
  }
  
  .reply-input {
    margin-left: 46px;
    
    .reply-textarea {
      padding: 10px;
      font-size: 12px;
    }
    
    .reply-submit-btn,
    .reply-cancel-btn {
      padding: 5px 10px;
      font-size: 11px;
    }
  }
  
  .replies-list {
    margin-left: 46px;
    
    .reply-content p {
      font-size: 12px;
    }
  }
}

@media (max-width: 480px) {
  .reply-input {
    margin-left: 0;
  }
  
  .replies-list {
    margin-left: 0;
  }
}
</style>
