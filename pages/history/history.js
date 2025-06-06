Page({
  data: {
    records: []
  },
  onShow: function () {
    this.loadRecords();
  },
  loadRecords: function () {
    let records = wx.getStorageSync('records') || [];
    // 格式化日期并添加预览数据
    records = records.map(record => ({
      ...record,
      formattedDate: this.formatDate(record.createdAt),
      // 只显示前3个商品作为预览
      items: record.items.slice(0, 3)
    }));
    this.setData({ records: records.reverse() }); // 最新的记录显示在前面
  },
  formatDate: function(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // 如果是今天的记录
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `今天 ${hours}:${minutes}`;
    }
    
    // 如果是昨天的记录
    if (diff < 48 * 60 * 60 * 1000) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `昨天 ${hours}:${minutes}`;
    }
    
    // 其他日期显示完整日期
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },
  loadRecord: function (e) {
    let id = e.currentTarget.dataset.id;
    let record = this.data.records.find(r => r.id === id);
    if (record) {
      // 将记录数据存储到全局数据中
      getApp().globalData = getApp().globalData || {};
      getApp().globalData.loadedRecord = record;
      
      // 切换到比一比页面
      wx.switchTab({
        url: '/pages/compare/compare'
      });
    }
  },
  showDeleteConfirm: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条比价记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteRecord(id);
        }
      }
    });
  },
  deleteRecord: function(id) {
    let records = wx.getStorageSync('records') || [];
    records = records.filter(record => record.id !== id);
    wx.setStorageSync('records', records);
    
    // 更新页面数据
    this.loadRecords();
    
    wx.showToast({
      title: '删除成功',
      icon: 'success'
    });
  }
});
