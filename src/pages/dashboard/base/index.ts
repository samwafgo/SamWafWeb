import dayjs from 'dayjs';
import * as echarts from 'echarts/core';
import { getChartListColor } from '@/utils/color';
import { getRandomArray } from '@/utils/charts';

console.log(window.vm.$i18n)

/** 千分位格式化数字 */
function formatChartNumber(value: number | string): string {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value ?? '');
  return num.toLocaleString('en-US');
}

/** hex 转 rgba（解析失败时原样返回） */
function hexToRgba(hex: string, alpha: number): string {
  const m = (hex || '').replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
/** 首页 dashboard 折线图 */
export function constructInitDashboardDataset(type: string) {
  const dateArray: Array<string> = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const datasetAxis = {
    xAxis: {
      type: 'category',
      show: false,
      data: dateArray,
    },
    yAxis: {
      show: false,
      type: 'value',
    },
    grid: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  };

  if (type === 'line') {
    const lineDataset = {
      ...datasetAxis,
      color: ['#fff'],
      series: [
        {
          data: [150, 230, 224, 218, 135, 147, 260],
          type,
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 0,
          markPoint: {
            data: [
              { type: 'max', name: '最大值' },
              { type: 'min', name: '最小值' },
            ],
          },
          itemStyle: {
            normal: {
              lineStyle: {
                width: 2,
              },
            },
          },
        },
      ],
    };
    return lineDataset;
  }
  if (type === 'bar') {
    const barDataset = {
      ...datasetAxis,
      color: getChartListColor(),
      series: [
        {
          data: [
            100,
            130,
            184,
            218,
            {
              value: 135,
              itemStyle: {
                opacity: 0.2,
              },
            },
            {
              value: 118,
              itemStyle: {
                opacity: 0.2,
              },
            },
            {
              value: 60,
              itemStyle: {
                opacity: 0.2,
              },
            },
          ],
          type,
          barWidth: 9,
        },
      ],
    };
    return barDataset;
  }
}

/** 柱状图数据源 */
export function constructInitDataset({
  dateTime = [],
  placeholderColor,
  borderColor,
}: { dateTime: Array<string> } & Record<string, string>) {
  const divideNum = 10;
  const timeArray = [];
  const inArray = [];
  const outArray = [];
  for (let i = 0; i < divideNum; i++) {
    if (dateTime.length > 0) {
      const dateAbsTime: number = (new Date(dateTime[1]).getTime() - new Date(dateTime[0]).getTime()) / divideNum;
      const enhandTime: number = new Date(dateTime[0]).getTime() + dateAbsTime * i;
      timeArray.push(dayjs(enhandTime).format('MM-DD'));
    } else {
      timeArray.push(
        dayjs()
          .subtract(divideNum - i, 'day')
          .format('MM-DD'),
      );
    }

    inArray.push(getRandomArray().toString());
    outArray.push(getRandomArray().toString());
  }
  const dataset = {
    color: getChartListColor(),
    tooltip: {
      trigger: 'item',
    },
    xAxis: {
      type: 'category',
      data: timeArray,
      axisLabel: {
        color: placeholderColor,
      },
      axisLine: {
        lineStyle: {
          color: borderColor,
          width: 1,
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: placeholderColor,
      },
      splitLine: {
        lineStyle: {
          color: borderColor,
        },
      },
    },
    grid: {
      top: '5%',
      left: '25px',
      right: 0,
      bottom: '60px',
    },
    legend: {
      icon: 'rect',
      itemWidth: 12,
      itemHeight: 4,
      itemGap: 48,
      textStyle: {
        fontSize: 12,
        color: placeholderColor,
      },
      left: 'center',
      bottom: '0',
      orient: 'horizontal',
      data: ['本月', '上月'],
    },
    series: [
      {
        name: '本月',
        data: outArray,
        type: 'bar',
      },
      {
        name: '上月',
        data: inArray,
        type: 'bar',
      },
    ],
  };

  return dataset;
}

export function getLineChartDataSet({
  dateTime = [],
  inchartarr = [],
  outchartarr = [],
  placeholderColor,
  borderColor,
  containerColor,
}: { dateTime?: Array<string>; inchartarr?: Array<string>; outchartarr?: Array<string> } & Record<string, string>) {
  const isDark = containerColor === '#242424';
  const colorList = getChartListColor();
  const attackColor = colorList[0] || '#e34d59';
  const normalColor = colorList[1] || '#00a870';
  const attackName = window.vm.$i18n.t('dashboard.cycle_attack_count');
  const normalName = window.vm.$i18n.t('dashboard.cycle_normal_count');
  const tooltipBg = isDark ? 'rgba(36, 36, 36, 0.96)' : 'rgba(255, 255, 255, 0.96)';
  const tooltipBorder = isDark ? '#5e5e5e' : '#e7e7e7';
  const tooltipText = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';

  const areaGradient = (color: string) =>
    new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: hexToRgba(color, 0.26) },
      { offset: 1, color: hexToRgba(color, 0.02) },
    ]);

  return {
    color: colorList,
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      padding: [8, 12],
      extraCssText: 'box-shadow: 0 6px 20px rgba(0,0,0,0.08); border-radius: 8px;',
      textStyle: { color: tooltipText, fontSize: 12 },
      axisPointer: {
        type: 'line',
        lineStyle: { color: borderColor, type: 'dashed' },
      },
      formatter: (params: Array<any>) => {
        if (!Array.isArray(params) || !params.length) return '';
        let html = `<div style="font-weight:600;margin-bottom:4px;">${params[0].axisValue || ''}</div>`;
        params.forEach((p) => {
          html += `<div style="display:flex;align-items:center;gap:8px;line-height:1.9;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};flex:none;"></span><span>${p.seriesName}</span><span style="margin-left:auto;font-weight:600;font-variant-numeric:tabular-nums;">${formatChartNumber(
            p.value,
          )}</span></div>`;
        });
        return html;
      },
    },
    grid: {
      left: '8',
      right: '20',
      top: '38',
      bottom: '38',
      containLabel: true,
    },
    legend: {
      left: 'center',
      bottom: '0',
      orient: 'horizontal',
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 5,
      itemGap: 32,
      data: [attackName, normalName],
      textStyle: { fontSize: 12, color: placeholderColor },
    },
    xAxis: {
      type: 'category',
      data: dateTime,
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: borderColor, width: 1 } },
      axisLabel: { color: placeholderColor, fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: placeholderColor,
        fontSize: 12,
        formatter: (value: number) => formatChartNumber(value),
      },
      splitLine: { lineStyle: { color: borderColor, type: 'dashed' } },
    },
    series: [
      {
        name: attackName,
        data: inchartarr,
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: attackColor },
        itemStyle: { color: attackColor, borderColor: containerColor, borderWidth: 2 },
        emphasis: { focus: 'series', scale: true },
        areaStyle: { color: areaGradient(attackColor) },
      },
      {
        name: normalName,
        data: outchartarr,
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: normalColor },
        itemStyle: { color: normalColor, borderColor: containerColor, borderWidth: 2 },
        emphasis: { focus: 'series', scale: true },
        areaStyle: { color: areaGradient(normalColor) },
      },
    ],
  };
}

