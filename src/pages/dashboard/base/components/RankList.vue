<template>
  <t-row :gutter="[16, 16]">
    <t-col :xs="12" :xl="6">
      <t-card :title="$t('dashboard.ip_rank.attack_title')" class="dashboard-rank-card">
        <template #actions>
          <t-radio-group v-model="rangeType" default-value="day" @change="handelTimeChange">
            <t-radio-button value="day">{{ $t('dashboard.ip_rank.day') }}</t-radio-button>
            <t-radio-button value="week">{{ $t('dashboard.ip_rank.week') }}</t-radio-button>
          </t-radio-group>
        </template>
        <t-table :data="attackNowList" :columns="attackColumns" rowKey="IP">
          <template #index="{ rowIndex }">
            <span :class="getRankClass(rowIndex)">
              {{ rowIndex + 1 }}
            </span>
          </template>
          <template #iptags="{ row }">
            <t-tag  v-for="(item, index) in row.ip_tags" :theme="item.ip_tag === '正常' ? 'success' : 'danger'" variant="light" style="margin: 3px">{{ item.ip_tag }}</t-tag>
          </template>
         <!-- <span slot="growUp" slot-scope="{ row }">
            <trend :type="row.growUp > 0 ? 'up' : 'down'" :describe="Math.abs(row.growUp)" />
          </span> -->
          <!-- <template #operation="slotProps">
            <a class="link" @click="rehandleClickOp(slotProps)">详情</a>
          </template> -->
        </t-table>
      </t-card>
    </t-col>
    <t-col :xs="12" :xl="6">
      <t-card :title="$t('dashboard.ip_rank.normal_title')" class="dashboard-rank-card">
        <template #actions>
          <t-radio-group v-model="rangeType" @change="handelTimeChange">
            <t-radio-button value="day">{{ $t('dashboard.ip_rank.day') }}</t-radio-button>
            <t-radio-button value="week">{{ $t('dashboard.ip_rank.week') }}</t-radio-button>
          </t-radio-group>
        </template>
        <t-table :data="normalNowList" :columns="normalColumns" rowKey="productName">
          <template #index="{ rowIndex }">
            <span :class="getRankClass(rowIndex)">
              {{ rowIndex + 1 }}
            </span>
          </template>
          <template #iptags="{ row }">
            <t-tag  v-for="(item, index) in row.ip_tags" :theme="item.ip_tag === '正常' ? 'success' : 'danger'" variant="light" style="margin: 3px">{{ item.ip_tag }}</t-tag>
          </template>
        <!--  <span slot="growUp" slot-scope="{ row }">
            <trend :type="row.growUp > 0 ? 'up' : 'down'" :describe="Math.abs(row.growUp)" />
          </span>
          <template #operation="slotProps">
            <a class="link" @click="rehandleClickOp(slotProps)">详情</a>
          </template> -->
        </t-table>
      </t-card>
    </t-col>
  </t-row>
</template>
<script lang="ts">
import Trend from '@/components/trend/index.vue';
import { LAST_7_DAYS,NowDate } from '@/utils/date';
import {
  wafstatsumdaytopiprangeapi
} from '@/apis/stats';

export default {
  name: 'RankList',
  components: {
    Trend,
  },
  data() {
    return {
      attackColumns: [
        {
          align: 'center',
          colKey: 'index',
          title: this.$t('dashboard.ip_rank.rank'),
          width: 80,
          fixed: 'left',
        },
        {
          align: 'left',
          ellipsis: true,
          colKey: 'ip',
          title: this.$t('dashboard.ip_rank.ip'),
          minWidth: 100,
        },
        {
          align: 'left',
          ellipsis: true,
          colKey: 'iptags',
          title: this.$t('dashboard.ip_rank.tag'),
          minWidth: 200,
        },
        {
          align: 'center',
          colKey: 'ip_belong',
          width: 100,
          title: this.$t('dashboard.ip_rank.ip_belong'),
        },
        {
          align: 'center',
          colKey: 'count',
          title: this.$t('dashboard.ip_rank.counter'),
          width: 100,
        }
      ],
      normalColumns: [
        {
          align: 'center',
          colKey: 'index',
          title:  this.$t('dashboard.ip_rank.rank'),
          width: 80,
          fixed: 'left',
        },
        {
          align: 'left',
          ellipsis: true,
          colKey: 'ip',
          title: this.$t('dashboard.ip_rank.ip'),
          minWidth: 100,
        },
        {
          align: 'left',
          ellipsis: true,
          colKey: 'iptags',
          title:this.$t('dashboard.ip_rank.tag'),
          minWidth: 200,
        },
        {
          align: 'center',
          colKey: 'ip_belong',
          width: 100,
          title: this.$t('dashboard.ip_rank.ip_belong'),
        },
        {
          align: 'center',
          colKey: 'count',
          title: this.$t('dashboard.ip_rank.counter'),
          width: 100,
        }
      ],
      rangeType:"day",//时间类型 日 周
      rangeStartDay:0,//开始时间
      rangeEndDay:0,//结束时间
      attackNowList : [],
      normalNowList : [],
    };
  },
  mounted() {
    this.setRangeValue()
    this.loadTopIp()
  },
  methods: {
    setRangeValue(){
      if (this.rangeType=="day"){
        this.rangeStartDay = NowDate.replace(/-/g,"")
        this.rangeEndDay = NowDate.replace(/-/g,"")
      }else if (this.rangeType=="week"){
        this.rangeStartDay = LAST_7_DAYS[0].replace(/-/g,"")
        this.rangeEndDay = LAST_7_DAYS[1].replace(/-/g,"")
      }

    },
    loadTopIp(){
        wafstatsumdaytopiprangeapi({'start_day':this.rangeStartDay,'end_day':this.rangeEndDay})
          .then((res) => {
              let resdata = res
              console.log("wafstatsumdaytopiprangeapi",resdata.data)
              this.attackNowList = resdata.data.AttackIPOfRange|| []
              this.normalNowList = resdata.data.NormalIPOfRange|| []
              // 补充空行，确保列表长度至少为 10
              this.attackNowList = this.fillEmptyRows(this.attackNowList);
              this.normalNowList = this.fillEmptyRows(this.normalNowList);
            }
            ).catch((e: Error) => {
            console.log(e);
          })
          .finally(() => {})
    },
    fillEmptyRows(list) {
      const targetLength = 10;
      const emptyRow = { count: '', ip: '', ip_belong: '',ip_tags:[] }; // 定义空行的字段结构

      // 如果列表长度小于目标长度，补充空行
      while (list.length < targetLength) {
        list.push(emptyRow);
      }

      return list;
    },
    rehandleClickOp(val) {
      console.log(val);
    },
    getRankClass(index) {
      return ['dashboard-rank__cell', { 'dashboard-rank__cell--top': index < 3 }];
    },
    handelTimeChange(val){
      console.log("handelTimeChange",val)
      this.rangeType = val
      this.setRangeValue()
      this.loadTopIp()
    }
  },
};
</script>

<style lang="less" scoped>
@import '@/style/variables.less';

.dashboard-rank-card {
  padding: 8px;

  /deep/ .t-card__header {
    padding-bottom: 24px;
  }

  /deep/ .t-card__title {
    font-size: 20px;
    font-weight: 500;
  }
}

.dashboard-rank__cell {
  display: inline-flex;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
  font-size: 14px;
  background-color: var(--td-gray-color-5);
  align-items: center;
  justify-content: center;
  font-weight: 700;

  &--top {
    background: var(--td-brand-color);
  }
}
</style>
