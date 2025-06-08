import * as echarts from '../../echarts-for-weixin/ec-canvas/echarts';

Page({
  data: {
    items: [],
    searchName: '',
    chartData: [],
    ec: {
      lazyLoad: true
    }
  },
  onLoad: function () {
    // 这里假设从本地缓存读取最近一次比价记录作为演示
    let records = wx.getStorageSync('records') || [];
    if (records.length > 0) {
      // 取最新一条记录
      let record = records[records.length - 1];
      // 计算单价最优/最高标识
      let items = record.items.map(item => ({
        ...item,
        isLowest: false,
        isHighest: false
      }));
      // 计算最优/最高
      const validItems = items.filter(i => i.unitPrice !== undefined && i.unitPrice !== '');
      if (validItems.length > 0) {
        const prices = validItems.map(i => parseFloat(i.unitPrice));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        items.forEach(i => {
          if (parseFloat(i.unitPrice) === minPrice) i.isLowest = true;
          if (parseFloat(i.unitPrice) === maxPrice) i.isHighest = true;
        });
      }
      this.setData({ items });
    }
  },
  onInput: function(e) {
    this.setData({ searchName: e.detail.value });
  },
  onSearch: function() {
    const name = this.data.searchName.trim();
    if (!name) {
      wx.showToast({ title: '请输入商品名', icon: 'none' });
      return;
    }
    const priceHistory = wx.getStorageSync('priceHistory') || [];
    // 筛选该商品的所有历史价格
    const data = priceHistory.filter(item => item.name === name);
    if (data.length === 0) {
      this.setData({ chartData: [] });
      return;
    }
    // 按时间排序
    data.sort((a, b) => new Date(a.time) - new Date(b.time));
    this.setData({ chartData: data }, () => {
      this.initChart();
    });
  },
  initChart: function() {
    if (!this.selectComponent('#priceChart')) return;
    this.selectComponent('#priceChart').init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
      const option = {
        title: { text: '价格历史', left: 'center', top: 10, textStyle: { fontSize: 16 } },
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: this.data.chartData.map(item => item.time.slice(0, 16).replace('T', ' ')),
          axisLabel: { rotate: 30 }
        },
        yAxis: {
          type: 'value',
          name: '单价',
          min: 'dataMin',
          max: 'dataMax'
        },
        series: [{
          data: this.data.chartData.map(item => parseFloat(item.unitPrice)),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          areaStyle: {}
        }]
      };
      chart.setOption(option);
      return chart;
    });
  }
}); 