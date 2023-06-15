<template>
  <div class="uploader-panel">
    <div class="uploader-title">
        <span>上传任务</span>
        <span class="tips">(仅展示本次上传任务)</span>
    </div>
    <div class="file-list">
        <div v-for="(item,index) in fileList" class="file-item">
            <div class="upload-panel">
                <div class="file-name">
                    {{ item.fileName }}
                </div>
                <div class="progress">
                    <el-progress
                        :percentage="item.uploadProgress"
                        v-if="
                            item.status==STATUS.uploading.value ||
                            item.status==STATUS.upload_seconds||
                            item.status==STATUS.upload_finish
                        "
                     
                    >
                    </el-progress>
                </div>
                <div class="upload-status">
                    <span :class="['iconfont','icon-'+STATUS[item.status].icon]" :style="{color:STATUS[item.status].color}"></span>
                    <span class="status" :style="{color:STATUS[item.status].color}">
                        {{ item.status=="fail"?item.errorMsg:STATUS[item.status].desc }}
                    </span>
                    <span class="upload-info" v-if="item.status==STATUS.uploading.value">
                        {{ proxy.Utils.size2Str(item.uploadSize)}} / {{proxy.Utils.size2Str(item.totalSize)}}
                    </span>
                </div>

            </div>
            <div class="op">
                <el-progress
                    type="circle"
                    :width="50"
                    :percentage="item.md5Progress"
                    v-if="item.status==STATUS.init.value"
                ></el-progress>
                <div class="op-btn">
                    <span v-if="item.status==STATUS.uploading.value">
                        <Icon :width="28" class="btn-item" iconName="upload" v-if="item.pause" title="上传" @click="startUpload(item.uid)"></Icon>
                        <Icon :width="28" class="btn-item" iconName="pause" v-else title="暂停" @click="pauseUpload(item.uid)"></Icon>
                    </span>
                    <Icon 
                        :width="28"
                        class="del btn-item"
                        iconName="del"
                        v-if="
                            item.status!=STATUS.init.value&&
                            item.status!=STATUS.upload_finish.value&&
                            item.status!=STATUS.upload_seconds
                        "
                        title="删除" 
                        @click="delUpload(item.uid,index)"
                        ></Icon>
                    <Icon 
                        :width="28"
                        class="del btn-item"
                        iconName="del"
                        v-if="
                            item.status == STATUS.upload_finish.value||
                            item.status == STATUS.upload_seconds.value
                        "
                        title="清除"
                        @click="delUpload(item.uid,index)"
                    ></Icon>
                </div>
            </div>
        </div>
        <div v-if="fileList.length==0" class="no-datamsg">
            <NoData :msg="NoDatamsg"></NoData>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance} from 'vue';
import { useRoute, useRouter } from 'vue-router';
const { proxy } = getCurrentInstance();
import NoData from '@/components/NoData.vue'
import SparkMD5 from 'spark-md5'
const emit = defineEmits(['uploadCallback']);

const api = {
    upload:'/file/uploadFile'
}
// 上传状态
const STATUS = {
    emptyFile:{
        value:"emptyfile",
        desc:'文件为空',
        color:'#f75000',
        icon:'close'
    },
    fail:{
        value:"fail",
        desc:'上传失败',
        color:'#f75000',
        icon:'close'
    },
    init:{
        value:"init",
        desc:'解析中',
        color:'#e6a23c',
        icon:'clock'
    },
    uploading:{
        value:"uploading",
        desc:'上传中',
        color:'#409eff',
        icon:'upload'
    },
    upload_finish:{
        value:"upload_finish",
        desc:'上传完成',
        color:'#67c23a',
        icon:'ok'
    },
    upload_seconds:{
        value:"upload_seconds",
        desc:'秒传',
        color:'#67c23a',
        icon:'ok'
    },
}

const NoDatamsg = '暂无任务'
const chunkSize = 1024*1024*5;
const fileList = ref([]);
const delList = ref([]);

// 计算MD5
const computeMD5 = (fileItem) =>{
    let file = fileItem.file;
    let blobSlice = File.prototype.slice||File.prototype.mozSlice||File.prototype.webkitSlice;
    let chunks = Math.ceil(file.size/chunkSize);
    let currentChunk = 0;
    let spark = new SparkMD5.ArrayBuffer();
    let fileReader = new FileReader();

    let loadNext = () =>{
        let start = currentChunk*chunkSize;
        let end = start + chunkSize>=file.size?file.size:start+chunkSize;
        fileReader.readAsArrayBuffer(blobSlice.call(file,start,end));
    };
    loadNext();

    return new Promise((resolve,reject) =>{
        let resultFile = getFileByUid(file.uid);
        fileReader.onload = (e) =>{
            spark.append(e.target.result);
            currentChunk++;
            if (currentChunk<chunks) {
                let percent = Math.floor((currentChunk/chunks)*100);
                resultFile.md5Progress = percent;
                loadNext();
            } else {
                let md5 = spark.end();
                spark.destroy();
                resultFile.md5Progress = 100;
                resultFile.status = STATUS.uploading.value;
                resultFile.md5 = md5;
                resolve(fileItem.uid);
            }
        };
        fileReader.onerror =  ()=>{
            resultFile.md5Progress = -1;
            resultFile.status = STATUS.fail.value;
            resolve(fileItem.uid);
        } 
    }).catch((err) =>{
        console.log(err);
        return null;
    });
};
// 获取文件
const getFileByUid = (uid) =>{
     let file = fileList.value.find(item =>{
        return item.file.uid === uid;
     })
     return file;
}

