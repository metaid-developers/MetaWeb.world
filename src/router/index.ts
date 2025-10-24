import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Protocol',
    component: () => import('@/views/Protocol.vue'),
    meta: { 
      navKey: 'protocol'
    }
  },
  {
    path: '/protocol/:id',
    name: 'ProtocolDetail',
    component: () => import('@/views/ProtocolDetailView.vue'),
    meta: { 
      navKey: 'protocol'
    }
  },
  // {
  //   path: '/metaapp',
  //   name: 'MetaApp',
  //   component: () => import('@/views/Protocol.vue'), // 临时使用相同组件
  //   meta: { 
   
  //     navKey: 'metaapp'
  //   }
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
  //   path: '/develop',
  //   name: 'Develop',
  //   component: () => import('@/views/Protocol.vue'), // 临时使用相同组件
  //   meta: { 
    
  //     navKey: 'develop'
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

// 路由守卫：设置页面标题
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || 'MetaWeb'} - MetaWeb World`
  next()
})

export default router
