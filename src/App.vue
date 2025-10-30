<template>
  <div class="app-container">
    <!-- Header 导航栏 -->
    <Header />
    
    <!-- 主要内容区域 -->
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- Footer 底部 -->
    <footer class="app-footer">
      <div class="footer-content">
        <span class="footer-text">About MetalID</span>
        <span class="footer-text">About MetaBitcoin Network</span>
      </div>
    </footer>
    
    <!-- 模态框组件 -->
    <ConnectWalletModalVue />
  </div>
</template>
<script setup lang='ts'>
import {ref,onMounted,onUnmounted,onBeforeUnmount} from 'vue'
import Header from '@/components/Header/Header.vue'
import ConnectWalletModalVue from '@/components/ConnectWalletModal/ConnectWalletModal.vue'

import { useRootStore } from './stores/root'
import { useConnectionStore } from './stores/connection'
import { useUserStore } from './stores/user'
import { useToast } from '@/components/Toast/useToast.ts'
import { useCredentialsStore } from './stores/credentials'
import { type Network, useNetworkStore } from '@/stores/network'
import {completeReload, sleep} from '@/utils/util'
import { useConnectionModal } from './hooks/use-connection-modal'
import { useRouter } from 'vue-router'

const router = useRouter()
const accountInterval=ref()
const rootStore=useRootStore()
const connectionStore=useConnectionStore()
const userStore=useUserStore()
const credentialsStore=useCredentialsStore()
const { showToast } = useToast()
const isNetworkChanging = ref(false)
const MAX_RETRY_TIME = 10000 // 最大等待时间（毫秒）
const RETRY_INTERVAL = 100  // 重试间隔（毫秒）
const networkStore = useNetworkStore()
const {  closeConnectionModal } =useConnectionModal()


async function connectMetalet() {

  try {
    const connection = await connectionStore.connect('metalet').catch((err) => {
      showToast(err.message,'error')
   
  })
    if (connection?.status === 'connected') {
    await credentialsStore.login()

  }
  } catch (error) {
    showToast(error.message,'error')
  }

    

}

function handleNetworkChanged(network: Network) {
isNetworkChanging.value = true

const appNetwork = networkStore.network
if (network !== appNetwork) {
connectionStore.disconnect()
}

isNetworkChanging.value = false
}

const metaletAccountsChangedHandler = () => {
try {
  
if (useConnectionStore().last.wallet !== 'metalet') return
if(rootStore.isWebView) return
connectionStore.disconnect()

showToast('Metalet 账户已变更。正在刷新页面...','warning')
sleep().then(()=>completeReload())


} catch (error) {
console.error('Error in metaletAccountsChangedHandler:', error)
}
}




const metaletNetworkChangedHandler = (network: Network) => {
if (useConnectionStore().last.wallet !== 'metalet') return
if(rootStore.isWebView) return
handleNetworkChanged(network)
}

const appLoginSuccessHandler= async (data: any) => {

try {

if (!userStore.isAuthorized) {
await connectMetalet()


}

} catch (error) {
  showToast(error,'error')

}
}




const appAccountSwitchHandler= async(data:any)=>{
//ElMessage.success('调用onAccountSwitch')
try {
if(rootStore.isWebView){

await connectionStore.disconnect()

await connectMetalet()


}
} catch (error) {
throw new Error(error)
}
}

const appLogoutHandler= async (data: any) => {
try {
console.log("退出登录成功", data)
if (userStore.isAuthorized) {
await connectionStore.disconnect()
closeConnectionModal()
}
} catch (error) {
console.error('Error in Logout handler:', error)
}
}


onMounted(async () => {
   
  let retryCount = 0
  let timeoutId: NodeJS.Timeout | undefined
  //document.addEventListener('visibilitychange', handleVisibilityChange);
 
      accountInterval.value = setInterval(async () => {
    try {
       rootStore.checkWebViewBridge()
       if(rootStore.isWebView) return
       
      if (window.metaidwallet && connectionStore.last.status == 'connected' && userStore.isAuthorized) {
        const res = await window.metaidwallet.getAddress()

        if ((res as any)?.status === 'not-connected' || userStore.last?.address !== res) {
          connectionStore.disconnect()
          showToast('Metalet 账户已变更','warning')
        }
      }
    } catch (error) {
      console.error('Error checking account status:', error)
    }
  }, 5 * 1000)
  







  const checkMetalet =  () => {
    rootStore.checkWebViewBridge()
    if (window.metaidwallet) {
      
      try {
          
        ;(window.metaidwallet as any)?.on('accountsChanged',metaletAccountsChangedHandler)
        ;(window.metaidwallet as any)?.on('networkChanged',metaletNetworkChangedHandler)

        ;(window.metaidwallet as any)?.on('LoginSuccess',appLoginSuccessHandler)




        ;(window.metaidwallet as any)?.on('onAccountSwitch',appAccountSwitchHandler)



        ;(window.metaidwallet as any)?.on('Logout',appLogoutHandler)

      } catch (err) {
        
        console.error('Failed to setup Metalet listeners:', err)
      }
    } else if (retryCount * RETRY_INTERVAL < MAX_RETRY_TIME) {
      
      retryCount++
      timeoutId = setTimeout(checkMetalet, RETRY_INTERVAL)
    } else {
      
      console.warn('Metalet wallet not detected after timeout')
    }
  }

  // 初始检查
  checkMetalet()



  if(window.metaidwallet && connectionStore.last.status == 'connected' && userStore.isAuthorized){
      rootStore.checkBtcAddressSameAsMvc().then().catch(()=>{
            showToast('Metalet BTC当前地址与MVC地址不一致，请切换BTC地址与MVC地址一致后再进行使用','warning')
              setTimeout(() => {
                 connectionStore.disconnect()
              }, 3000);

        })



  }


  onUnmounted(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })
})

onBeforeUnmount(async () => {
  // remove event listener
  try {
    ;(window.metaidwallet as any)?.removeListener(
      'accountsChanged',
      metaletAccountsChangedHandler,
    )
    ;(window.metaidwallet as any)?.removeListener(
      'networkChanged',
      metaletNetworkChangedHandler,
    )

    ;(window.metaidwallet as any)?.removeListener('LoginSuccess',appLoginSuccessHandler)
    ;(window.metaidwallet as any)?.removeListener('Logout',appLogoutHandler)
  
    ;(window.metaidwallet as any)?.removeListener(
    'onAccountSwitch',
    appAccountSwitchHandler

    )
  

    clearInterval(accountInterval.value)
  } catch (error) {
    console.error('Error removing event listeners:', error)
  }
})


</script>
<style lang='scss' scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  background: #F5F5F7;
  padding-bottom: 0;
  padding: 0 20px;
}

.app-footer {
  background-color: #F5F5F7;
  padding: 20px 0;
  margin-top: auto;
  border-top: 1px solid #e0e0e0;
  
  .footer-content {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 40px;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 16px;
    }
  }
  
  .footer-text {
    color: #666666;
    font-size: 14px;
    font-weight: 400;
    cursor: pointer;
    transition: color 0.3s ease;
    
    &:hover {
      color: #333333;
    }
  }
}

// 确保页面内容不会与footer重叠
body {
  margin: 0;
  padding: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .app-footer {
    padding: 16px 0;
    
    .footer-content {
      padding: 0 16px;
    }
    
    .footer-text {
      font-size: 13px;
    }
  }
}
</style>