;(function () {
  var script = document.createElement('script')
  script.onload = function () {
    // @ts-ignore
    var stats = new Stats()
    var dom = stats.dom
    document.body.appendChild(dom)

    function posStat() {
      var style = dom.style
      style.left = 'unset'
      style.right = '20px'
      style.top = '20px'
    }

    posStat()

    requestAnimationFrame(function loop() {
      stats.update()
      requestAnimationFrame(loop)
    })
  }
  script.src = 'https://mrdoob.github.io/stats.js/build/stats.min.js'
  document.head.appendChild(script)
})()
