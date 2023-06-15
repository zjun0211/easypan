<template>
    <div class="framework">
        <div class="header">
            <div class="logo">
                <span class="iconfont icon-pan"></span>
                <div class="name">Easy云盘</div>
            </div>
            <div class="right-panel">
                <el-popover
                    :width="800"
                    trigger="click"
                    v-model:visible="showUploader"
                    :offset="20"
                    transition="none"
                    :hide-after="0"
                    :popper-style="{padding:'0'}"
                >
                    <template #reference>
                        <span class="iconfont icon-transfer"></span>
                    </template>
                    <template #default>
                        <Uploader ref="uploaderRef" @uploadCallback="uploadCallbackHandler"></Uploader>
                    </template>
                </el-popover>
                <el-dropdown>
                    <div class="user-info">
                        <div class="avatar">
                            <Avatar :userId="userInfo.userId" :avatar="userInfo.avatar" :timestamp="timestamp" :width="45"></Avatar>
                        </div>
                        <span class="nick-name">{{ userInfo.nickName }}</span>
                    </div>
                    <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item @click="updateAvatar()">修改头像</el-dropdown-item>
                                <el-dropdown-item @click="updatePassword()">修改密码</el-dropdown-item>
                                <el-dropdown-item @click="quit()">退出</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                </el-dropdown>
            </div>
        </div>
        <div class="body">
            <div class="left-sider">
                <div class="menu-list">
                    <div v-for="item in menus" @click="jump(item)" :class="['menu-item',item.menuCode == currentMenu.menuCode?'active':'']" >
                        <div :class="['iconfont','icon-'+ item.icon]"></div>
                        <div class="text">{{ item.name }}</div>
                    </div>
                </div>
                <div class="menu-sub-list">
                    <div @click="jump(sub)" :class="['item-item-sub',currentPath==sub.path?'active':'']" v-for="sub in currentMenu.children">
                        <span :class="['iconfont','icon-'+sub.icon]" v-if="sub.icon"></span>
                        <span class="text">
                            {{ sub.name }}
                        </span>
                    </div>
                    <div class="tips" v-if="currentMenu && currentMenu.tips">
                        {{ currentMenu.tips }}
                    </div>
                    <div class="space-info">
                        <div>空间使用</div>
                        <div class="percent"></div>
                    </div>
                </div>
            </div>
            <div class="body-content">
                <router-view v-slot="{ Component }">
                    <component :is="Component" @addFile="addFile"></component>
                </router-view>
            </div>
        </div>
        <UpdateAvatar ref="updateAvatarRef" @updateAvatar="reloadAvatar"></UpdateAvatar>
        <UpdatePassword ref="updatePasswordRef"></UpdatePassword>
    </div>
</template>

<script setup>
import { ref, reactive, toRefs, onBeforeMount, onMounted, watch, computed, getCurrentInstance, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
const router = useRouter();
const route  = useRoute(); 
const { proxy } = getCurrentInstance();
import menus from '@/assets/json/FrameWork.js'
import UpdateAvatar from './UpdateAvatar.vue'
import UpdatePassword from './UpdatePassword.vue'
import Uploader from './main/Uploader.vue'

const currentMenu = ref({})
const userInfo = ref(proxy.VueCookies.get("userInfo"))
const currentPath = ref()
const timestamp = ref(0)
const updatePasswordRef = ref()
const updateAvatarRef =ref()
const uploaderRef = ref()
const showUploader = ref(false)

const api = {
    quit:'/logout'
}

// 添加文件
const addFile = (data) =>{
    const { file, filePid } = data;
    showUploader.value = true;
    uploaderRef.value.addFile(file,filePid);
}
// 上传文件回调
const uploadCallbackHandler = () =>{
    nextTick(()=>{
        // 更新用户空间
    })
}

//  内容跳转
const jump = (data) =>{
    if (!data.path || data.menuCode==currentMenu.value.menuCode) {
        return;
    }
    router.push(data.path);
}
//  获取激活的一级路由信息
const setMenu = (menuCode,path) =>{
    const menu = menus.find(item => {
        return item.menuCode == menuCode
    })
    currentMenu.value = menu
    currentPath.value = path
}

// 监听一级路由的变化更改二级路由
watch(() =>route,(nval,oval) =>{
    if (nval.meta.menuCode) {
        setMenu(nval.meta.menuCode,nval.path);
    }
},{immediate:true,deep:true})

// 把用户信息发送给修改头像组件,并显示修改框
const updateAvatar = () =>{
    updateAvatarRef.value.show(userInfo.value);
}
// 重新加载更新后的头像
const reloadAvatar = () =>{
    userInfo.value = proxy.VueCookies.get('userInfo');
    timestamp.value = new Date().getTime();
}
// 把用户信息发送给修改头像组件,并显示修改框
const updatePassword = () =>{
    updatePasswordRef.value.show();
}
// 退出
const quit = async() =>{
    let funok = async function(){
        let result = await proxy.Request({
            url:api.quit
        })
        if(!result){
            return;
        }
        proxy.VueCookies.remove("userInfo");
        router.push("/login");
    }
    proxy.Confirm("你确定要退出么？",funok);
    
}
</script>

<style scoped lang="scss">
.header{
    box-shadow: 0 3px 10px 0 rgb(0 0 0  / 6%);
    height: 56px;
    padding-left: 24px;
    padding-right: 24px;
    position: relative;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .logo{
        display: flex;
        align-items: center;
        .icon-pan{
            font-size: 40px;
            color:#1296db;
        }
        .name{
            font-weight: bold;
        }
    }
    .right-panel{
        display:flex;
        align-items: center;
        .user-info{
            padding: 0 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            &:focus-visible{
                outline: none;
            } 
        }
    }
}
.body{
    display: flex;
    .left-sider{
        box-shadow: 0 20px 10px 0 rgba(0,0,0,6%);
        display: flex;

        .menu-list{
            box-shadow: 0 20px 10px 0 rgba(0,0,0,6%);
            height: calc(100vh - 56px);
            display: flex;
            flex-direction: column;
            width: 80px;
            text-align: center;
            font-weight: bolder;
            .active{
                .iconfont{
                    color: #06a7ff;
                }
                .text{
                    color: #06a7ff;  
                }
            }
            .menu-item{
                &:hover{
                    background-color: #dedede90;
                    cursor: pointer;
                }
                padding: 10px 16px;
                .iconfont{
                    font-size: 24px;
                }
                .text{
                      font-size: 16px;
                }
            }
        }
        .menu-sub-list{
            width: 150px;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 10px 10px;
            .active{
                background-color: #06a7ff20;
                .iconfont{
                    color: #06a7ff;
                }
                .text{
                    color: #06a7ff;  
                }
            }
            .item-item-sub{
                width: 100%;
                display: flex;
                justify-content: center;
                padding: 5px 0;
                border-radius: 5px;
                &:hover{
                    background-color: #06a7ff30;
                    cursor: pointer;
                }
                .iconfont{
                    font-size: 18px;
                }
                .text{
                    font-size: 16px;
                    padding-left: 10px;
                }
            }
            .space-info{
                position: absolute;
                bottom: 20px;
            }
            .tips{
                font-size: 12px;
                padding: 2px 10px;
                color: #00000080;
            }
        }
    }
    .body-content{
        flex: 1;
    }
}
</style>
