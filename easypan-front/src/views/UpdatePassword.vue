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
            :rules="rules"
            @submit.prevent
        >
            <el-form-item label="新密码" prop="password">
                    <el-input
                        type="password"
                        size="large"
                        placeholder="提示信息"
                        v-model.trim="formData.password"
                        show-password
                    >
                        <template #prefix>
                            <span class="iconfont icon-password"></span>
                        </template>
                    </el-input>
            </el-form-item>
            <el-form-item label="确定密码" prop="rePassword">
                    <el-input
                        type="password"
                        size="large"
                        placeholder="请再次输入密码"
                        v-model.trim="formData.rePassword"
                        show-password
                    >
                        <template #prefix>
                            <span class="iconfont icon-password"></span>
                        </template>
                    </el-input>
            </el-form-item>
            
        </el-form>    
      </Dialog>
    </div>
</template>
  
<script setup>
import { getCurrentInstance, ref,reactive, nextTick} from 'vue';
import { useRoute, useRouter } from 'vue-router';

const { proxy } = getCurrentInstance();
const router = useRouter();
const api = {
    updatePassword:'updatePassword'
}
const formData = ref({})
const formDataRef = ref()
const emit = defineEmits()



// 效验再次输入密码
const checkRePassword = (rule,value,callback) =>{
    if (value !== formData.value.password) {
        callback(new Error(rule.message));
    } else {
        callback();
    }
}

const rules = {
    password:[
        {required:true,message:'请输入密码'},
        {validator:proxy.Verify.password,message:'密码只能是数字,字母,特殊字符8-18位'}
    ],
    rePassword:[
        { required:true,message:'请再次输入密码'},
        { validator:checkRePassword,message:'二次密码不一样'}
    ]
}


const submitForm = async() =>{
    formDataRef.value.validate(async(valid)=>{
        if (!valid) {
            return;
        }
    })
    let result = await proxy.Request({
        url:api.updatePassword,
        params:{
            password:formData.value.password
        }
    })
    if(!result){
        return;
    }
    dialogConfig.value.show = false;
    proxy.Message.success("密码修改正确");
} 

const dialogConfig = ref({
    show:false,
    title:'修改密码',
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


const show = () =>{
    dialogConfig.value.show = true;
    nextTick(()=>{
        formDataRef.value.resetFields();
        formData.value = {}
})
}

defineExpose({
    show
})

</script>
<style scoped lang='scss'>
</style>