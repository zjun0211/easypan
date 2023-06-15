<template>
  <div class="login-body">
    <div class="bg"></div>
    <div class="login-panel">
      <el-form class="login-register" :model="formData" :rules="rules" ref="formDataRef" @submit.prevent>
        <div class="login-title">Easy云盘</div>
        <!-- 邮箱 -->
        <el-form-item label="" prop="email">
          <el-input size="large" clearable placeholder="请输入邮箱" v-model.trim="formData.email" maxLength="150">
            <template #prefix>
              <span class="iconfont icon-account"></span>
            </template>
          </el-input>
        </el-form-item>

        <!-- 注册 -->
        <div v-if="opType == 0 || opType == 2">
          <el-form-item label="" prop="emailCode">
            <div class="send-email-panel">
              <el-input clearable placehodler="请输入邮箱验证码" v-model.trim="formData.emailCode">
                <template #prefix>
                  <span class="iconfont icon-checkcode"></span>
                </template>
              </el-input>
              <el-button class="send-mail-btn" type="primary" size="large" @click="getEmailCode">
                获取验证码
              </el-button>
            </div>
            <el-popover placement="left" :width="500" trigger="click">
              <div>
                <p>1.在垃圾箱中查找邮箱验证码</p>
                <p>2.在邮箱中头像->设置->反垃圾->白名单->设置邮箱地址白名单</p>
                <p>3.将邮箱【hyk@jjking.com】添加到白名单不知道怎么设置？</p>
              </div>
              <template #reference>
                <a href="javascript:void(0)" class="a-link">
                  <span :style="{ 'fontSize': '14px' }">未收到邮箱验证码？</span>
                </a>
              </template>
            </el-popover>
          </el-form-item>
          <!-- 昵称 -->
          <el-form-item prop="nickName" v-if="opType == 0">
              <el-input
                size="large"
                placeholder="请输入昵称"
                v-model.trim="formData.nickName"
                maxLength="20"
              >
                <template #prefix>
                  <span class="iconfont icon-account"></span>
                </template>
              </el-input>
          </el-form-item>
          <!-- 注册密码，找回密码 -->
          <el-form-item prop="registerPassword">
            <el-input
              type="password"
              size="large"
              placeholder="请输入密码"
              v-model.trim="formData.registerPassword"
            >
              <template #prefix>
                <span class="iconfont icon-password"></span>
              </template>
            </el-input>
          </el-form-item>
          <!-- 重复密码 -->
          <el-form-item prop="reRegisterPassword">
            <el-input
              type="password"
              size="large"
              placeholder="请再次输入密码"
              v-model.trim="formData.reRegisterPassword"
            >
              <template #prefix>
                <span class="iconfont icon-password"></span>
              </template>
            </el-input>
          </el-form-item>
        </div>

        <!-- 登录密码 -->
        <el-form-item prop="password" v-if="opType == 1">
          <el-input type="password" size="large" placehoder="提示信息" v-model.trim="formData.password" show-password>
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <!-- 验证码 -->
        <el-form-item labe="" prop="checkCode">
          <div class="check-code-panel">
            <el-input size="large" placehoder="请输入验证码" v-model.trim="formData.checkCode">
              <template #prefix>
                <span class="iconfont icon-checkcode"></span>
              </template>
            </el-input>
            <img class="check-code" :src="checkCodeUrl" @click="changeCheckCode(0)">
          </div>
        </el-form-item>

        <!-- 注册和修改按钮 -->
        <el-form-item>
          <div class="remeberme-panel">
            <el-checkbox v-model.trim="formData.remeberMe">记住我</el-checkbox>
          </div>
          <div class="no-account">
            <a href="javascript:void(0)" class="a-link" @click="showPanel(1)" v-if="opType !== 1">去登录？</a>
            <a href="javascript:void(0)" class="a-link" @click="showPanel(2)" v-if="opType !== 2">忘记密码？</a>
            <a href="javascript:void(0)" class="a-link" @click="showPanel(0)" v-if="opType !== 0">没用账号？</a>
          </div>
        </el-form-item>
        <!-- 登入按钮 -->
        <el-form-item>
          <el-button type="primary" class="op-btn" size="large" @click="doSubmit()">
            <span v-if="opType == 0">注册</span>
            <span v-if="opType == 1">登录</span>
            <span v-if="opType == 2">重置密码</span>
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    <Dialog
      :show="dialogConfig.show"
      :title="dialogConfig.title"
      :buttons="dialogConfig.buttons"
      width="500px"
      :showCancel="false"
      @close="dialogConfig.show = false"
    >
      <el-form
        :model="formDatadialog"
        :rules="rules"
        ref="formDatadialogRef"
        label-width="80px"
        @submit.prevent
      >
        <el-form-item label="邮箱" >
          {{ formData.email }}
        </el-form-item>
        <el-form-item label="验证码" prop="checkCode">
          <div class="check-code-panel">
              <el-input size="large" placehoder="请输入验证码" v-model.trim="formDatadialog.checkCode">
                <template #prefix>
                  <span class="iconfont icon-checkcode"></span>
                </template>
              </el-input>
              <img class="check-code" :src="checkCodeUrlSendMailCode" @click="changeCheckCode(1)">
            </div>
        </el-form-item>
      </el-form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router'
