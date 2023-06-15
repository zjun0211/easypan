<template>
  <div>
    <div class="top">
      <div class="top-op">
        <div class="btn">
          <el-upload
            :show-file-list="false"
            :with-credentials="true"
            :multiple="true"
            :http-request="addFile"
            :accept="fileAccet"
          >
            <el-button type="primary">
              <span class="iconfont icon-upload"> 上传 </span>
            </el-button>
          </el-upload>
        </div>
        <el-button type="success" @click="newFoloder">
          <span class="iconfont icon-folder-add"> 新建文件夹 </span>
        </el-button>
        <el-button type="danger" :disabled="selectFileIdList.length==0" @click="delFileBatch">
          <span class="iconfont icon-del"> 批量删除 </span>
        </el-button>
        <el-button type="warning" :disabled="selectFileIdList.length==0" @click="moveFolderBatch">
          <span class="iconfont icon-del"> 批量移动 </span>
        </el-button>
        <div class="search-panel">
          <el-input clearable placeholder="请输入文件名搜索">
            <template #prefix>
              <i class="icnofont icon-search"></i>
            </template>
          </el-input>
        </div>
        <div class="iconfont icon-refresh"></div>
      </div>
      <Navigation ref="NavigationRef"></Navigation>
      <div class="file-list">
        <Table
          ref="dataTableRef"
          :columns="columns"
          :dataSource="tableData"
          :fetch="loadDataList"
          :options="tableOptions"
          :initFetch="true"
          @rowSelected="rowSelected"
          @rowClick="rowClick"
        >
          <template #fileName="{ index, row }">
            <div
              class="file-name"
              @mouseenter="showOp(row)"
              @mouseleave="cancalShowOp(row)"
            >
              <template
                v-if="(row.fileType == 3 || row.fileType == 1) && row.status == 2"
              >
                <Icon :cover="row.fileCover" :width="32" ></Icon>
              </template>
              <template v-else>
                <Icon v-if="row.folderType == 0" :fileType="row.fileType"></Icon>
                <Icon v-if="row.folderType == 1" :fileType="0"></Icon>
              </template>
              <span class="file-name" :title="row.fileName" v-show="!row.showEdit">
                <span @click="preview(row)">{{ row.fileName }}</span>
                <span v-if="row.status == 0" class="transfer-status">转码中</span>
                <span v-if="row.status == 1" class="transfer-status transfer-fail"
                >转码失败
                </span>
              </span>
              <!-- 添加文件夹 || 重命名 -->
              <div class="edit-panel" v-if="row.showEdit" @focusout="cancalNameEdit(index)">
                  <el-input 
                    v-model.trim="row.fileNameReal" 
                    ref="editNameRef"
                    :maxLength="190"
                    @keyup.enter="saveNameEdit(index)"  
                  >
                      <template #suffix>
                        {{ row.fileSuffix }}
                      </template>
                  </el-input>
                  <span 
                    :class="['iconfont icon-right1',row.fileNameReal?'':'not-allow']"
                    @click="saveNameEdit(index)"
                  ></span> 
                  <span class="iconfont icon-error" @click="cancalNameEdit(index)"></span>
              </div>
              <span class="op">
                <template v-if="row.showOp && row.fileId && row.status == 2">
                  <span class="iconfont icon-share1">分享</span>
                  <span class="iconfont icon-download" v-if="row.folderType==0">下载</span>
                  <span class="iconfont icon-del" @click="delFile(row)">删除</span>
                  <span class="iconfont icon-edit" @click="editFileName(index)">重命名</span>
                  <span class="iconfont icon-move" @click="moveFolder(row)">移动</span>
                </template>
              </span>
            </div>
          </template>
          <template #fileSize="{index,row}">
            <span v-if="row.fileSize">
              {{ proxy.Utils.size2Str(row.fileSize) }}
            </span>
          </template>
        </Table>
      </div>
    </div>
    <FolderSelect ref="FolderSelectRef" @folderSelect="moveFolderDone"></FolderSelect>  
  </div>
</template>

