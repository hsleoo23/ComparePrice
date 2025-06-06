Page({
  data: {
    items: [],
    isManaging: false,
    selectedItems: []
  },
  onLoad: function () {
    // 添加两条默认商品记录
    this.addDefaultItems();
  },
  // 添加默认商品记录
  addDefaultItems: function() {
    const defaultItems = [
      {
        name: '商品1',
        price: '',
        spec: '',
        quantity: 1,
        unitPrice: '',
        error: false,
        isLowest: false,
        isHighest: false,
        nameModified: false,
        priceModified: false,
        specModified: false,
        quantityModified: false
      },
      {
        name: '商品2',
        price: '',
        spec: '',
        quantity: 1,
        unitPrice: '',
        error: false,
        isLowest: false,
        isHighest: false,
        nameModified: false,
        priceModified: false,
        specModified: false,
        quantityModified: false
      }
    ];
    this.setData({ items: defaultItems });
  },
  // 添加新商品项
  addItem: function () {
    let items = this.data.items;
    const newIndex = items.length + 1;
    items.push({
      name: `商品${newIndex}`,
      price: '',
      spec: '',
      quantity: 1,
      unitPrice: '',
      error: false,
      isLowest: false,
      isHighest: false,
      nameModified: false,
      priceModified: false,
      specModified: false,
      quantityModified: false
    });
    this.setData({ items });
  },
  // 更新商品项信息
  updateItem: function (e) {
    let { index, field } = e.currentTarget.dataset;
    let { value } = e.detail;
    let items = this.data.items;
    
    // 检查价格、规格和数量是否为数字
    if (['price', 'spec', 'quantity'].includes(field)) {
      if (value && isNaN(parseFloat(value))) {
        wx.showToast({
          title: '请输入有效的数字',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 对于数量，还需要确保是整数
      if (field === 'quantity' && value) {
        const numValue = parseFloat(value);
        if (!Number.isInteger(numValue) || numValue <= 0) {
          wx.showToast({
            title: '请输入正整数',
            icon: 'none',
            duration: 2000
          });
          return;
        }
      }
    }
    
    // 更新值和修改状态
    items[index][field] = value;
    items[index][`${field}Modified`] = true;
    
    // 如果更新的是价格、规格或数量，则重新计算单价
    if (['price', 'spec', 'quantity'].includes(field)) {
      this.calculateUnitPrice(index);
      this.updatePriceStatus();
    }
    this.setData({ items });
  },
  // 计算单价
  calculateUnitPrice: function (index) {
    let items = this.data.items;
    let item = items[index];
    
    // 重置状态
    item.error = false;
    item.isLowest = false;
    item.isHighest = false;

    if (item.price && item.spec && item.quantity) {
      const price = parseFloat(item.price);
      const spec = parseFloat(item.spec);
      const quantity = parseInt(item.quantity) || 1;

      if (isNaN(price) || isNaN(spec) || isNaN(quantity) || spec === 0 || quantity === 0) {
        item.error = true;
        item.unitPrice = '';
        return;
      }

      const unitPriceValue = price / (spec * quantity);
      item.unitPrice = unitPriceValue.toFixed(2); // 移除单位显示，只保留数字
    } else {
      item.unitPrice = '';
    }
    
    this.setData({ items });
  },
  // 清空所有商品项
  clearItems: function () {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有商品项吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ 
            items: [],
            isManaging: false,
            selectedItems: []
          }, () => {
            this.addDefaultItems();
          });
        }
      }
    });
  },
  // 切换管理模式
  toggleManage: function () {
    this.setData({
      isManaging: !this.data.isManaging,
      selectedItems: []
    });
  },
  // 选择商品项
  selectItem: function (e) {
    let index = e.currentTarget.dataset.index;
    let selectedItems = this.data.selectedItems;
    let idx = selectedItems.indexOf(index);
    if (idx > -1) {
      selectedItems.splice(idx, 1);
    } else {
      selectedItems.push(index);
    }
    this.setData({ selectedItems });
  },
  // 全选/全不选
  selectAll: function () {
    let selectedItems = this.data.selectedItems;
    if (selectedItems.length === this.data.items.length) {
      selectedItems = [];
    } else {
      selectedItems = this.data.items.map((_, index) => index);
    }
    this.setData({ selectedItems });
  },
  // 删除选中的商品项
  deleteSelectedItems: function () {
    let items = this.data.items.filter((_, index) => !this.data.selectedItems.includes(index));
    this.setData({
      items,
      selectedItems: [],
      isManaging: false
    }, () => {
      this.updatePriceStatus();
    });
  },
  // 保存比价记录
  saveRecord: function () {
    let { items } = this.data;
    
    // 过滤掉无效数据
    let validItems = items.filter(item => item.price && item.spec);
    if (validItems.length === 0) {
      wx.showToast({
        title: '没有有效的商品数据',
        icon: 'none'
      });
      return;
    }

    // 弹出输入标题的对话框
    wx.showModal({
      title: '请输入标题',
      editable: true,
      placeholderText: '请输入比价记录标题',
      success: (res) => {
        if (res.confirm && res.content) {
          let record = {
            id: Date.now().toString(),
            title: res.content,
            createdAt: new Date().toISOString(),
            items: validItems
          };
          let records = wx.getStorageSync('records') || [];
          records.push(record);
          wx.setStorageSync('records', records);
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
          // 清空当前数据，重新添加默认商品
          this.setData({
            items: []
          }, () => {
            this.addDefaultItems();
          });
        } else if (res.confirm) {
          wx.showToast({
            title: '请输入标题',
            icon: 'none'
          });
        }
      }
    });
  },
  // 更新所有项目的价格状态
  updatePriceStatus: function() {
    const items = this.data.items;
    const validItems = items.filter(item => item.unitPriceValue !== undefined);
    
    if (validItems.length > 0) {
      const prices = validItems.map(item => item.unitPriceValue);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      items.forEach(item => {
        if (item.unitPriceValue !== undefined) {
          item.isLowest = item.unitPriceValue === minPrice;
          item.isHighest = item.unitPriceValue === maxPrice;
        }
      });
      
      this.setData({ items });
    }
  },
});
