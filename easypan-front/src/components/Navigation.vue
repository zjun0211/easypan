<template>
  <div class="top-navigation">
    <template v-if="folderList.length>0">
        <span class="back link" @click="backParent">
           返回上一级 
        </span>
        <el-diver direction="vertical"></el-diver>
    </template> 
    <span v-if="folderList.length==0" class="all-file">全部文件</span>
    <span v-if="folderList.length>0" class="link">全部文件</span>
    <template v-for="(item,index) in folderList">
        <span class="iconfont icon-right"></span>
        <span class="link" v-if="index < folderList.length - 1" @click="setCurrentFolder(index)">
            {{ item.fileName }}
        </span>
        <span v-if="index==folderList.length-1" class="text" >{{ item.fileName }}</span>
   
    </template>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance, watch} from 'vue';
import { useRoute, useRouter } from 'vue-router';
const { proxy } = getCurrentInstance();
const route = useRoute();
const router = useRouter();

const props = defineProps({
    watchPath:{
        type:Boolean,
        default:true,
    },
    shareId:{
        type:String
    },
    adminShow:{
        type:Boolean,
        default:false
    }
})

const api = {
    getFolderInfo:"/file/getFolderInfo",
    getFolder4Share:"/showShare/getFolderInfo",
    getFolder4Admin:"/admin/getFolderInfo"
};

// 分类
const category = ref();
// 目录集合
const folderList = ref([]);
// 当前目录
const currentFolder = ref({fileId:0});

const openFolder = (data) =>{
    const { fileId, fileName } = data;
    const folder = {
        fileName:fileName,
        fileId:fileId,
    }
    folderList.value.push(folder);
    currentFolder.value = folder;
    setPath();
};

const setPath = () =>{
    if (!props.watchPath) {
        // todo 设置不监听回调
        return;
    }
    let pathArray = [];
    folderList.value.forEach(item =>{
        pathArray.push(item.fileId);
    })
    router.push({
        path:route.path,
        query:pathArray.length==0?"":{path:pathArray.join("/")},
    })
}

// 获取当前路径的目录
const getNavigationFolder = async(path) =>{
    let url = api.getFolderInfo;
    if (proxy.shareId) {
        url = api.getFolder4Share;
    }
    if (proxy.adminShow) {
        url = api.getFolder4Admin;
    }
    let result = await proxy.Request({
        url:url,
        showLoading:false,
        params:{
            path:path,
            shareId:props.shareId,
        }
    })
    if (!result) {
        return;
    }
    folderList.value = result.data;
}

const setCurrentFolder = (index) =>{

}

watch(()=>route,(nval,oval) => {
    if (!props.watchPath) {
        return;
    }
    if (nval.path.indexOf("/main")===-1) {
        return;
    }
    const path = nval.query.path;
    category.value = nval.params.category;
    if (path==undefined) {
        
    } else{
        getNavigationFolder(path);
        let pathArray = path.split("/");
        currentFolder.value = {
            fileId:pathArray[pathArray.length - 1]
        }
    }
},{immediate:true,deep:true})

defineExpose({
    openFolder,
})
</script>
<style scoped lang='scss'>
.top-navigation{
    font-size: 13px;
    display: flex;
    align-items: center;
    line-height: 40px;
    .all-file{
        font-weight: bold;
    }
    .link{
        color: #06a7ff;
        cursor: pointer;
    }
    .icon-right{
        color: #06a7ff;
        padding: 0 5px;
        font-size: 13px;
    }
}
</style>