<script setup>
import { getCurrentInstance, nextTick, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
const { proxy } = getCurrentInstance();

// 变量
const api = {
  loadDataList: "/file/loadDataList",
  rename: "/file/rename",
  newFoloder: "/file/newFoloder",
  getFolderInfo: "/file/getFolderInfo",
  delFile: "/file/delFile",
  chamgeFileFolder: "/file/chamgeFileFolder",
  createDownloadUrl: "/file/createDownloadUrl",
  download: "/api/file/download",
};

const emit = defineEmits(["addFile"]);

const columns = [
  {
    label: "文件名",
    prop: "fileName",
    scopedSlots: "fileName",
  },
  {
    label: "修改时间",
    prop: "lastUpdateTime",
    width: 200,
  },
  {
    label: "大小",
    prop: "fileSize",
    scopedSlots: "fileSize",
    width: 200,
  },
];
const fileNameFuzzy = ref();
const tableData = ref({});
const tableOptions = ref({
  exHeight: 50,
  selectType: "checkbox",
});
const category = ref();
// 当前目录
const currentFolder = ref({ fileId:0});

// 编辑行
const editing = ref(false)

const editNameRef = ref()

// 多选
const selectFileIdList = ref([]);

const FolderSelectRef = ref();

const currentMoveFile = ref({});

const NavigationRef = ref();

// 方法

// 添加文件
const addFile = (fileData) =>{
  emit("addFile",{file:fileData.file,filePid:currentFolder.value.fileId})
}

// 获取数据
const loadDataList = async () => {
  let params = {
    category: category.value,
    pageNo: tableData.value.pageNo,
    pageSize: tableData.value.pageSize,
    fileNameFuzzy: fileNameFuzzy.value,
    filePid: 0,
  };
  if (params.category !== "all") {
    delete params.filePid;
  }
  let result = await proxy.Request({
    url: api.loadDataList,
    params: params,
  });
  if (!result) {
    return;
  }
  tableData.value = result.data;
};
//展示操作按钮
const showOp = (row) =>{
    tableData.value.list.forEach(element => {
      element.showOp = false;
    });
    row.showOp = true;
}

const cancalShowOp = (row) =>{
  row.showOp = false;
}
// 新建文件夹
const newFoloder = () =>{
  if (editing.value) {
    proxy.Message.warning("有内容正在编辑",() =>{})
    return;
  }
  tableData.value.list.forEach(element =>{
    element.showEdit = false
  });
  editing.value = true;
  tableData.value.list.unshift({
    showEdit:true,
    fileType:0,
    fileId:"",
    filePid:0,
  })
  nextTick(()=>{
    editNameRef.value.focus();    
  })
}
// 重命名
const editFileName = (index) =>{
  if (tableData.value.list[0].fileId=="") {
    tableData.value.list.splice(0,1);
    index -= 1;
  }
  tableData.value.list.forEach(element =>{
      element.showEdit = false;
  })
  let currentData = tableData.value.list[index];
  currentData.showEdit = true;
  // 编辑文件
  if (currentData.folderType==0) {
    currentData.fileNameReal = currentData.fileName.substring(0,currentData.fileName.indexOf('.'));
    currentData.fileSuffix = currentData.fileName.substring(currentData.fileName.indexOf('.'));
  } else {
    currentData.fileNameReal = currentData.fileName;
    currentData.fileSuffix = "";
  }
  editing.value = true;
  nextTick(() =>{
      editNameRef.value.focus();
  })
}
// 保存新建的文件夹
const saveNameEdit = async(index) =>{
  const { fileId, filePid, fileNameReal } = tableData.value.list[index];
  if (fileNameReal==""||fileNameReal.indexOf('/')!=-1) {
    proxy.Message.warning("文件名不能为空且不能含有斜杠");
    return;
  }
  let url = api.rename;
  if(fileId==""){
    url = api.newFoloder;
  }
  let result = await proxy.Request({
    url:url,
    params:{
      fileId:fileId,
      filePid:filePid,
      fileName:fileNameReal,
    }
  });
  if (!result) {
    return;
  }
  tableData.value.list[index] = result.data;
  editing.value = false;
}
// 取消新建的文件夹
const cancalNameEdit = (index) =>{
  const fileData =  tableData.value.list[index];
  if (fileData.fileId) {
    fileData.showEdit = false;
  } else {
    tableData.value.list.splice(index,1);
  }
  editing.value = false;
}
// 获取勾选的列
const rowSelected = (row) => {
  selectFileIdList.value = [];
  row.forEach(item => {
    selectFileIdList.value.push(item.fileId);
  });
};

const rowClick = (rows) => {

};

// 文件删除
const delFile = (row) =>{
  proxy.Confirm(`你确定要删除${row.fileName}吗？删除的文件可在10天内通过回收站还原`,async ()=>{
    let result = await proxy.Request({
         url:api.delFile,
         params:{
           fileIds:row.fileId 
         },
      });
      if(!result){
        return;
      }
      loadDataList(); 
  });
}
// 文件多选删除
const delFileBatch = async() =>{
    if (selectFileIdList.value.length == 0) {
      return;
    }
    proxy.Confirm(`你确定要删除这些文件么？删除的文件可在10天内通过回收站还原`,async ()=>{
      let result = await proxy.Request({
         url:api.delFile,
         params:{
           fileIds:selectFileIdList.value.join(",")
         },
      });
      if(!result){
        return;
      }
      loadDataList(); 
    });
}

// 文件多选移动
const moveFolderBatch = () =>{
  currentMoveFile.value = {};
  FolderSelectRef.value.showFolderDialog(currentFolder.value.fileId);
}
// 文件移动
const moveFolder = (data) =>{
  currentFolder.value = data;
  FolderSelectRef.value.showFolderDialog(currentFolder.value.fileId);
}
//   
const moveFolderDone = async(folderId) =>{
  if (currentFolder.value.fileId == folderId) {
    proxy.Message.warning('文件正在当前目录,无需移动');
  }
  let fileIdsArray= [];
  if (currentMoveFile.value.fileId) {
    fileIdsArray.push(currentFolder.value.fileId);
  } else {
    fileIdsArray = fileIdsArray.concat(selectFileIdList.value);
  }
  let result = await proxy.Request({
    url:api.chamgeFileFolder,
    params:{
      fileIds:fileIdsArray.join(","),
      filePid:folderId
    }
  });
  if (!result) {
    return;
  }
  FolderSelectRef.value.close();
  loadDataList();
}
// 预览
const preview = (row) =>{
  // 目录
  if (row.folderType == 1) {
    NavigationRef.value.openFolder(row);
  }
}
</script>
<style scoped lang="scss">
@import "../../assets/file.list.scss";

</style>
