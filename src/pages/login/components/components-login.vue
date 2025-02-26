<template>
  <t-form
    ref="form"
    :class="['item-container', `login-${type}`]"
    :data="formData"
    :rules="FORM_RULES"
    label-width="0"
    @submit="onSubmit"
  >
    <template v-if="type == 'password'">
      <t-form-item name="lang" label="语言选择">
        <t-select  v-model="langValue"
                   placeholder="SelectLanguage"
                   @change="changeLangEvent"  size="large"  title="Select Language">
          <t-option  v-for="(item, index) in langOptions"
                     :key="index"
                     :label="item.label"
                     :value="item.value"/>
        </t-select>
      </t-form-item>
      <t-form-item name="account">
        <t-input v-model="formData.account" size="large" :placeholder="$t('login.input_account_placeholder')">
          <template #prefix-icon>
            <user-icon />
          </template>
        </t-input>
      </t-form-item>

      <t-form-item name="password">
        <t-input
          v-model="formData.password"
          size="large"
          :type="showPsw ? 'text' : 'password'"
          clearable
          key="password"
          :placeholder="$t('login.input_password_placeholder')"
        >
          <template #prefix-icon>
            <lock-on-icon />
          </template>
          <template #suffix-icon>
            <browse-icon v-if="showPsw" @click="showPsw = !showPsw" key="browse" />
            <browse-off-icon v-else @click="showPsw = !showPsw" key="browse-off" />
          </template>
        </t-input>
      </t-form-item>
      <t-form-item name="secretCode" v-if="showSecretCode">
        <t-input v-model="formData.secret_code" size="large" :type="'password'"  clearable  :placeholder="$t('login.input_secret_code_placeholder')" >
          <template #prefix-icon>
            <lock-on-icon />
          </template>
        </t-input>

      </t-form-item>

    </template>

    <t-form-item v-if="type !== 'qrcode'" class="btn-container">
      <t-button block size="large" type="submit"> {{ $t('login.login_btn_title') }} </t-button>
    </t-form-item>
  </t-form>
</template>
<script lang="ts">
import i18n from '@/i18n'; // 确保导入全局 i18n 实例
import Vue from 'vue';
import QrcodeVue from 'qrcode.vue';
import { UserIcon, LockOnIcon, BrowseOffIcon, BrowseIcon, RefreshIcon } from 'tdesign-icons-vue';
import { loginapi } from '@/apis/login';
const INITIAL_DATA = {
  phone: '',
  account: '',
  password: '',
  verifyCode: '',
  secret_code: '',
  checked: false,
};

const FORM_RULES = {
  phone: [{ required: true, message: i18n.t('login.rule.phone') , type: 'error' }],
  account: [{ required: true, message: i18n.t('login.rule.account') , type: 'error' }],
  password: [{ required: true, message: i18n.t('login.rule.password') , type: 'error' }],
  verifyCode: [{ required: true, message: i18n.t('login.rule.verifyCode') , type: 'error' }],
};
/** 高级详情 */
export default Vue.extend({
  name: 'Login',
  components: {
    QrcodeVue,
    UserIcon,
    LockOnIcon,
    BrowseOffIcon,
    BrowseIcon,
    RefreshIcon,
  },
  data() {
    return {
      FORM_RULES,
      type: 'password',
      formData: { ...INITIAL_DATA },
      showPsw: false,
      showSecretCode: false,
      countDown: 0,
      intervalTimer: null,
      /**语言问题**/
      langValue:"zh_CN",
      langOptions: [
        {
          value: "zh_CN",
          label: "中文"
        },
        {
          value: "en_US",
          label: "English"
        },
      ]
    };
  },
  beforeDestroy() {
    clearInterval(this.intervalTimer);
  },
  mounted() {
    this.init()
  },
  methods: {
    //init
    init(){
      //多语言
      this.langValue = localStorage.getItem("lang") || "zh_CN"
    },
    // 切换语言
    changeLangEvent(value, context) {
      switch (value) {
        case "zh_CN":
          this.langValue = value;
          this.$i18n.locale = this.langValue;
          localStorage.setItem("lang",this.langValue)
          break;
        case "en_US":
          this.langValue = value;
          this.$i18n.locale = this.langValue;
          localStorage.setItem("lang",this.langValue)
          break;
        default:
          break;
      }
      //location.reload(); // 刷新页面
    },
    switchType(val) {
      this.type = val;
      this.$refs.form.reset();
    },
     onSubmit({ validateResult }) {
      if (validateResult === true) {
        loginapi({login_account:this.formData.account,login_password:this.formData.password,login_otp_secret_code:this.formData.secret_code})
        .then((res)=>{
            console.log(res)
            if(res.code==0){
                localStorage.setItem("access_token",res.data.access_token)
                localStorage.setItem("current_account",this.formData.account)
                this.$store.dispatch('user/login', this.formData);

                this.$message.success( this.$t('login.login_success'));
                setTimeout(()=>{
                   this.$router.replace('/').catch(() => '');
                },1000)

            }else if(res.code==-2){
                this.showSecretCode = true
                this.formData.secretCode = ""
                this.$message.error(res.msg);
            }else{
              this.$message.error(res.msg);
            }

        }).catch((err)=>{
            console.log(err)
        })

      }
    },
    handleCounter() {
      this.countDown = 60;
      this.intervalTimer = setInterval(() => {
        if (this.countDown > 0) {
          this.countDown -= 1;
        } else {
          clearInterval(this.intervalTimer);
          this.countDown = 0;
        }
      }, 1000);
    },
  },
});
</script>
