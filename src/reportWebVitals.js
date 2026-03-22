const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) { //确保参数是函数
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {  //动态导入 语法
      //onPerfEntry 是一个回调函数，用于接收 getCLS 等的计算结果
      getCLS(onPerfEntry);  //页面布局抖动成都
      getFID(onPerfEntry);  //首次交互相应延迟
      getFCP(onPerfEntry);  //首次渲染时间
      getLCP(onPerfEntry);  //最大内容渲染时间
      getTTFB(onPerfEntry); //首字节返回时间
      //e：google的核心web性能指标
    });
  }
};
/*
getCLS内部可能是这样子：
function getCLS(callback) {
  // 浏览器性能监测逻辑...
  const clsValue = 0.12; // 比如测得页面布局抖动值

  // 当指标计算出来时，调用回调函数
  callback({
    name: 'CLS',
    value: clsValue,
    rating: 'good'
  });
}
*/
export default reportWebVitals;
