<template>
  <div class="spider-active-page">
    <t-card>
      <div style="display: flex; gap: 16px; margin-bottom: 16px;">
        <t-date-range-picker v-model="range1" :presets="presets"  style="width: 240px;"/>
        <t-select v-model="selectedHost"  clearable style="width: 200px;" :placeholder="$t('common.select_placeholder')" >
          <t-option v-for="item in hostOptions" :value="item.value" :label="item.label" :key="item.value">
            {{ item.label }}
          </t-option>
        </t-select>
        <t-button theme="primary" @click="fetchData"> {{ $t('common.search') }}</t-button>
      </div>
      <div style="display: flex; gap: 32px;">
        <div style="width: 660px; height: 320px;">
          <div id="spiderChart"  class="echart-box" ref="boxpie"></div>
        </div>

        <div style="flex: 1;">
          <t-table :data="spiderPieData" :columns="columns" row-key="name" size="small" :pagination="{ pageSize: 5 }">
            <template #name="{ row }">
              {{ row.name }}
            </template>
            <template #value="{ row }">
              {{ row.value }}
            </template>
            <template #percent="{ row }">
              {{ totalPV > 0 ? ((row.value / totalPV) * 100).toFixed(2) : 0 }}%
            </template>
          </t-table>
        </div>
      </div>
    </t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { use } from "echarts/core";
import { TooltipComponent, LegendComponent, GridComponent, TitleComponent } from "echarts/components";
import {
  PieChart,
  LineChart
} from 'echarts/charts';
import { CanvasRenderer } from "echarts/renderers";
use([PieChart, LineChart, TooltipComponent, LegendComponent, GridComponent, TitleComponent, CanvasRenderer]);
import {
  wafAnalysisSpider
} from '@/apis/analysis';
import {
  LAST_7_DAYS, NowDate
} from '@/utils/date';
import {
  allhost
} from '@/apis/host';
import * as echarts from "echarts/core";

export default Vue.extend({
  name: 'SpiderActive',
  components: {  },
  data() {
    return {
      //主机字典
      host_dic: {},
      hostOptions: [], // 新增一个数组用于存储下拉选项
      range1: ['2023-11-01', '2023-11-16'],
      presets: {
        最近7天: [new Date(+new Date() - 86400000 * 6), new Date()],
        最近3天: [new Date(+new Date() - 86400000 * 2), new Date()],
        今天: [new Date(), new Date()],
      },
      pieContainer:null,//饼图
      selectedHost: '',
      globalHost: '',
      totalPV: 260,
      spiderPV: 260,
      spiderPercent: 100,
      spiderPieData: [
      ],
      spiderLineData: [
      ],
      columns: [
        {
          colKey: 'name',
          title: this.$t('page.analysis.analysis_spider.spider_type'),
          width: '40%',
        },
        {
          colKey: 'value',
          title: this.$t('page.analysis.analysis_spider.visit_count'),
          width: '30%',
        },
        {
          colKey: 'percent',
          title: this.$t('page.analysis.analysis_spider.percentage'),
          width: '30%',
        },
      ],
    }
  },
  computed: {
  },
  created() {
    this.range1[0] = NowDate
    this.range1[1] = NowDate
    console.log(this.range1)
    this.loadHostList().then(() => {
      this.fetchData();
    });


  },
  mounted() {
    if(this.pieContainer == null){
      this.pieContainer = document.getElementById('spiderChart');
    }
    this.showEcarts();
  },
  methods: {
    loadHostList() {
      return new Promise((resolve, reject) => {
        allhost({})
          .then((res) => {
            let resdata = res;
            console.log("host", resdata);
            if (resdata.code === 0) {
              // 直接将返回的数据赋值给 hostOptions
              this.hostOptions = resdata.data || [];

              // 同时更新 host_dic 对象，用于其他地方引用
              this.host_dic = {};
              for (let i = 0; i < this.hostOptions.length; i++) {
                this.host_dic[this.hostOptions[i].value] = this.hostOptions[i].label;

                // 如果找到"全局网站:0"，则设置为默认选择
                if (this.hostOptions[i].label === "全局网站:0") {
                  this.selectedHost = this.hostOptions[i].value;
                  this.globalHost = this.hostOptions[i].value;
                }
              }

              // 如果没有找到特定主机，则默认选择第一个
              if (!this.selectedHost && this.hostOptions.length > 0) {
                this.selectedHost = this.hostOptions[0].pre_host;
              }

              console.log("hostOptions", this.hostOptions);
              console.log("host_dic", this.host_dic);
            } else {
              // 处理错误情况
              this.$message.error(resdata.msg || '获取主机列表失败');
            }
            resolve(); // 调用 resolve 表示加载完成
          })
          .catch((e: Error) => {
            console.log(e);
            this.$message.error('获取主机列表失败：' + e.message);
            reject(e); // 调用 reject 表示加载失败
          });
      });
    },
    fetchData() {
      let that = this
      let rangeStartDay = that.range1[0].replace(/-/g, '')
      let rangeEndDay = that.range1[1].replace(/-/g, '')
      console.log(rangeStartDay, rangeEndDay)
      wafAnalysisSpider({
        'start_day': rangeStartDay,
        'end_day': rangeEndDay,
        'host': that.selectedHost === this.globalHost ? "" : that.selectedHost
      })
        .then((res) => {
            let resdata = res.data
            console.log(resdata)

            // 处理返回的数据
            if (Array.isArray(resdata)) {
              // 直接使用返回的数据更新饼图数据
              this.spiderPieData = resdata;

              // 计算总访问量
              this.totalPV = resdata.reduce((sum, item) => sum + item.value, 0);

              // 计算爬虫访问量（可以根据实际需求调整，这里假设除了"正常访客"外都是爬虫）
              this.spiderPV = resdata
                .filter(item => item.name !== "正常访客")
                .reduce((sum, item) => sum + item.value, 0);

              // 计算爬虫占比
              this.spiderPercent = this.totalPV > 0
                ? Math.round((this.spiderPV / this.totalPV) * 100)
                : 0;
                // 数据更新后重新渲染图表
              this.showEcarts();
            } else {
              this.$message.warning("没有数据");
            }
          }
        ).catch((e : Error) => {
          console.log(e);
          this.$message.error("获取数据失败");
        })
        .finally(() => { })
    },
    showEcarts(){
      //饼图
      const mypie = echarts.init(this.pieContainer)
      mypie.setOption({
        title: {
          text: '各爬虫访问占比',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '访问来源',
            type: 'pie',
            radius: '50%',
            data: this.spiderPieData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      })
    },
  },
});
</script>

<style scoped>
.echart-box {
  width: 100%;
  height: 350px;
  margin: 20px ;
}
</style>
