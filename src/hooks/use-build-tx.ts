import { useUserStore } from '@/stores/user'
import { useUtxosStore } from '@/stores/useabel-utxo'
import { useChainStore } from '@/stores/chain'
import { createGlobalState } from '@vueuse/core'
import { computed } from 'vue'
import { TxComposer, mvc } from 'meta-contract'
import { isNil } from 'lodash'
import { sleep } from '@/utils/util'
import {createPinWithBtc} from '@/utils/pin'
import { type AttachmentItem } from "@/@types/common";
// ==================== 类型定义 ====================

export type ChainType = 'btc' | 'mvc'
export type BtcNetwork = 'mainnet' | 'testnet' | 'regtest'
export type Operation = 'init' | 'create' | 'modify' | 'revoke'
export type Encryption = '0' | '1' | '2'
export type SerialAction = 'combo' | 'finish'
export type PaymentMode = 'normal' | 'assist'

// ==================== 统一交易构建相关类型 ====================

// 智能交易构建参数 - 基于参数自动识别处理方式
export interface UnifiedTransactionParams {
  // 核心数据 - 必须包含 path 或 protocol 用于自动识别
  path?: string
  protocol?: string
  
  // 交易数据
  operation?: Operation
  body?: any
  contentType?: string
  encryption?: Encryption
  version?: string
  encoding?: BufferEncoding
  
  // 选项
  options?: CreatePinOptions
}

// 协议处理规则类型
export interface ProtocolRule {
  pattern: RegExp | string  // 匹配模式
  handler: (data: UnifiedTransactionParams) => Promise<CreatePinResult | null>
  description: string
  defaultOptions?: Partial<CreatePinOptions>
}

// 协议规则注册表
export interface ProtocolRegistry {
  [protocolName: string]: ProtocolRule
}

export interface Transaction {
  txComposer: TxComposer
  message: string
}

export interface MetaidData {
  operation?: Operation
  body?: any
  path?: string
  contentType?: string
  encryption?: Encryption
  version?: string
  encoding?: BufferEncoding
  revealAddr?: string
  flag?: 'metaid'
}

export interface CreatePinOptions {
  // 链相关
  chain?: ChainType  // 默认 'mvc'
  network?: BtcNetwork  // 默认 'testnet'
  
  // 交易构建
  signMessage?: string
  serialAction?: SerialAction  // 'combo' | 'finish'
  transactions?: Transaction[] | any[]
  isBroadcast?: boolean  // 是否广播交易，默认 true
  
  // 支付相关
  feeRate?: number  // BTC/MVC 手续费率
  paymentMode?: PaymentMode  // 'normal' | 'assist'
  assistDomain?: string  // assist API 域名
  needSmallpay?:boolean

  //额外配置
  mime?:string
  attachments?:AttachmentItem[]
  
  // 额外输出
  service?: {
    address: string
    satoshis: string
  }
  outputs?: Array<{
    address: string
    satoshis: string
  }>

  SerialTransactions?:any[]
  
  // UTXO 相关（assist 模式使用）
  utxo?: {
    txid: string
    outIndex: number
    value: number
    address: string
  }
}

export type CreatePinResult =
  | {
      transactions: Transaction[]
      txid?: undefined
      txids?: string[]
    }
  | {
      txid: string
      transactions?: undefined
      txids?: string[]
    }

type OpReturnV2 = [
  'metaid',
  Operation,
  string | undefined,
  Encryption | undefined,
  string | undefined,
  string | undefined,
  string | Buffer | undefined
]

// ==================== 工具函数 ====================

/**
 * 构建 OP_RETURN 数据
 */
function buildOpReturnV2(
  metaidData: Omit<MetaidData, 'revealAddr'>,
  options?: { network: BtcNetwork }
): OpReturnV2 {
  const res1 = ['metaid', metaidData.operation]
  const res2 = []
  
  if (metaidData.operation !== 'init') {
    res2.push(metaidData.path!)
    res2.push(metaidData?.encryption ?? '0')
    res2.push(metaidData?.version ?? '1.0.0')
    res2.push(metaidData?.contentType ?? 'text/plain;utf-8')

    const body = isNil(metaidData.body)
      ? undefined
      : Buffer.isBuffer(metaidData.body)
      ? metaidData.body
      : Buffer.from(metaidData.body, metaidData?.encoding ?? 'utf-8')
    res2.push(body)
  }
  
  return [...res1, ...res2] as OpReturnV2
}

