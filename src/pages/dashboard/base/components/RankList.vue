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
        <t-table
          :data="attackNowList"
          :columns="attackColumns"
          rowKey="IP"
          :stripe="true"
          :hover="true"
          :loading="loading"
          :empty="$t('dashboard.empty_data')"
        >
          <template #index="{ rowIndex }">
            <span :class="getRankClass(rowIndex)">{{ rowIndex + 1 }}</span>
          </template>
          <template #iptags="{ row }">
            <div class="rank-tags">
              <t-tag
                v-for="(item, index) in row.ip_tags"
                :key="index"
                :theme="item.ip_tag === '正常' ? 'success' : 'danger'"
                variant="light"
              >{{ item.ip_tag }}</t-tag>
            </div>
          </template>
          <template #operation="{ row }">
            <t-button
              v-if="row.ip"
              size="small"
              variant="text"
              shape="square"
              class="rank-search-btn"
              :aria-label="$t('dashboard.ip_rank.lookup')"
              @click="handleIpClick(row.ip)"
            >
              <search-icon />
            </t-button>
          </template>
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
        <t-table
          :data="normalNowList"
          :columns="normalColumns"
          rowKey="productName"
          :stripe="true"
          :hover="true"
          :loading="loading"
          :empty="$t('dashboard.empty_data')"
        >
          <template #index="{ rowIndex }">
            <span :class="getRankClass(rowIndex)">{{ rowIndex + 1 }}</span>
          </template>
          <template #iptags="{ row }">
            <div class="rank-tags">
              <t-tag
                v-for="(item, index) in row.ip_tags"
                :key="index"
                :theme="item.ip_tag === '正常' ? 'success' : 'danger'"
                variant="light"
              >{{ item.ip_tag }}</t-tag>
            </div>
          </template>
          <template #operation="{ row }">
            <t-button
              v-if="row.ip"
              size="small"
              variant="text"
              shape="square"
              class="rank-search-btn"
              :aria-label="$t('dashboard.ip_rank.lookup')"
              @click="handleIpClick(row.ip)"
            >
              <search-icon />
            </t-button>
          </template>
        </t-table>
      </t-card>
    </t-col>
  </t-row>
</template>
<script lang="ts">
import { SearchIcon } from 'tdesign-icons-vue';
import { LAST_7_DAYS,NowDate } from '@/utils/date';
import {
  wafstatsumdaytopiprangeapi
} from '@/apis/stats';

export default {
  name: 'RankList',
  components: {
    SearchIcon,
  },
  data() {
    return {
      loading: false,
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
        },
        {
          align: 'center',
          colKey: 'operation',
          title: '操作',
          width: 60,
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
        },
        {
          align: 'center',
          colKey: 'operation',
          title: '操作',
          width: 60,
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
        this.loading = true
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
          .finally(() => { this.loading = false })
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
    getRankClass(index) {
      return ['dashboard-rank__cell', index < 3 ? `dashboard-rank__cell--${index + 1}` : ''];
    },
    handelTimeChange(val){
      console.log("handelTimeChange",val)
      this.rangeType = val
      this.setRangeValue()
      this.loadTopIp()
    },
    handleIpClick(ip) {
      console.log('点击IP:', ip);
      if (ip && ip.trim() !== '') {
        // 带上当前榜单的时间口径（今日/近7天），否则点"近7天"榜里的 IP 落地页只查当天会是空列表
        const beginDay = this.rangeType === 'week' ? LAST_7_DAYS[0] : NowDate;
        this.$router.push({
          name: 'WafvisitLog',
          query: {
            src_ip: ip,
            action: '',   // 显式清空状态筛选，避免沿用上次的"阻止/禁止"
            date_begin: beginDay + ' 00:00:00',
            date_end: NowDate + ' 23:59:59'
          }
        }).catch((err) => { if (!err || err.name !== 'NavigationDuplicated') console.warn(err); });
      }
    }
  },
};
</script>

<style lang="less" scoped>
@import '@/style/variables.less';

.dashboard-rank-card {
  padding: 8px;

  /deep/ .t-card__header {
    padding-bottom: 20px;
  }

  /deep/ .t-card__title {
    font-size: 16px;
    font-weight: 600;
  }

  /deep/ .t-table__header th {
    background: var(--td-bg-color-component);
    color: var(--td-text-color-secondary);
    font-weight: 600;
  }
}

.rank-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rank-search-btn {
  color: var(--td-text-color-placeholder);

  &:hover {
    color: var(--td-brand-color);
  }
}

.dashboard-rank__cell {
  display: inline-flex;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: var(--td-bg-color-component);
  color: var(--td-text-color-secondary);

  // 前三名奖牌色
  &--1 {
    background: linear-gradient(135deg, #f7c94f, #e3a62d);
    color: #fff;
    box-shadow: 0 2px 6px -2px rgba(227, 166, 45, 0.5);
  }

  &--2 {
    background: linear-gradient(135deg, #d3dbe6, #94a3b8);
    color: #fff;
    box-shadow: 0 2px 6px -2px rgba(148, 163, 184, 0.5);
  }

  &--3 {
    background: linear-gradient(135deg, #e9a16b, #c67a3f);
    color: #fff;
    box-shadow: 0 2px 6px -2px rgba(198, 122, 63, 0.5);
  }
}
</style>
