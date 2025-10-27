import {type Network } from '@/stores/network'

export const NETWORK: Network = import.meta.env.VITE_NET_WORK_NEW || 'livenet'

export const SIGNING_MESSAGE =import.meta.env.VITE_APP_NAME

export const MAN_PUB_KEY='048add0a6298f10a97785f7dd069eedb83d279a6f03e73deec0549e7d6fcaac4eef2c279cf7608be907a73c89eb44c28db084c27b588f1bd869321a6f104ec642d'

export const NodeName = {
    SimpleBuzz: 'simplebuzz',
    PayComment: 'paycomment',
    PayLike: 'paylike',
    File:'file',
    MetaProtocol: 'metaprotocol',
    MetaApp: 'metaapp',
} as const;

export type NodeName = typeof NodeName[keyof typeof NodeName];

export const NodeCollection={
    [NodeName.File]:{
        path:'/file',
        body:'',
        contentType:'',
        encryption: '0',
        version: '1.0.0',
        encoding: ''
    }
}

export const ProtocolCollection = {
    // Example usage with NodeName type
    [NodeName.SimpleBuzz]: {
        protocol: 'simplebuzz',
        path: '/protocols/simplebuzz',
        body:{
            content:'',//buzz消息内容
            contentType:'application/json',
            attachments:[], //附件列表,格式为['metafile://{PinID}'],其中PinID为附件的PinID
            quotePin:'' //引用的buzz PinID,如果是转发则需要指定
        },
        contentType: 'text/plain;utf-8',
        encryption: '0',
        version: '1.0.0',
        encoding: 'utf-8'
    },

    [NodeName.PayLike]: {
        protocol: 'paylike',
        path: '/protocols/paylike',
        body:{
            isLike:'1', //1 点赞 0 取消点赞
            likeTo:'' //要指定点赞的buzz PinID
        },
        contentType: 'text/plain;utf-8',
        encryption: '0',
        version: '1.0.0',
        encoding: 'utf-8'
    },

    [NodeName.PayComment]: {
        protocol: 'paycomment',
        path: '/protocols/paycomment',
        body:{
            content:'', //评论内容
            contentType:'application/json;utf-8', 
            commentTo:''   //要指定评论的 PinID
        },
        contentType: 'text/plain;utf-8',
        encryption: '0',
        version: '1.0.0',
        encoding: 'utf-8'
    },

    [NodeName.MetaProtocol]: {
        protocol: 'metaprotocol',
        path: '/protocols/metaprotocol',
        body:{
            title: '', // 协议标题
            protocolName: '', // 协议名称
            version: '1.0.0', // 协议版本
            protocolContent: '', // 协议内容(JSON5格式)
            protocolContentType: 'application/json5', // 协议主体类型
            metadata: {} // 元数据
        },
        contentType: 'application/json5',
        encryption: '0',
        version: '1.0.0',
        encoding: 'utf-8'
    },

    [NodeName.MetaApp]: {
        protocol: 'metaapp',
        path: '/protocols/metaapp',
        body:{
            //MetaApp标题
            title:"", 
            //MetaApp应用名称
            appName:"",
            //MetaApp生成提示词，如AI生成项目则填写，如开发者自行开发的则不需要填写
            prompt:"",
            //MetaApp Icon,格式是metaifile://{PINID}
            icon:"metafile://",
            //MetaApp 封面图,格式是metaifile://{PINID}
            coverImg:"metafile://",
            //MetaApp 简介图,格式是metaifile://{PINID}数组
            introImgs:["metafile://"],
            //MetaApp 应用说明简介
            intro:"introduction about this app",
            //MetaApp 运行时环境
            runtime:"browser/android/ios/windows/macOS/Linux",
            //MetaApp 索引文件
            indexFile:"",
            //MetaApp 版本号，默认v1.0.1
            version:"",
            //MetaApp conetent类型，默认application/zip
            contentType:"application/zip",
            //MetaApp conetent,内容为要上链的MetaApp构建压缩包的上链资源，格式是metaifile://{PINID}
            content:"metafile://",
            //MetaApp conetent,内容为要上链的MetaApp源码的上链资源，格式是metacode://{PINID}
            code:"metacode://",
            //MetaApp conetent hash结果
            contentHash:"xxx",
            //MetaApp 可选扩展内容，格式可以是任意类型格式
            metadata:"Arbitrary data"
        },
        contentType: 'application/json',
        encryption: '0',
        version: '1.0.0',
        encoding: 'utf-8'
    },

};