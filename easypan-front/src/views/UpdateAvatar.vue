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
    <el-form
        :model="formData"
        ref="formDataRef"
        label-width="80px"
        @submit.prevent
    >
        <el-form-item label="昵称">
            {{ formData.nickName }}
        </el-form-item>
        <el-form-item label="头像" prop="">
            <AvatarUpdate v-model="formData.avatar"></AvatarUpdate>
        </el-form-item>
    </el-form>    
    </Dialog>
  </div>
</template>

<script setup>
import { getCurrentInstance, ref,reactive} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AvatarUpdate from '@/components/AvatarUpload.vue'

const { proxy } = getCurrentInstance();
const router = useRouter();
const api = {
    updateUserAvatar:'updateUserAvatar'
}
const formData = ref({})
const formDataRef = ref()

const emit = defineEmits()

const submitForm = async() =>{
    if (!(formData.value.avatar instanceof File)) {
        dialogConfig.value.show = false;
        return;
    }
    let result = await proxy.Request({
        url:api.updateUserAvatar,
        params:{
            avatar:formData.value.avatar
        }
    })
    if (!result) {
        return;
    }
    dialogConfig.value.show = false;
    const cookiesUserInfo = proxy.VueCookies.get("userInfo");
    delete cookiesUserInfo.avatar;
    proxy.VueCookies.set("userInfo",cookiesUserInfo,0);
  
    emit("updateAvatar");
}

const show = (data) =>{
    formData.value = Object.assign({},data);
    formData.value.avatar = { userId:data.userId,qqAvatar:data.qqAvatar}
    dialogConfig.value.show = true
}

defineExpose({
    show
})

const dialogConfig = ref({
    show:false,
    title:'标题',
    buttons:[
        {
            type:'danger',
            text:'确定',
            click:(e) =>{
                submitForm();
            }
        }
    ]
})

</script>
<style scoped lang='scss'>
</style>