/**
 * 生成唯一 key
 */
function generateKey(): string {
  return (
    'key_' +
    Date.now() +
    '_' +
    Math.random().toString(36).slice(2, 8)
  )
}

/**
 * 获取字符串 UTF-8 字节大小
 */
function getStringSize(str: string): number {
  return new TextEncoder().encode(str).length
}

/**
 * 判断是否超过 1MB
 */
function isBiggerThan1MB(str: string): boolean {
  return getStringSize(str) > 1024 * 1024
}

/**
 * 广播交易到 API
 */
async function broadcastToApi({
  txHex,
  network,
  chain = 'mvc',
}: {
  txHex: string
  network: BtcNetwork
  chain?: ChainType
}): Promise<{ txid: string }> {
  const response = await fetch('https://www.metalet.space/wallet-api/v3/tx/broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chain,
      net: network,
      rawTx: txHex,
    }),
  })
  
  const { data: txid, message } = await response.json()
  
  if (!txid) {
    throw new Error(message)
  }

  return { txid }
}

/**
 * 广播单个交易
 */
async function broadcast({
  txComposer,
  network,
  chain,
}: {
  txComposer: TxComposer
  network: BtcNetwork
  chain: ChainType
}): Promise<{ txid: string }> {
  const txHex = txComposer.getTx().toString()
  const { txid } = await broadcastToApi({ txHex, network, chain })
  console.log(`📡 [${chain.toUpperCase()}] Transaction broadcast:`, txid)
  return { txid }
}

/**
 * 批量广播交易
 */
async function batchBroadcast({
  txComposers,
  network,
  chain,
}: {
  txComposers: TxComposer[]
  network: BtcNetwork
  chain: ChainType
}): Promise<{ txid: string }[]> {
  const results: { txid: string }[] = []
  
  for (let i = 0; i < txComposers.length; i++) {
    const result = await broadcast({
      txComposer: txComposers[i],
      network,
      chain,
    })
    results.push(result)
  }
  
  return results
}

/**
 * 支付交易（常规模式 - MVC）
 */
async function payMvc({
  transactions,
  feeRate,
  needSmallpay
}: {
  transactions: Transaction[]
  feeRate?: number
  needSmallpay?:boolean
}): Promise<TxComposer[]> {
  const params = {
    transactions: transactions.map(transaction => ({
      txComposer: transaction.txComposer.serialize(),
      message: transaction.message,
    })),
    hasMetaid: true,
    feeb: feeRate,
  }

  // 处理大数据（> 1MB）使用分片存储
  if (window.metaidwallet?.storageChunk && isBiggerThan1MB(JSON.stringify(params))) {
    const key = generateKey()
    const data = JSON.stringify(params)
    const chunkSize = 256 * 1024 // 256KB per chunk
    const total = Math.ceil(data.length / chunkSize)

    for (let i = 0; i < total; i++) {
      const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize)
      await window.metaidwallet.storageChunk({ chunk, index: i, total, key })
    }

    const ret = await window.metaidwallet.pay({
      useChunk: true,
      chunkKey: key,
    })

    const { payedTransactions, status, message } = ret

    if (status) {
      throw new Error(message || status)
    }

    if (!payedTransactions || payedTransactions.length === 0) {
      throw new Error('No payed transactions returned from wallet (MVC chunk)')
    }

    return payedTransactions.map((txComposerSerialized: string) =>
      TxComposer.deserialize(txComposerSerialized)
    )
  }

  // 常规支付
  const ret =needSmallpay ? await window.metaidwallet!.smallPay(params) : await window.metaidwallet!.pay(params)
  const { payedTransactions, status, message } = ret

  if (status) {
    throw new Error(message || status)
  }

  if (!payedTransactions || payedTransactions.length === 0) {
    throw new Error('No payed transactions returned from wallet (MVC)')
  }

  return payedTransactions.map((txComposerSerialized: string) =>
    TxComposer.deserialize(txComposerSerialized)
  )
}

/**
 * 支付交易（常规模式 - BTC）
 */
