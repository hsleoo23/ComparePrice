Page({
  data: {
    records: []
  },
  onShow: function () {
    this.loadRecords();
  },
  loadRecords: function () {
    let records = wx.getStorageSync('records') || [];
    this.setData({ records: records.reverse() }); // 最新的记录显示在前面
  },
  loadRecord: function (e) {
    let id = e.currentTarget.dataset.id;
    let record = this.data.records.find(r => r.id === id);
    if (record) {
      wx.navigateTo({
        url: '/pages/compare/compare',
        success: (res) => {
          res.eventChannel.emit('loadRecord', { record })
        }
      });
    }
  }
});
