import { HttpRequest } from '@/utils/http'

const META_APP_BASE_URL = import.meta.env.VITE_META_APP_API || 'https://www.metaweb.world/meta-app'


const metaAppApiInstance = new HttpRequest(META_APP_BASE_URL, {
 	
  responseHandler: (response) => {
    return new Promise((resolve, reject) => {
      const { data } = response

     
      if (data && typeof data.code === 'number') {
        if (data.code === 0 || data.code === 200) {
        
          resolve(data.data)
        } else {
         
          reject({
            code: data.code,
            data: data.data,
            message: data.message,
          })
        }
      } else {
      
        resolve(data.data || data)
      }
    })
  },
})


const metaAppApi = {
  get: metaAppApiInstance.get.bind(metaAppApiInstance),
  post: metaAppApiInstance.post.bind(metaAppApiInstance),
  put: metaAppApiInstance.put.bind(metaAppApiInstance),
  delete: metaAppApiInstance.delete.bind(metaAppApiInstance),
}


// ==================== 类型定义 ====================

/**
 * 配置响应
 */
export interface ConfigResponse {
  metafs_domain: string
}

/**
 * 部署队列响应
 */
export interface DeployQueueResponse {
  code: string
  content: string
  content_type: string
  created_at: string
  first_pin_id: string
  pin_id: string
  timestamp: number
  try_count: number
  version: string
}

/**
 * 部署队列列表响应
 */
export interface DeployQueueListResponse {
  has_more: boolean
  next_cursor: number
  queues: DeployQueueResponse[]
}

/**
 * MetaApp 部署文件内容
 */
export interface MetaAppDeployFileContent {
  code: string
  content: string
  content_type: string
  created_at: string
  deploy_file_path: string
  deploy_message: string
  deploy_status: 'pending' | 'processing' | 'completed' | 'failed'
  first_pin_id: string
  pin_id: string
  updated_at: string
  version: string
}

/**
 * MetaApp 响应
 */
export interface MetaAppResponse {
  app_name: string
  block_height: number
  chain_name: string
  code: string
  content: string
  content_hash: string
  content_type: string
  cover_img: string
  created_at: string
  creator_address: string
  creator_meta_id: string
  deploy_info: MetaAppDeployFileContent
  disabled: boolean
  first_pin_id: string
  icon: string
  index_file: string
  intro: string
  intro_imgs: string[]
  metadata: string
  operation: 'create' | 'modify' | 'revoke'
  owner_address: string
  owner_meta_id: string
  parent_path: string
  path: string
  pin_id: string
  prompt: string
  runtime: string
  state: number
  status: number
  timestamp: number
  title: string
  tx_id: string
  updated_at: string
  version: string
  vout: number
}

/**
 * MetaApp 列表响应
 */
export interface MetaAppListResponse {
  apps: MetaAppResponse[]
  has_more: boolean
  next_cursor: number
}

/**
 * MetaApp 历史响应
 */
export interface MetaAppHistoryResponse {
  history: MetaAppResponse[]
}

/**
 * 索引器统计响应
 */
export interface IndexerStatsResponse {
  total_apps: number
}

/**
 * 索引器同步状态响应
 */
export interface IndexerSyncStatusResponse {
  chain_name: string
  created_at: string
  current_sync_height: number
  latest_block_height: number
  updated_at: string
}

// ==================== API 参数类型定义 ====================

export interface GetConfigParams {
  // 无需参数
}

export interface GetDeployQueueListParams {
  cursor?: number
  size?: number
}

export interface GetMetaAppListParams {
  cursor?: number
  size?: number
}

export interface GetMetaAppListByCreatorParams {
  metaId: string
  cursor?: number
  size?: number
}

export interface GetMetaAppByFirstPinIdParams {
  firstPinId: string
}

export interface DownloadMetaAppParams {
  firstPinId: string
}

export interface GetMetaAppHistoryParams {
  firstPinId: string
}