async function payBtc({
  transactions,
  feeRate,
}: {
  transactions: Transaction[]
  feeRate?: number
}): Promise<TxComposer[]> {
  const params = {
    transactions: transactions.map(transaction => ({
      txComposer: transaction.txComposer.serialize(),
      message: transaction.message,
    })),
    hasMetaid: true,
    feeRate: feeRate, // BTC 使用 feeRate 而不是 feeb
  }

  // BTC 也支持分片存储
  if (window.metaidwallet?.storageChunk && isBiggerThan1MB(JSON.stringify(params))) {
    const key = generateKey()
    const data = JSON.stringify(params)
    const chunkSize = 256 * 1024
    const total = Math.ceil(data.length / chunkSize)

    for (let i = 0; i < total; i++) {
      const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize)
      await window.metaidwallet.storageChunk({ chunk, index: i, total, key })
    }

    const ret = await window.metaidwallet.pay({
      useChunk: true,
      chunkKey: key,
    })

    const { payedTransactions, status, message } = ret

    if (status) {
      throw new Error(message || status)
    }

    if (!payedTransactions || payedTransactions.length === 0) {
      throw new Error('No payed transactions returned from wallet (BTC chunk)')
    }

    return payedTransactions.map((txComposerSerialized: string) =>
      TxComposer.deserialize(txComposerSerialized)
    )
  }

  // BTC 常规支付
  const ret = await window.metaidwallet!.pay(params)
  const { payedTransactions, status, message } = ret

  if (status) {
    throw new Error(message || status)
  }

  if (!payedTransactions || payedTransactions.length === 0) {
    throw new Error('No payed transactions returned from wallet (BTC)')
  }

  return payedTransactions.map((txComposerSerialized: string) =>
    TxComposer.deserialize(txComposerSerialized)
  )
}

/**
 * 统一支付接口
 */
async function pay({
  transactions,
  feeRate,
  chain,
  needSmallpay=false
}: {
  transactions: Transaction[]
  feeRate?: number
  needSmallpay?:boolean
  chain: ChainType
}): Promise<TxComposer[]> {
  if (chain === 'btc') {
    console.log('💰 [BTC] Using BTC payment mode')
    return payBtc({ transactions, feeRate })
  } else {
    console.log('💰 [MVC] Using MVC payment mode')
    return payMvc({ transactions, feeRate,needSmallpay })
  }
}

/**
 * 支付交易（Assist 模式）
 */
async function payWithAssist({
  metaidData,
  options,
  utxo,
}: {
  metaidData: Omit<MetaidData, 'revealAddr'>
  options: CreatePinOptions
  utxo?: {
    txid: string
    outIndex: number
    value: number
    address: string
  }
}): Promise<{
  txid: string
  utxo?: {
    txid: string
    outIndex: number
    value: number
    address: string
  }
}> {
  const address = await window.metaidwallet!.getAddress()
  const network = options.network ?? 'testnet'
  const assistDomain = options.assistDomain!

  // 获取或初始化 UTXO
  let _utxo = utxo
  if (!_utxo) {
    const utxos: any[] = await window.metaidwallet!.getUtxos()
    _utxo = utxos.find(u => u.address === address)
    
    if (!_utxo) {
      // 初始化地址 UTXO
      const url = `${assistDomain}/v1/assist/gas/mvc/address-init`
      const preRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gasChain: 'mvc',
          address,
        }),
      })
      
      const initUtxo = await preRes.json()
      
      if (initUtxo.error) {
        throw new Error(initUtxo.error)
      }
      
      if (!initUtxo.data) {
        await sleep(5000)
        const utxos: any[] = await window.metaidwallet!.getUtxos()
        _utxo = utxos.find(u => u.address === address)
        
        if (!_utxo) {
          throw new Error('No UTXO found for address')
        }
      } else {
        _utxo = {
          txid: initUtxo.data.txId,
          outIndex: initUtxo.data.index,
          value: initUtxo.data.amount,
          address: initUtxo.data.address,
        }
      }
    }
  }

  // 构建交易
  const pinTxComposer = new TxComposer()
  pinTxComposer.appendP2PKHInput({
    address: new mvc.Address(address, network),
    satoshis: _utxo.value,
    txId: _utxo.txid,
    outputIndex: _utxo.outIndex,
  })

  pinTxComposer.appendP2PKHOutput({
    address: new mvc.Address(address, network),
    satoshis: 1,
  })

  const metaidOpreturn = buildOpReturnV2(metaidData, { network })
  pinTxComposer.appendOpReturnOutput(metaidOpreturn)

  const changeAddress = new mvc.Address(address, network)
  pinTxComposer.appendP2PKHOutput({
    address: changeAddress,
    satoshis: _utxo.value,
  })

  // 调用 assist API pre
  const preUrl = `${assistDomain}/v1/assist/gas/mvc/pre`
  const preRes = await fetch(preUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      txHex: pinTxComposer.getRawHex(),
      address,
    }),
  })

  const preData = await preRes.json()
  if (preData.error) {
    throw new Error(preData.error)
  }

  // 构建完整交易
  const tx = new mvc.Transaction(preData.data.txHex)
  const txObj = tx.toObject()

  // 获取所有引用的 UTXO 信息
  const utxoPromises = txObj.inputs.map(async (input: any) => {
    const utxoRawUrl =
      network === 'testnet'
        ? `https://mvcapi-testnet.cyber3.space/tx/${input.prevTxId}/raw`
        : `https://api.microvisionchain.com/open-api-mvc/tx/${input.prevTxId}/raw`

    const utxoRes = await fetch(utxoRawUrl)
    return await utxoRes.json()
  })

  const _utxos = await Promise.all(utxoPromises)

  // 设置 input 的 output
  tx.inputs.forEach((input: any, index: number) => {
    const _tx = new mvc.Transaction(_utxos[index].hex)
    const utxoOutput = _tx.outputs[input.outputIndex]
    if (utxoOutput) {
      tx.inputs[index].output = new mvc.Transaction.Output({
        script: utxoOutput.script,
        satoshis: utxoOutput.satoshis,
      })
    }
  })

  // 解锁 P2PKH 输入
  const txComposer = new TxComposer(tx)
  const txComposerSerialize = txComposer.serialize()
  const unlockParams = {
    transaction: [
      {
        txComposer: txComposerSerialize,
        toSignInputs: [0],
      },
    ],
  }

  if (!window.metaidwallet!.unlockP2PKHInput) {
    throw new Error('unlockP2PKHInput method is not available in wallet')
  }

  const [_txComposerSerialize] = await window.metaidwallet!.unlockP2PKHInput(unlockParams)

  // 提交交易
  const commitUrl = `${assistDomain}/v1/assist/gas/mvc/commit`
  const commitRes = await fetch(commitUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      txHex: TxComposer.deserialize(_txComposerSerialize).getRawHex(),
      orderId: preData.data.orderId,
    }),
  })

  const commitData = await commitRes.json()
  
  if (commitData.code == 1 && !commitData.data) {
    throw new Error(
      JSON.stringify({
        state: commitData.code,
        message: commitData.message,
      })
    )
  }

  return {
    txid: commitData.data.txId,
    utxo: {
      txid: commitData.data.txId,
      outIndex: 2,
      value: _utxo.value,
      address: address,
    },
  }
}


