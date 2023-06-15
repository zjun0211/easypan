const regs = {
    email: /^([\w-]+)*@[\w-]+(\.[\w-]+)+$/,
    number: /^([0]|[1-9][0-9]*)$/,
    password: /^[\da-zA-Z~!@#$%^&*_]{8,18}$/,
    shareCode: /^[A-Za-z0-9]+$/ 
}

const verfiy = (rule,value,reg,callback) =>{
    if (value) {
        if (reg.test(value)) {
            callback()
        } else{
            callback(new Error(rule.message))
        }
    } else{
        callback(new Error(rule.message))
    }
}

export default {
    email:(rule,value,callback) => {
        return verfiy(rule,value,regs.email,callback);
    },
    number:(rule,value,callback) => {
        return verfiy(rule,value,regs.number,callback);
    },
    password:(rule,value,callback) => {
        return verfiy(rule,value,regs.password,callback);
    },
    shareCode:(rule,value,callback) => {
        return verfiy(rule,value,regs.shareCode,callback);
    },
}