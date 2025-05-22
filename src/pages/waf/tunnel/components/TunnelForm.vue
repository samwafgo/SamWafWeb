<template>
    <div>
        <t-form :data="formData" ref="form" :rules="rules" @submit="onSubmit" :labelWidth="150">

            <t-form-item :label="$t('page.tunnel.name')" name="name">
                <t-input :style="{ width: '480px' }" v-model="formData.name"></t-input>
            </t-form-item>

            <t-form-item :label="$t('page.tunnel.port')" name="port">
                <t-input :style="{ width: '480px' }" v-model="formData.port"></t-input>
            </t-form-item>

            <div class="form-row">
                <t-form-item :label="$t('page.tunnel.protocol')" name="protocol" class="half-width" >
                    <t-select v-model="formData.protocol" clearable :style="{ width: '480px' }" :disabled="isEdit">
                        <t-option value="tcp" label="TCP">TCP</t-option>
                      <t-option value="udp" label="UDP">UDP</t-option>
                    </t-select>
                </t-form-item>

                <t-form-item :label="$t('page.tunnel.start_status')" name="start_status" class="half-width">
                    <t-radio-group v-model="formData.start_status">
                        <t-radio value="0">{{ $t('common.off') }}</t-radio>
                        <t-radio value="1">{{ $t('common.on') }}</t-radio>
                    </t-radio-group>
                </t-form-item>
            </div>
            <t-form-item :label="$t('page.tunnel.remote_port')" name="remote_port">
                <t-input-number :style="{ width: '150px' }" v-model="formData.remote_port" :min="1" :max="65535"
                    :placeholder="$t('common.placeholder')">
                </t-input-number>
            </t-form-item>

            <t-form-item :label="$t('page.tunnel.remote_ip')" name="remote_ip">
                <t-input :style="{ width: '480px' }" v-model="formData.remote_ip"></t-input>
            </t-form-item>

            <t-form-item :label="$t('page.tunnel.allow_ip')" name="allow_ip">
                <t-input :style="{ width: '480px' }" v-model="formData.allow_ip"></t-input>
            </t-form-item>

            <t-form-item :label="$t('page.tunnel.deny_ip')" name="deny_ip">
                <t-input :style="{ width: '480px' }" v-model="formData.deny_ip"></t-input>
            </t-form-item>


            <div class="form-row">
                <t-form-item :label="$t('page.tunnel.conn_timeout')" name="conn_timeout" class="half-width">
                    <t-input-number :style="{ width: '150px' }" v-model="formData.conn_timeout"  :min="0" 
                        :placeholder="$t('common.placeholder')">
                    </t-input-number>
                </t-form-item>

                <t-form-item :label="$t('page.tunnel.read_timeout')" name="read_timeout" class="half-width">
                    <t-input-number :style="{ width: '150px' }" v-model="formData.read_timeout"  :min="0" 
                        :placeholder="$t('common.placeholder')">
                    </t-input-number>
                </t-form-item>
            </div>

            <div class="form-row">
                <t-form-item :label="$t('page.tunnel.write_timeout')" name="write_timeout" class="half-width">
                    <t-input-number :style="{ width: '150px' }" v-model="formData.write_timeout"  :min="0" 
                        :placeholder="$t('common.placeholder')">
                    </t-input-number>
                </t-form-item>

                <t-form-item :label="$t('page.tunnel.max_in_connect')" name="max_in_connect" class="half-width">
                    <t-input-number :style="{ width: '150px' }" v-model="formData.max_in_connect"  :min="0" 
                        :placeholder="$t('common.placeholder')">
                    </t-input-number>
                </t-form-item>
            </div>

            <t-form-item :label="$t('page.tunnel.max_out_connect')" name="max_out_connect">
                <t-input-number :style="{ width: '150px' }" v-model="formData.max_out_connect"  :min="0" 
                    :placeholder="$t('common.placeholder')">
                </t-input-number>
            </t-form-item>

            <t-form-item :label="$t('page.tunnel.remark')" name="remark">
                <t-input :style="{ width: '480px' }" v-model="formData.remark"></t-input>
            </t-form-item>

            <t-form-item style="float: right">
                <t-button variant="outline" @click="$emit('close')">{{ $t('common.close') }}</t-button>
                <t-button theme="primary" type="submit">{{ $t('common.confirm') }}</t-button>
            </t-form-item>
        </t-form>
    </div>
</template>

<script>
export default {
    name: 'TunnelForm',
    props: {
        value: {
            type: Object,
            default: () => ({}),
        },
        isEdit: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            formData: {},
            rules: {
                name: [{ required: true, message: this.$t('common.required'), type: 'error' }],
                port: [{ required: true, message: this.$t('common.required'), type: 'error' }],
                protocol: [{ required: true, message: this.$t('common.required'), type: 'error' }],
                remote_port: [{ required: true, message: this.$t('common.required'), type: 'error' }],
                remote_ip: [{ required: true, message: this.$t('common.required'), type: 'error' }],
            },
        };
    },
    watch: {
        value: {
            handler(val) {
                this.formData = { ...val };
            },
            immediate: true,
            deep: true,
        },
    },
    methods: {
        onSubmit({ validateResult, firstError }) {
            let that = this;
            if (validateResult === true) {
                let postdata = {
                    ...that.formData
                }
                postdata['remote_port'] = Number(postdata['remote_port'])
                postdata['start_status'] = Number(postdata['start_status'])
                postdata['conn_timeout'] = Number(postdata['conn_timeout'])
                postdata['read_timeout'] = Number(postdata['read_timeout'])
                postdata['write_timeout'] = Number(postdata['write_timeout'])
                postdata['max_in_connect'] = Number(postdata['max_in_connect'])
                postdata['max_out_connect'] = Number(postdata['max_out_connect'])
                this.$emit('submit', { result: postdata });
            } else {
                console.log('Tunnel Form Error:', firstError);
                this.$message.warning(firstError);
            }
        },
    },
};
</script>

<style lang="less" scoped>
.form-row {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -10px;

    .half-width {
        flex: 0 0 50%;
        max-width: 50%;
        padding: 0 10px;
        box-sizing: border-box;
    }
}

@media (max-width: 768px) {
    .form-row .half-width {
        flex: 0 0 100%;
        max-width: 100%;
    }
}
</style>