// ==================== 主 Hook ====================

export const useBuildTx = createGlobalState(() => {
  const userStore = useUserStore()
  const utxoStore = useUtxosStore()
  const chainStore = useChainStore()
  const AddressHost=import.meta.env.VITE_ADDRESS_HOST
  const addressObject = computed(() => {
    return new mvc.Address(userStore.last?.address)
  })

  const rootAddress = computed(() => {
    return userStore.last?.address
  })

  /**
   * 核心方法：创建 Pin（支持 BTC 和 MVC）
   */
  const createPin = async (
    metaidData: Omit<MetaidData, 'revealAddr'>,
    options: CreatePinOptions = {}
  ): Promise<CreatePinResult | null> => {
    // 解构参数，设置默认值
    // 优先使用传入的 chain，否则使用 chainStore 的当前链
    const currentChain = options.chain || chainStore.state.currentChain
    
    const {
      chain = currentChain,
      network = 'mainnet',
      signMessage = 'Create Pin',
      serialAction = 'finish',
      transactions = [],
      isBroadcast=true,
      feeRate,
      paymentMode = 'normal',
      assistDomain,
      service,
      outputs=[],
      utxo,
      needSmallpay=false,
     

    } = options

    const address = await window.metaidwallet!.getAddress()
    const _transactions: Transaction[] = [...transactions]

    console.log(`🔗 [${chain.toUpperCase()}] Creating Pin on ${chain} chain...`)

    // ==================== 1. 构建交易 ====================
    const pinTxComposer = new TxComposer()

    // 根据不同链使用不同的地址格式和交易构建方式
    if (chain === 'btc') {
      // ========== BTC 链处理 ==========
      console.log('🔧 [BTC] Building BTC transaction...')
      const inscribeDataArray=[]

       if(transactions.length){
          
          inscribeDataArray.push(...transactions)
        }

      inscribeDataArray.push(metaidData)
        const options={
         noBroadcast:isBroadcast ? 'no': 'yes',
         feeRate:1,
         network:'mainnet',
         outputs:outputs
       }
        const txIDs= await createPinWithBtc({
          inscribeDataArray,
          options
        })
        if(txIDs.status == "canceled"){
          return null
        }

        return {
          txid: txIDs.revealTxIds[txIDs.revealTxIds.length - 1],
          txids:txIDs.revealTxIds,
          }
      // BTC 需要获取 BTC 地址
      // const btcAddressResult = await window.metaidwallet!.btc.getAddress()
      // const btcAddress = btcAddressResult.address
      // console.log('📍 [BTC] BTC Address:', btcAddress)

      // // BTC 的输出（使用 BTC 地址）
      // pinTxComposer.appendP2PKHOutput({
      //   address: new mvc.Address(btcAddress, network),
      //   satoshis: 546, // BTC 的 dust limit 通常是 546 sats
      // })

      // // 添加 OP_RETURN 输出
      // const metaidOpreturn = buildOpReturnV2(metaidData, { network })
      // pinTxComposer.appendOpReturnOutput(metaidOpreturn)

      // // 添加服务费输出（可选）
      // if (service?.address && service?.satoshis) {
      //   pinTxComposer.appendP2PKHOutput({
      //     address: new mvc.Address(service.address, network),
      //     satoshis: Number(service.satoshis),
      //   })
      // }

      // // 添加额外输出（可选）
      // if (outputs) {
      //   for (const output of outputs) {
      //     pinTxComposer.appendP2PKHOutput({
      //       address: new mvc.Address(output.address, network),
      //       satoshis: Number(output.satoshis),
      //     })
      //   }
      // }
    } else {
      // ========== MVC 链处理 ==========
      console.log('🔧 [MVC] Building MVC transaction...')

      // MVC 的输出（使用 MVC 地址）
      pinTxComposer.appendP2PKHOutput({
        address: new mvc.Address(address, network),
        satoshis: 1,
      })

      // 添加 OP_RETURN 输出
      const metaidOpreturn = buildOpReturnV2(metaidData, { network })
      pinTxComposer.appendOpReturnOutput(metaidOpreturn)

      // 添加服务费输出（可选）
      if (service?.address && service?.satoshis) {
        pinTxComposer.appendP2PKHOutput({
          address: new mvc.Address(service.address, network),
          satoshis: Number(service.satoshis),
        })
      }

      // 添加额外输出（可选）
      if (outputs.length) {
        for (const output of outputs) {
          pinTxComposer.appendP2PKHOutput({
            address: new mvc.Address(output.address, network),
            satoshis: Number(output.satoshis),
          })
        }
      }
    }


    _transactions.push({
      txComposer: pinTxComposer,
      message: signMessage,
    })

    // ==================== 2. 串行组合模式：直接返回交易 ====================
    if (serialAction === 'combo') {
      console.log(`📦 [${chain.toUpperCase()}] Combo mode - returning transactions`)
      return { transactions: _transactions }
    }

    // ==================== 3. 执行支付和广播 ====================
    
    // 3.1 Assist 模式（仅支持 MVC）
    if (paymentMode === 'assist' && assistDomain) {
      if (chain !== 'mvc') {
        throw new Error('Assist payment mode only supports MVC chain')
      }

      console.log('🔄 [MVC] Using Assist payment mode...')
      const { txid, utxo: newUtxo } = await payWithAssist({
        metaidData,
        options: { ...options, network, assistDomain },
        utxo,
      })

      // 存储新的 UTXO
      if (newUtxo) {
        utxoStore.insert(newUtxo, newUtxo.address)
      }

      console.log(`✅ [${chain.toUpperCase()}] Pin created (Assist mode):`, txid)
      return { txid }
    }

    // 3.2 常规模式（支持 BTC 和 MVC）
    console.log(`💳 [${chain.toUpperCase()}] Using normal payment mode...`)
    
    // 使用当前链的手续费率（如果未指定）
    const effectiveFeeRate = feeRate || (chain === 'btc' ? chainStore.btcFeeRate() : chainStore.mvcFeeRate())
    console.log(`💰 [${chain.toUpperCase()}] Fee rate:`, effectiveFeeRate)

    const payRes = await pay({
      transactions: _transactions,
      feeRate: effectiveFeeRate,
      chain,
      needSmallpay
    })

    // 广播交易
    console.log(`📡 [${chain.toUpperCase()}] Broadcasting transactions...`)
    const broadcastResults = await batchBroadcast({
      txComposers: payRes,
      network,
      chain,
    })

    const txids = broadcastResults.map(r => r.txid)
    const lastTxid = txids[txids.length - 1]

    console.log(`✅ [${chain.toUpperCase()}] Pin created (Normal mode):`, lastTxid)
    console.log(`📋 All txids:`, txids)

    return {
      txid: lastTxid,
      txids,
    }
  }

  /**
   * 批量创建 Pins - 与 createPin 功能完全一致
   */
  const createPins = async (
    metaDatas: Array<Omit<MetaidData, 'revealAddr'>>,
    options: CreatePinOptions = {}
  ): Promise<{
    txids: string[]
    success: boolean
    results: Array<CreatePinResult | null>
  }> => {
    // 解构参数，设置默认值 - 与 createPin 保持一致
    const currentChain = options.chain || chainStore.state.currentChain
    
    const {
      chain = currentChain,
      network = 'mainnet',
      signMessage = 'Create Pins',
      serialAction = 'finish',
      transactions = [],
      isBroadcast = true,
      feeRate,
      paymentMode = 'normal',
      assistDomain,
      service,
      outputs = [],
      utxo,
      needSmallpay = false,
      mime,
      attachments
    } = options

    console.log(`🔗 [${chain.toUpperCase()}] Creating ${metaDatas.length} Pins on ${chain} chain...`)

    const results: Array<CreatePinResult | null> = []
    let allTxids: string[] = []

    // 根据不同链使用不同的处理方式
    if (chain === 'btc') {
      // ========== BTC 链处理 - 与 createPin 保持一致 ==========
      console.log('🔧 [BTC] Building BTC batch transactions...')
      
      // 收集所有需要铭刻的数据
      const inscribeDataArray = [...transactions, ...metaDatas]
      
      const btcOptions = {
        noBroadcast: isBroadcast ? 'no' : 'yes',
        feeRate: feeRate || 1,
        network: network,
        outputs: outputs,
        mime: mime,
        attachments: attachments
      }

      try {
        const txIDs = await createPinWithBtc({
          inscribeDataArray,
          options: btcOptions
        })

        if (txIDs.status === "canceled") {
          return {
            txids: [],
            success: false,
            results: metaDatas.map(() => null)
          }
        }

        // 为每个 metaData 创建结果
        const revealTxIds = txIDs.revealTxIds || []
        metaDatas.forEach((_, index) => {
          const txid = revealTxIds[index] || revealTxIds[revealTxIds.length - 1]
          results.push({
            txid: txid,
            txids: revealTxIds
          })
        })

        allTxids = revealTxIds

        console.log(`✅ [BTC] Batch pins created:`, allTxids)
        
        return {
          txids: allTxids,
          success: true,
          results: results
        }
      } catch (error) {
        console.error('❌ [BTC] Error creating batch pins:', error)
        return {
          txids: [],
          success: false,
          results: metaDatas.map(() => null)
        }
      }
    } else {
      // ========== MVC 链处理 ==========
      console.log('🔧 [MVC] Building MVC batch transactions...')

      // Assist 模式：串行处理
      if (paymentMode === 'assist' && assistDomain) {
        let currentUtxo = utxo
        
        for (let i = 0; i < metaDatas.length; i++) {
          const metaData = metaDatas[i]
          try {
            const { txid, utxo: newUtxo } = await payWithAssist({
              metaidData: metaData,
              options: { ...options, network, assistDomain },
              utxo: currentUtxo,
            })
            
            currentUtxo = newUtxo
            if (currentUtxo) {
              utxoStore.insert(currentUtxo, currentUtxo.address)
            }
            
            if (txid) {
              allTxids.push(txid)
              results.push({ txid })
            } else {
              results.push(null)
            }
          } catch (error) {
            console.error(`❌ [MVC] Error creating pin ${i}:`, error)
            results.push(null)
          }
        }
      } 
      // 常规模式：组合交易
      else {
        let _transactions: Transaction[] = [...transactions]
        
        for (let i = 0; i < metaDatas.length; i++) {
          const metaData = metaDatas[i]
          const isLast = i === metaDatas.length - 1
          
          try {
            const result = await createPin(metaData, {
              ...options,
              serialAction: isLast ? 'finish' : 'combo',
              transactions: [..._transactions],
              feeRate,
            })
            
            if (result?.transactions) {
              _transactions = result.transactions
            }
            
            if (result?.txids) {
              allTxids = result.txids
            }
            
            results.push(result)
          } catch (error) {
            console.error(`❌ [MVC] Error creating pin ${i}:`, error)
            results.push(null)
          }
        }
      }

      console.log(`✅ [MVC] Batch pins created:`, allTxids)
      
      return {
        txids: allTxids,
        success: allTxids.length > 0,
        results: results
      }
    }
  }

  // ==================== 智能协议识别系统 ====================
  
  // 协议规则注册表
  const protocolRegistry: ProtocolRegistry = {}

  /**
   * 注册协议规则
   */
  const registerProtocolRule = (
    protocolName: string,
    rule: ProtocolRule
  ) => {
    protocolRegistry[protocolName] = rule
    console.log(`📝 [PROTOCOL] Registered protocol rule: ${protocolName}`)
  }

  /**
   * 注销协议规则
   */
  const unregisterProtocolRule = (protocolName: string) => {
    delete protocolRegistry[protocolName]
    console.log(`🗑️ [PROTOCOL] Unregistered protocol rule: ${protocolName}`)
  }

  /**
   * 获取所有已注册的协议规则
   */
  const getRegisteredProtocols = () => {
    return Object.keys(protocolRegistry).map(name => ({
      name,
      description: protocolRegistry[name].description,
      pattern: protocolRegistry[name].pattern.toString(),
      hasDefaultOptions: !!protocolRegistry[name].defaultOptions
    }))
  }

  /**
   * 根据 path 或 protocol 自动识别处理规则
   */
  const detectProtocol = (params: UnifiedTransactionParams): ProtocolRule | null => {
    const { path, protocol } = params
    
    // 优先使用明确的 protocol 参数
    if (protocol && protocolRegistry[protocol]) {
      return protocolRegistry[protocol]
    }
    
    // 根据 path 模式匹配
    if (path) {
      for (const [name, rule] of Object.entries(protocolRegistry)) {
        if (typeof rule.pattern === 'string') {
          // 字符串匹配：检查 path 是否包含该字符串
          if (path.includes(rule.pattern)) {
            console.log(`🎯 [DETECT] Matched protocol '${name}' by string pattern: ${rule.pattern}`)
            return rule
          }
        } else if (rule.pattern instanceof RegExp) {
          // 正则表达式匹配：测试 path 是否匹配该正则
          if (rule.pattern.test(path)) {
            console.log(`🎯 [DETECT] Matched protocol '${name}' by regex pattern: ${rule.pattern}`)
            return rule
          }
        }
      }
    }
    
    console.log(`❌ [DETECT] No protocol rule matched for path: ${path}`)
    return null
  }

  // ==================== 具体交易构建方法 ====================

  /**
   * 创建 MVC 文件交易
   */
  const createMvcFile = async (
    metaidData: Omit<MetaidData, 'revealAddr'>,
    options: CreatePinOptions = {}
  ): Promise<CreatePinResult | null> => {
    console.log('📁 [MVC_FILE] Creating MVC file transaction...')
    
    // MVC 文件交易通常需要特定的路径和内容类型
    const mvcFileData = {
      ...metaidData,
      path: metaidData.path || '/file',
      contentType: metaidData.contentType || 'application/octet-stream',
      operation: metaidData.operation || 'create'
    }
    
    // 调用现有的 createPin 方法
    return await createPin(mvcFileData, {
      ...options,
      chain: 'mvc', // MVC 文件交易强制使用 MVC 链
      signMessage: options.signMessage || 'Create MVC File'
    })
  }

  /**
   * 创建显示消息交易
   */
  const createShowMsg = async (
    metaidData: Omit<MetaidData, 'revealAddr'>,
    options: CreatePinOptions = {}
  ): Promise<CreatePinResult | null> => {
    console.log('💬 [SHOW_MSG] Creating show message transaction...')
    
    // 显示消息交易通常使用文本内容
    const showMsgData = {
      ...metaidData,
      path: metaidData.path || `${AddressHost}:/protocols/showmsg`,
      contentType: metaidData.contentType || 'text/plain;utf-8',
      operation: metaidData.operation || 'create'
    }
    
    // 调用现有的 createPin 方法
    return await createPin(showMsgData, {
      ...options,
      signMessage: options.signMessage || 'Create Show Message'
    })
  }

  // ==================== 初始化协议规则注册 ====================

  // 注册默认协议规则
  registerProtocolRule('showmsg', {
    pattern: new RegExp(`${AddressHost ? AddressHost.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : ''}:/protocols/showmsg`, 'i'),
    handler: async (params) => {
      console.log('📱 [SHOWMSG] Processing showmsg protocol')
      return await createShowMsg({
        operation: params.operation || 'create',
        body: params.body,
        path: params.path || `${AddressHost}:/protocols/showmsg`,
        contentType: params.contentType || 'text/plain;utf-8',
        encryption: params.encryption,
        version: params.version,
        encoding: params.encoding
      }, params.options || {})
    },
    description: '显示消息协议处理',
    defaultOptions: {
      chain: 'btc',
      network: 'mainnet',
      signMessage: 'Create Show Message'
    }
  })

  // 注册 MVC 文件协议规则
  registerProtocolRule('file', {
    pattern: new RegExp(`${AddressHost ? AddressHost.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : ''}:/protocols/mvcfile`, 'i'),
    handler: async (params) => {
      console.log('📁 [MVCFILE] Processing mvcfile protocol')
      return await createMvcFile({
        operation: params.operation || 'create',
        body: params.body,
        path: params.path || '/file',
        contentType: params.contentType || 'application/octet-stream',
        encryption: params.encryption,
        version: params.version,
        encoding: params.encoding
      }, params.options || {})
    },
    description: 'MVC 文件协议处理',
    defaultOptions: {
      chain: 'mvc',
      network: 'mainnet',
      signMessage: 'Create MVC File'
    }
  })







  /**
   * 智能交易构建方法 - 基于 path/protocol 自动识别处理方式
   * 用户只需要传入标准参数，系统自动识别并调用相应的处理逻辑
   */
  const buildTransaction = async (
    params: UnifiedTransactionParams
  ): Promise<CreatePinResult | null> => {
    console.log(`🔧 [SMART] Building transaction with params:`, params)
    
    try {
      // 自动识别协议规则
      const protocolRule = detectProtocol(params)
      
      if (protocolRule) {
        console.log(`🎯 [SMART] Detected protocol rule: ${protocolRule.description}`)
        
        // 合并默认选项
        const mergedOptions = {
          ...protocolRule.defaultOptions,
          ...params.options
        }
        
        // 创建完整的参数对象
        const fullParams = {
          ...params,
          options: mergedOptions
        }
        
        console.log(`📋 [SMART] Calling protocol handler with merged options:`, mergedOptions)
        
        // 调用协议处理函数
        const result = await protocolRule.handler(fullParams)
        
        console.log(`✅ [SMART] Protocol handler completed successfully`)
        return result
      }
      
      // 如果没有匹配的协议规则，使用默认的 createPin 处理
      console.log(`🔄 [SMART] No specific protocol detected, using default createPin handler`)
      
      const metaidData = {
        operation: params.operation || 'create',
        body: params.body,
        path: params.path,
        contentType: params.contentType,
        encryption: params.encryption,
        version: params.version,
        encoding: params.encoding
      }
      
      
      return await createPin(metaidData, params.options || {})
      
    } catch (error) {
      console.error(`❌ [SMART] Error building transaction:`, error)
      throw error
    }
  }

  /**
   * 批量构建交易
   */
  const buildTransactions = async (
    paramsList: UnifiedTransactionParams[]
  ): Promise<{
    results: Array<CreatePinResult | null>
    success: boolean
    errors: Array<{ index: number; error: Error }>
  }> => {
    console.log(`🔧 [UNIFIED] Building ${paramsList.length} transactions...`)
    
    const results: Array<CreatePinResult | null> = []
    const errors: Array<{ index: number; error: Error }> = []
    
    for (let i = 0; i < paramsList.length; i++) {
      try {
        const result = await buildTransaction(paramsList[i])
        results.push(result)
      } catch (error) {
        console.error(`❌ [UNIFIED] Error building transaction ${i}:`, error)
        results.push(null)
        errors.push({ index: i, error: error as Error })
      }
    }
    
    const success = errors.length === 0
    
    console.log(`✅ [UNIFIED] Batch transaction building completed. Success: ${success}, Errors: ${errors.length}`)
    
    return {
      results,
      success,
      errors
    }
  }

  return {
    // 状态
    addressObject,
    rootAddress,
    
    // 原有方法
    createPin,
    createPins,
    
    // 智能交易构建方法
    buildTransaction,
    buildTransactions,
    
    // 协议规则管理
    registerProtocolRule,
    unregisterProtocolRule,
    getRegisteredProtocols,
    
    // 具体交易构建方法（保持向后兼容）
    createMvcFile,
    createShowMsg,
  }
})