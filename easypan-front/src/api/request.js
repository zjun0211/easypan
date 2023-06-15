import axios from "axios"
​
const instance = axios.create({
    baseURL: "http://localhost:7090",
    timeout: 3500  //响应时间
})
​
//请求拦截器
instance.interceptors.request.use(
    config => {
        return config
    }, err => {
        Promise.reject(err)
    }
)
//响应拦截器
instance.interceptors.response.use(
    response => {
        return response
    }, err => {
        Promise.reject(err)
    }
)
​
export default instance;