import md5 from 'js-md5';

const router = useRouter();
const route = useRoute();
const { proxy } = getCurrentInstance();


const formData = ref({});
const formDataRef = ref();

onMounted(() => {
  if (opType.value == 1) {
     const cookiesLoginInfo = proxy.VueCookies.get("loginInfo");
     if (cookiesLoginInfo) {
        formData.value = cookiesLoginInfo;
     }
     changeCheckCode(0);
   }
})

const checkRePassword = (rule,value,callback) => {
  if (value !== formData.value.registerPassword) {
      callback(new Error(rule.message))
  }
}

const rules = {
  email: [
    { required: true, message: '请输入正确邮箱' },
    { validator:proxy.Verify.email, message:"请输入正确的邮箱"}
  ],
  password:[
    {required: true, message: '请输入密码' },
  ],
  emailCode:[
    { required: true, message: '请输入正确图片验证码'},
  ],
  nickName:[
    { required: true, message: '请输入昵称' },
  ],
  registerPassword:[
    { required: true, message: '请输入密码' },
    { validator: proxy.Verify.password, message:"密码只能是数字,字母,特殊字符8-18位"}
  ],
  reRegisterPassword:[
    { required: true, message: '请输入正确邮箱' },
    { validator: checkRePassword, message:"二次输入的密码不一致"}
  ],
  checkCode:[
    { required: true, message: '请输入正确图片验证码' },
  ]
};

// 操作类型 0：注册 1：登录 2：重置密码
const opType = ref(1);
const showPanel = (type) => {
  opType.value = type;
  restForm();
}

const api = {
  checkCode: "/api/checkCode",
  sendEmailCode:"/sendEmailCode",
  register:"/register",
  login:"/login",
  resetPwd:"/resetPwd",
  qqlogin:"/qqlogin"
}
const checkCodeUrl = ref(api.checkCode)
const checkCodeUrlSendMailCode = ref(api.checkCode)

// 刷新验证码  类型 0  注册、登录、修改验证， 1 邮箱验证 
const changeCheckCode = (type) => {
  if (type == 0) {
    checkCodeUrl.value = api.checkCode + "?type=" + type + "&time=" + new Date().getTime();  
  }
  else {
    checkCodeUrlSendMailCode.value = api.checkCode + "?type=" + type + "&time=" + new Date().getTime();  
  }
}

// 发送邮箱验证码
const formDatadialog = ref({});
const formDatadialogRef = ref();

const dialogConfig = reactive({
  show:false,
  title:"发送邮箱",
  buttons:[
    {
      type:"primary",
      text:"发送验证码",
      click:(e) =>{
        sendEmailCode();
      }
    }
  ]
})