export interface GetMetaAppByPinIdParams {
  pinId: string
}

export interface RedeployMetaAppParams {
  pinId: string
}

export interface GetStatsParams {
  // 无需参数
}

export interface GetStatusParams {
  // 无需参数
}

// ==================== API 方法 ====================

/**
 * 1. 获取配置信息
 */
export const getConfig = async (
  params: GetConfigParams = {}
): Promise<ConfigResponse> => {
  return metaAppApi.get('/api/v1/config')
}

/**
 * 2. 获取部署队列列表
 */
export const getDeployQueueList = async (
  params: GetDeployQueueListParams = {}
): Promise<DeployQueueListResponse> => {
  const { cursor = 0, size = 20 } = params
  const query = new URLSearchParams({
    cursor: cursor.toString(),
    size: size.toString()
  }).toString()
  return metaAppApi.get(`/api/v1/deploy-queue?${query}`)
}

/**
 * 3. 获取 MetaApp 列表
 */
export const getMetaAppList = async (
  params: GetMetaAppListParams = {}
): Promise<MetaAppListResponse> => {
  const { cursor = 0, size = 20 } = params
  const query = new URLSearchParams({
    cursor: cursor.toString(),
    size: size.toString()
  }).toString()
  return metaAppApi.get(`/api/v1/metaapps?${query}`)
}

/**
 * 4. 根据创建者 MetaID 获取 MetaApp 列表
 */
export const getMetaAppListByCreator = async (
  params: GetMetaAppListByCreatorParams
): Promise<MetaAppListResponse> => {
  const { metaId, cursor = 0, size = 20 } = params
  const query = new URLSearchParams({
    cursor: cursor.toString(),
    size: size.toString()
  }).toString()
  return metaAppApi.get(`/api/v1/metaapps/creator/${metaId}?${query}`)
}

/**
 * 5. 根据 FirstPinID 获取最新的 MetaApp 详情
 */
export const getMetaAppByFirstPinId = async (
  params: GetMetaAppByFirstPinIdParams
): Promise<MetaAppResponse> => {
  const { firstPinId } = params
  return metaAppApi.get(`/api/v1/metaapps/first/${firstPinId}`)
}

/**
 * 6. 下载 MetaApp 部署文件为 zip
 */
export const downloadMetaApp = async (
  params: DownloadMetaAppParams
): Promise<Blob> => {
  const { firstPinId } = params
  return metaAppApi.get(`/api/v1/metaapps/first/${firstPinId}/download`, undefined, { responseType: 'blob' })
}

/**
 * 7. 根据 FirstPinID 获取 MetaApp 历史版本列表
 */
export const getMetaAppHistory = async (
  params: GetMetaAppHistoryParams
): Promise<MetaAppHistoryResponse> => {
  const { firstPinId } = params
  return metaAppApi.get(`/api/v1/metaapps/first/${firstPinId}/history`)
}

/**
 * 8. 根据 PinID 获取 MetaApp 详情
 */
export const getMetaAppByPinId = async (
  params: GetMetaAppByPinIdParams
): Promise<MetaAppResponse> => {
  const { pinId } = params
  return metaAppApi.get(`/api/v1/metaapps/${pinId}`)
}

/**
 * 9. 重新部署 MetaApp
 */
export const redeployMetaApp = async (
  params: RedeployMetaAppParams
): Promise<void> => {
  const { pinId } = params
  return metaAppApi.post(`/api/v1/metaapps/${pinId}/redeploy`)
}

/**
 * 10. 获取统计信息
 */
export const getStats = async (
  params: GetStatsParams = {}
): Promise<IndexerStatsResponse> => {
  return metaAppApi.get('/api/v1/stats')
}

/**
 * 11. 获取同步状态
 */
export const getStatus = async (
  params: GetStatusParams = {}
): Promise<IndexerSyncStatusResponse> => {
  return metaAppApi.get('/api/v1/status')
}

