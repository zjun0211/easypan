<template>
    <div>
        <Dialog
            :show="dialogConfig.show"
            :title="dialogConfig.title"
            :buttons="dialogConfig.buttons"
            width="400px"
            :showCancel="false"
            @close="dialogConfig.show = false"
        >
            <div class="navigation-panel">
                
            </div>
            <div class="folder-list" v-if="folderList.length>0">
                <div 
                    class="folder-item"
                    v-for="item in folderList"
                    @click="selectFolder(item)"
                >
                    <Icon :fileType="0"></Icon>
                    <span class="file-name">{{ item.fileName }}</span>    
                </div>
            </div>
            <div v-else>
                移动
                <span>{{ currentFile.fileName }}</span>
            </div>
        </Dialog>
    </div>
</template>
  
<script setup>
import { ref, getCurrentInstance} from 'vue';
const { proxy } = getCurrentInstance();
const emit = defineEmits(['folderSelect']);
const api = {
    loadAllFolder:"/file/loadAllFolder",
}

const dialogConfig = ref({
    show:false,
    title:"移动到",
    buttons:[
        {
            type:"primary",
            click:(e) =>{
                folderSelect();
            },
            text:"移动到此"
        }
    ]
})

// 父级ID
const filePid = ref("0")
const currentFileIds = ref({});
const currentFile = ref({});
const folderList = ref([])

const loadAllFolder = async () =>{
    let result =  await proxy.Request({
        url:api.loadAllFolder,
        params:{
            filePid:filePid.value,
            currentFileIds:currentFileIds.value,
        }
    })
    if (!result) {
        return;
    }
    folderList.value = result.data;
}

const showFolderDialog = (currentFolder) =>{
    dialogConfig.value.show = true;
    currentFileIds.value = currentFolder;
    loadAllFolder();
}

// 选择目录
const selectFolder = (data) =>{

}

// 确定选择目录
const folderSelect = () =>{
    emit('folderSelect',filePid.value);
}

// 关闭
const close = () =>{
    dialogConfig.value.show = false;
}

defineExpose({
    showFolderDialog,
    close,
})
</script>

<style scoped lang='scss'>
.navigation-panel{
    padding-left: 10px;
    background: #f1f1f1;
}
:deep(.el-dialog__body){
    padding: 0;
}
.folder-list{
    .folder-item{
        cursor: pointer;
        display: flex;
        align-items: center;
        padding: 10px;
        .file-name{
            display: inline-block;
            margin-left: 10px;
        }
        &:hover{
            background: #f8f8f8;
        }
    }
    max-height: calc(100vh - 200px);
    min-height: 100px;
}
.tips{
    text-align: center;
    line-height: 200px;
    span{
        color: #06a7ff;
    }
}
</style>