const uploadFile = async(uid,chunkIndex) =>{
    chunkIndex = chunkIndex ? chunkIndex : 0;
    // 分片下载
    let currentFile = getFileByUid(uid);
    const file = currentFile.file;
    const fileSize = currentFile.totalSize;
    const chunks = Math.ceil(fileSize/chunkSize);
    for (let i = 0; i < chunks; i++) {
        let delIndex = delList.value.indexOf(uid);
        if (delIndex!=-1) {
            delList.value.splice(delIndex,1);
            break;
        }
        currentFile = getFileByUid(uid);
        if (currentFile.pause) {
            break;
        }   
        let start = i*chunkSize;
        let end = start+chunkSize>=fileSize?fileSize:start+chunkSize;
        let chunkFile = file.slice(start,end);
        let updateResult = await proxy.Request({
            url:api.upload,
            showLoading:false,
            dataType:"file",
            params:{
                file:chunkFile,
                fileName:file.name,
                fileMd5:currentFile.md5,
                chunkIndex:i,
                chunks:chunks,
                fieldId:currentFile.fileId,
                filePid:currentFile.filePid,
            },
            showError:false,
            errorCallback:(errorMsg) =>{
                currentFile.status = STATUS.fail.value;
                currentFile.errorMsg = errorMsg;
            },
            uploadProgressCallback:(event) =>{
                let loaded = event.loaded;
                if (loaded>fileSize) {
                    loaded = fileSize;
                }
                currentFile.uploadSize = i*chunkSize + loaded;
                currentFile.uploadProgress = Math.floor((currentFile.uploadSize/fileSize) * 100);
            }
        })
        if (updateResult == null) {
            break;
        }
        currentFile.fieldId = updateResult.data.fieldId;
        currentFile.status = STATUS[updateResult.data.status].value
        currentFile.chunkIndex = i;
        if (updateResult.data.status == STATUS.upload_seconds.value||updateResult.data.status==STATUS.upload_finish.value) {
            currentFile.uploadProgress = 100;
            emit('uploadCallback');
            break;
        }
    };
};

const pauseUpload = (uid) =>{

}
const delUpload = (uid) =>{

}
const  addFile = async(file, filePid) =>{
    const fileItem = {
        // 文件，文件大小，文件流，文件名...
        file:file,
        // 文件uid
        uid:file.uid,
        // md5进度条
        md5Progress:0,
        // m5值
        md5:null,
        fileName:file.name,
        // 上传状态
        status:STATUS.init.value,
        // 已上传大小
        uploadSize:0,
        // 文件总大小
        totalSize:file.size,
        // 上传进度
        uploadProgress:0,
        // 暂停
        pause:false,
        // 当前分片
        chunkIndex:0,
        // 文件父级ID
        filePid:filePid,
        // 错误信息
        errorMsg:null,
    };
    fileList.value.unshift(fileItem);
    // 判断上传文件是否为空
    if (fileItem.totalSize == 0) {
        fileItem.status = STATUS.emptyFile.value;
        return;
    }
    let md5FileUid = await computeMD5(fileItem);
    if (md5FileUid==null) {
        return;
    }
    uploadFile(md5FileUid);
}

defineExpose({
    addFile
})
</script>
<style scoped lang='scss'>
.uploader-panel{
    .uploader-title{
        border-bottom: 1px solid #ddd;
        line-height: 40px;
        padding: 0 10px;
        font-size: 15px;
        .tips{
            font-size: 13px;
            color: rgb(169, 169, 169);
        }
    }
    .file-list{
        overflow: auto;
        padding: 10px ;
        min-height: calc(100vh /4);
        max-height: calc(100vh - 120px);
        .file-item{
            display: flex;
            align-items: center;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
            .upload-panel{
                flex:1;
                .file-name{
                font-size: 16px;
                font-weight: bold;
                }
                .upload-status{
                    .iconfont{
                        margin-right: 10px;
                    }
                    .upload-info{
                        margin-left: 10px;
                    }
                }
             }
            .op{
                margin-right: 20px;
                width: 80px;
                text-align: center;
                .op-btn{
                    .btn-item{
                        cursor: pointer;
                    }
                }
                .del,
                .clean{
                    margin-left: 5px;
                }
            }
        }
        .no-datamsg{
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
    }
}
</style>