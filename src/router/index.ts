import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'MetaApp',
    component: () => import('@/views/MetaApp.vue'),
    meta: {
      navKey: 'metaapp'
    }
  },
  {
    path: '/metaapp/detail/:pinid',
    name: 'MetaAppDetail',
    component: () => import('@/views/MetaAppDetail.vue'),
  },
   {
    path: '/metaprotocol',
    name: 'MetaProtocol',
    component: () => import('@/views/Protocol.vue'), // 临时使用相同组件
    meta: { 
      navKey: 'metaprotocol'
    }
  },
  {
    path: '/protocols/:id',
    name: 'ProtocolDetail',
    component: () => import('@/views/ProtocolDetailView.vue'),
  
  },
  {
    path: '/develop',
    name: 'Develop',
    component: () => import('@/views/Develop.vue'),
    meta: { 
      navKey: 'develop'
    }
  },
  // },
  // {
  //   path: '/services',
  //   name: 'Services',
  //   component: () => import('@/views/Protocol.vue'), // 临时使用相同组件
  //   meta: { 
     
  //     navKey: 'services'
  //   }
  // },
  // {
  //   path: '/docs',
  //   name: 'Docs',
  //   component: () => import('@/views/Protocol.vue'), // 临时使用相同组件
  //   meta: { 
    
  //     navKey: 'docs'
  //   }
  // },
  // {
  //   path: '/community',
  //   name: 'Community',
  //   component: () => import('@/views/Protocol.vue'), // 临时使用相同组件
  //   meta: { 
    
  //     navKey: 'community'
  //   }
  // }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 路由守卫：设置页面标题和加载状态
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'MetaWeb'} - MetaWeb World`

  // 检测是否是外部直接访问 /metaapp/detail/:pinid
  // 如果 from.name 为 undefined，说明是首次访问（外部跳转）
  const layoutStore = useLayoutStore()
  if (to.name === 'MetaAppDetail' && !from.name) {
    layoutStore.setPageLoading(true)
  }

  next()
})

export default router
