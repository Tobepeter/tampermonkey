;(function () {
  // 创建一个新的 script 元素
  var script = document.createElement('script')

  // 定义脚本加载完成后执行的函数
  script.onload = function () {
    // 创建 Stats 实例
    var stats = new Stats()

    // 将 stats.dom 元素添加到页面的 body 中
    document.body.appendChild(stats.dom)

    // 设置递归的 requestAnimationFrame 循环来更新 stats
    requestAnimationFrame(function loop() {
      stats.update()
      requestAnimationFrame(loop)
    })
  }

  // 设置脚本的源地址为 stats.js 的 CDN 链接
  script.src = 'https://mrdoob.github.io/stats.js/build/stats.min.js'

  // 将脚本元素添加到页面的 head 中
  document.head.appendChild(script)
})()