/**
 * 获取表行数据
 *
 * @export
 * @param {string} productName
 * @param {number} divideNum
 */
export function getSelftItemList(productName: string, divideNum: number): string[] {
  const productArray: string[] = [productName];
  for (let i = 0; i < divideNum; i++) {
    productArray.push(getRandomArray(100 * i).toString());
  }

  return productArray;
}


export function getPieChartDataSet({
  attackCount = 0,
  normalCount = 0,
  textColor,
  placeholderColor,
  containerColor,
}: { attackCount: number; normalCount: number } & Record<string, string>) {
  const isDark = containerColor === '#242424';
  const colorList = getChartListColor();
  const attackColor = colorList[0] || '#e34d59';
  const normalColor = colorList[1] || '#00a870';
  const attackName = window.vm.$i18n.t('dashboard.cycle_attack_count');
  const normalName = window.vm.$i18n.t('dashboard.cycle_normal_count');
  const centerLabel = window.vm.$i18n.t('dashboard.cycle_normal_ratio');
  const total = Number(attackCount) + Number(normalCount);
  const normalPercent = total > 0 ? (Number(normalCount) / total) * 100 : 0;
  const tooltipBg = isDark ? 'rgba(36, 36, 36, 0.96)' : 'rgba(255, 255, 255, 0.96)';
  const tooltipBorder = isDark ? '#5e5e5e' : '#e7e7e7';
  const tooltipText = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';

  return {
    color: [normalColor, attackColor],
    tooltip: {
      trigger: 'item',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      padding: [8, 12],
      extraCssText: 'box-shadow: 0 6px 20px rgba(0,0,0,0.08); border-radius: 8px;',
      textStyle: { color: tooltipText, fontSize: 12 },
      formatter: (p: any) => `${p.marker} ${p.name}<br/>${formatChartNumber(p.value)} 次 · ${p.percent}%`,
    },
    legend: {
      selectedMode: false,
      itemWidth: 14,
      itemHeight: 5,
      icon: 'roundRect',
      textStyle: { fontSize: 12, color: placeholderColor },
      left: 'center',
      bottom: '0',
      orient: 'horizontal',
      formatter: (name: string) => {
        const value = name === attackName ? Number(attackCount) : Number(normalCount);
        return `${name}  ${formatChartNumber(value)}`;
      },
    },
    series: [
      {
        name: '占比',
        type: 'pie',
        radius: ['58%', '74%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        hoverAnimation: true,
        itemStyle: {
          borderColor: containerColor,
          borderWidth: 3,
          borderRadius: 6,
        },
        label: {
          show: true,
          position: 'center',
          formatter: [`{value|${normalPercent.toFixed(1)}%}`, `{name|${centerLabel}}`].join('\n'),
          rich: {
            value: {
              color: textColor,
              fontSize: 30,
              fontWeight: 600,
              lineHeight: 40,
              fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
            },
            name: {
              color: placeholderColor,
              fontSize: 12,
              lineHeight: 16,
              padding: [4, 0, 0, 0],
            },
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          {
            value: normalCount,
            name: normalName,
            itemStyle: { color: normalColor },
          },
          {
            value: attackCount,
            name: attackName,
            itemStyle: { color: attackColor },
          },
        ],
      },
    ],
  };
}
