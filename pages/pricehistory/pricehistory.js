import * as echarts from '../../echarts-for-weixin/ec-canvas/echarts';

Page({
  data: {
    productList: [], // 全部产品分组
    filteredList: [], // 搜索后展示的卡片
    searchName: '',
    showBigChart: false,
    bigChartEc: { lazyLoad: true },
    bigChartData: null
  },
  onShow: function () {
    const priceHistory = wx.getStorageSync('priceHistory') || [];
    // 按商品名分组
    const group = {};
    priceHistory.forEach(item => {
      if (!group[item.name]) group[item.name] = [];
      group[item.name].push(item);
    });
    // 组装每个产品的历史最高价和最低价及时间
    const productList = Object.keys(group).map((name) => {
      const dataArr = group[name].sort((a, b) => new Date(a.time) - new Date(b.time));
      let max = dataArr[0], min = dataArr[0];
      dataArr.forEach(item => {
        if (parseFloat(item.unitPrice) > parseFloat(max.unitPrice)) max = item;
        if (parseFloat(item.unitPrice) < parseFloat(min.unitPrice)) min = item;
      });
      return {
        name,
        maxPrice: max.unitPrice,
        maxTime: max.time.slice(0, 16).replace('T', ' '),
        minPrice: min.unitPrice,
        minTime: min.time.slice(0, 16).replace('T', ' '),
        allHistory: dataArr
      };
    });
    this.setData({ productList, filteredList: productList }, () => {
      this.initAllMiniCharts();
    });
  },
  onInput: function(e) {
    const value = e.detail.value;
    this.setData({ searchName: value });
    if (!value.trim()) {
      this.setData({ filteredList: this.data.productList });
    }
  },
  onSearch: function() {
    const keyword = this.data.searchName.trim();
    if (!keyword) {
      this.setData({ filteredList: this.data.productList });
      return;
    }
    const filtered = this.data.productList.filter(item => item.name.indexOf(keyword) !== -1);
    this.setData({ filteredList: filtered });
  },
  initAllMiniCharts: function() {
    this.data.filteredList.forEach((item) => {
      const chartId = `#chart-${item.name}`;
      this.initMiniChart(chartId, item.xData, item.yData);
    });
  },
  initMiniChart: function(selector, xData, yData) {
    const comp = this.selectComponent(selector);
    if (!comp) return;
    comp.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
      const option = {
        grid: { left: 40, right: 10, top: 20, bottom: 20 },
        xAxis: {
          type: 'category',
          data: xData,
          axisLabel: { show: false },
          axisTick: { show: false },
          axisLine: { show: false }
        },
        yAxis: {
          type: 'value',
          min: 'dataMin',
          max: 'dataMax',
          axisLabel: { fontSize: 10 }
        },
        series: [{
          data: yData,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          lineStyle: { width: 2 },
          itemStyle: { color: '#07c160' }
        }]
      };
      chart.setOption(option);
      return chart;
    });
  },
  onCardTap: function(e) {
    const name = e.currentTarget.dataset.name;
    const item = this.data.productList.find(i => i.name === name);
    if (!item) return;
    this.setData({ showBigChart: true, bigChartData: item }, () => {
      this.initBigChart(item.allHistory, item.name);
    });
  },
  closeBigChart: function() {
    this.setData({ showBigChart: false });
  },
  noop: function() {},
  initBigChart: function(historyArr, name) {
    const comp = this.selectComponent('#bigChart');
    if (!comp) return;
    const xData = historyArr.map(item => item.time.slice(0, 10));
    const yData = historyArr.map(item => parseFloat(item.unitPrice));
    comp.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
      const option = {
        grid: { left: 40, right: 10, top: 40, bottom: 30 },
        xAxis: {
          type: 'category',
          data: xData,
          axisLabel: { fontSize: 12 },
          axisTick: { show: false },
          axisLine: { show: true }
        },
        yAxis: {
          type: 'value',
          min: 'dataMin',
          max: 'dataMax',
          axisLabel: { fontSize: 12 }
        },
        series: [{
          data: yData,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          lineStyle: { width: 2 },
          itemStyle: { color: '#07c160' }
        }]
      };
      chart.setOption(option);
      return chart;
    });
  },
  onAddCurrentPrice: function(e) {
    // 阻止冒泡，避免关闭弹窗
    if (e) e.stopPropagation && e.stopPropagation();
    const item = this.data.bigChartData;
    if (!item) return;
    wx.showModal({
      title: '添加当前价格',
      editable: true,
      placeholderText: '请输入当前价格',
      success: (res) => {
        if (res.confirm && res.content) {
          const price = parseFloat(res.content);
          if (isNaN(price) || price <= 0) {
            wx.showToast({ title: '请输入有效的价格', icon: 'none' });
            return;
          }
          const now = new Date().toISOString();
          const priceHistory = wx.getStorageSync('priceHistory') || [];
          priceHistory.push({
            name: item.name,
            unitPrice: price.toFixed(2),
            time: now
          });
          wx.setStorageSync('priceHistory', priceHistory);
          wx.showToast({ title: '添加成功', icon: 'success' });
          // 刷新大图历史数据和折线图，不关闭弹窗
          // 重新获取该商品的历史数据
          const allHistory = priceHistory.filter(h => h.name === item.name).sort((a, b) => new Date(a.time) - new Date(b.time));
          this.setData({
            bigChartData: { ...item, allHistory }
          }, () => {
            this.initBigChart(allHistory, item.name);
          });
        }
      }
    });
  }
}); 