// 发送邮箱验证码
const sendEmailCode = () => {
   formDatadialogRef.value.validate((valid) =>{
      if (!valid) {
        return;
      }
   })
}

const getEmailCode = () =>{
  formDataRef.value.validateField("email",async (valid) =>{
    if (!valid) {
      return;
    }

    dialogConfig.show = true;
    nextTick(() =>{
      changeCheckCode(1);
      formDatadialogRef.value.resetFields();
      formDatadialog.value = {
        email: formData.value.email,
      }
    })
  })
}



// 重置表单
const restForm = () =>{
   changeCheckCode(0);
   formDataRef.value.resetFields();
   formData.value = {};
   // 登录
   if (opType.value == 1) {
     const cookiesLoginInfo = proxy.VueCookies.get("loginInfo");
     if (cookiesLoginInfo) {
        formData.value = cookiesLoginInfo;
     }
   }
}

// 登录，注册，重置提交按钮
const doSubmit = () =>{
  formDataRef.value.validate(async (valid) =>{
    if (!valid) {
      return;
    }
    let params = {};
    Object.assign(params,formData.value);
    // 注册
    if (opType == 0 || opType == 2) {
      params.password = params.registerPassword;
      delete params.registerPassword;
      delete params.reRegisterPassword;
    }
    // 登录
    if (opType.value == 1) {
      let cookiesLoginInfo = proxy.VueCookies.get("loginInfo");
      let cookiesPassword = cookiesLoginInfo == null?null:cookiesLoginInfo.password;
      if (params.password !== cookiesPassword) {
        params.password = md5(params.password);
      }
    }
    let url = null;
    if (opType.value == 0) {
      url = api.register;
    } 
    else if(opType.value == 1){
      url = api.login;
    }
    else if(opType.value == 2){
      url = api.resetPwd;
    }
   console.log(params);
    let result= await proxy.Request({
      url:url,
      params:params,
      errorCallback: () =>{
        changeCheckCode(0);
      }
    })

    if(!result){
      return;
    }

    //注册返回
    if (opType.value == 0) {
      proxy.Message.success("注册成功，请登录");
      showPanel(1);
    } else if(opType.value == 1){
      if (params.remeberMe) {
        const loginInfo = {
          email:params.email,
          password:params.password,
          remeberMe:params.remeberMe
        }
        proxy.VueCookies.set("loginInfo",loginInfo,"7d");
      }
      else {
        proxy.VueCookies.remove("loginInfo");
      }
      proxy.Message.success("登录成功");
      
      proxy.VueCookies.set("userInfo",result.data,0);

      const redirectUrl = route.query.redirectUrl || "/";
      router.push(redirectUrl);
    } else if(opType == 2){
      proxy.Message.success("注册成功，请登录");
      showPanel(1);
    }

  })

}
</script>
<style scoped lang="scss">
.login-body {
  height: 100vh;
  background-size: cover;
  background: url("@/assets/login.jpg");
  display: flex;

  .bg {
    flex: 1;
    background-size: cover;
    background-position: center;
    background-size: 800px;
    // background-repeat: ;
  }

  .login-panel {
    width: 430px;
    margin-right: 15%;
    margin-top: calc((100vh - 500px)/2);

    .login-register {
      padding: 25px;
      background-color: #fff;
      border-radius: 10px;

      .login-title {
        text-align: center;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 10px;
      }

      .send-email-panel {
        display: flex;
        width: 100%;
        justify-content: space-between;

        .send-mail-btn {
          margin-left: 5px;
        }
      }

      .remeberme-panel {
        width: 100%;
      }

      .no-account {
        width: 100%;
        display: flex;
        justify-content: space-between;
      }

      .op-btn {
        width: 100%;
      }
    }
  }
  .check-code-panel{
        width: 100%;
        display: flex;
        .check-code {
          margin-left: 5px;
          cursor: pointer;
        }
      }
}
</style>