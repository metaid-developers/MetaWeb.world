// 格式化工具函数

/**
 * 格式化地址（显示前 N 位和后 M 位）
 */
export function formatAddress(address: string, prefix = 6, suffix = 4): string {
  if (!address || address.length <= prefix + suffix) {
    return address
  }
  return `${address.slice(0, prefix)}...${address.slice(-suffix)}`
}

/**
 * 格式化余额（satoshis 转 BTC）
 */
export function formatBalance(satoshis: number, decimals = 8): string {
  return (satoshis / 100000000).toFixed(decimals)
}

/**
 * 规范化时间戳为13位（毫秒级）
 * @param timestamp - 输入的时间戳
 * @returns 13位毫秒级时间戳
 */
function normalizeTimestamp(timestamp: number): number {
  const timestampStr = String(timestamp)
  const length = timestampStr.length

  if (length < 13) {
    // 不足13位，后面补0
    return Number(timestampStr.padEnd(13, '0'))
  } else if (length > 13) {
    // 超过13位，截取前13位
    return Number(timestampStr.slice(0, 13))
  }

  return timestamp
}

/**
 * 格式化时间（相对时间）
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} 天前`
  if (hours > 0) return `${hours} 小时前`
  if (minutes > 0) return `${minutes} 分钟前`
  if (seconds > 0) return `${seconds} 秒前`
  return '刚刚'
}

/**
 * 格式化日期时间
 */
export function formatDateTime(timestamp: number): string {
  if (!timestamp) return ''

  // 规范化时间戳为13位
  const normalizedTimestamp = normalizeTimestamp(timestamp)
  const date = new Date(normalizedTimestamp)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 格式化日期时间（完整格式：YYYY:MM:DD hh:mm:ss）
 * @param timestamp - 时间戳（支持任意位数，会自动规范化为13位毫秒级时间戳）
 * @returns 格式化后的日期字符串
 * @example
 * formatDateTimeFull(1640995200000) // 返回 "2022:01:01 00:00:00"
 * formatDateTimeFull(1640995200) // 10位秒级时间戳，补3个0 -> "2022:01:01 00:00:00"
 * formatDateTimeFull(16409952000000000) // 超过13位，截取前13位 -> "2022:01:01 00:00:00"
 */
export function formatDateTimeFull(timestamp: number): string {
  if (!timestamp) return ''

  // 规范化时间戳为13位
  const normalizedTimestamp = normalizeTimestamp(timestamp)
  const date = new Date(normalizedTimestamp)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('复制失败:', error)
    
    // 降级方案
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch (fallbackError) {
      console.error('降级复制也失败:', fallbackError)
      return false
    }
  }
}

/**
 * 验证地址格式
 */
export function isValidAddress(address: string): boolean {
  // BTC Legacy 地址（1 开头）
  const btcLegacyRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/
  // BTC SegWit 地址（3 开头）
  const btcSegwitRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/
  // BTC Bech32 地址（bc1 开头）
  const btcBech32Regex = /^bc1[a-z0-9]{39,87}$/
  
  return btcLegacyRegex.test(address) || 
         btcSegwitRegex.test(address) || 
         btcBech32Regex.test(address)
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength = 50): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * 睡眠函数（用于测试或延迟）
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

