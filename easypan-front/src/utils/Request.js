import axios from "axios";

import { ElLoading } from 'element-plus'
import router from "../router"

import Message from "./Message";

const contentTypeForm = 'application/x-www-form-urlencoded'
const contentTypeJson = 'application/json'

const responseTypeJson = 'json'

let loading ;
const instance = axios.create({
    baseURL:'/api',
    timeout:10 * 1000,
});

instance.interceptors.request.use(
    (config) =>{
        if (config.showLoading) {
            loading = ElLoading.service({
                lock:true,
                text:"加载中",
                background:'rgba(0,0,0,0.7)'
            })
        }
        return config;
    },
    (err) => {
        if (err.config.showLoading && loading) {
            loading.close();
        }
        Message.error("请求发送失败");
        return Promise.reject("请求发送失败");
    }
)

instance.interceptors.response.use(
    (response) =>{
        const { showLoading, errorCallback, showError = true, responseType} = response;
        if (loading) {
            loading.close();
        }
        const responseData = response.data;
        if (responseType == "arraybuffer" || responseType == "blob") {
            return responseData;
        }

        if (responseData.code == 200) {
            return responseData;
        } else if(responseData.code == 901){
            router.push("/login?redirectUrl" + encodeURI(router.currentRoute.value.path));
            return Promise.reject({ showError:false,msg:"登录超时"});
        } else {
            if(errorCallback){
                console.log(1);
                errorCallback(responseData.info);
            }
            return Promise.reject({showError:showError,msg:responseData.info});
        }
    },
    (err) => {
        if (loading) {
            loading.close();
        }
        return Promise.reject({ showError:true,msg:"网络异常"})
    }
);


const request = (config) =>{
    const { url, params, dataType, showLoading = true, responseType = responseTypeJson } = config;
    let contentType = contentTypeForm;
    let formData = new FormData();
    for(let key in params){
        formData.append(key,params[key] == undefined ? "":params[key]);
    }

    if (dataType != null && dataType == 'json') {
        contentType = contentTypeJson;
    }

    let headers = {
        'Content-Type': contentType,
        'X-Requested-With': 'XMLHTTPRequest',
    }

    return instance.post(url,formData,{
        onUploadProgress:(event) =>{
            if (config.uploadProgressCallback) {
                config.uploadProgressCallback(event);
            }
        },
        responseType:responseType,
        headers:headers,
        showLoading:showLoading,
        errorCallback:config.errorCallback,
        showError:config.showError
    }).catch(err => {
        console.log(err);
        if (err.showError) {
            Message.error(err.msg);
        }
        return null;
    })
}

export default request;