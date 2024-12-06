// ==UserScript==
// @name         juejin perf
// @name:zh-CN   掘金优化
// @namespace    tobe
// @version      0.0.1
// @description  优化掘金网站的体验
// @author       tobe
// @match        https://juejin.cn/post/*
// @icon         https://lf-web-assets.juejin.cn/obj/juejin-web/xitu_juejin_web/e08da34488b114bd4c665ba2fa520a31.svg
// @grant        none
// @run-at       document-start
// ==/UserScript==
(async function () {
  'use strict';

  // -- config --
  const DEBUG = true
  const PerfCSS = true
  const noLinkConfirm = true

  // -- utils --
  function log(msg) {
    if (DEBUG) {
      console.log(msg)
    }
  }

  function waitUntil(predict, timeout = 3 * 1000) {
    return new Promise((resolve, reject) => {
      var timeOutId = -1,
        intervalId = -1
      function clear() {
        clearTimeout(timeOutId)
        clearInterval(intervalId)
      }

      function check() {
        const result = predict()
        if (result) {
          clear()
          resolve(result)
        }
      }

      timeOutId = setTimeout(() => {
        clear()
        resolve(null)
      }, timeout)
      intervalId = setInterval(check, 100)
      check()
    })
  }

  function wait(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration))
  }

  function waitIdle() {
    return new Promise((resolve) => {
      window.requestIdleCallback(resolve)
    })
  }

  let valid

  // -- main --
  async function prepare() {
    valid = true
  }

  await prepare()

  if (!valid) {
    log('[tampermonkey] juejin context-menu not ready')
    return
  }

  log('[tampermonkey] juejin context-menu ready')

  /**
   * 注入css
   * NOTE: 最好在 document-start 执行，否则有的内容会闪烁
   */
  function injectCSS() {
    if (!PerfCSS) return

    const style = document.createElement('style')
    style.innerHTML = `
      /* -- 隐藏那个烦人的context-menu -- */
      .context-menu {
        display: none !important;
      }

      /* -- 隐藏左侧的点赞信息 -- */
      .article-suspended-panel.dynamic-data-ready {
        display: none !important;
      }

      /* -- 右侧的坐着文章讲解 -- */
      .sidebar.article-sidebar {
        display: none !important;
      }

      /* -- 文章区域宽度自适应 -- */
      .main-area.article-area {
        width: auto !important;
      }
    `
    document.head.appendChild(style)
  }

  injectCSS()

  /**
   * 移除链接二次确认
   * 
   * 测试url: https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fbvaughn%2Freact-window
   */
  async function removeLinkConfirm() {
    if (!noLinkConfirm) return
    // 先临时等200ms，确保元素加载完成
    await wait(200)

    const regex = /^https?:\/\/link\.juejin\.cn\/?\?target=(.+)/
    const links = document.querySelectorAll('a')
    for (const link of links) {
      const href = link.getAttribute('href')
      if (!href) continue
      const match = href.match(regex)
      if (!match || !match[1]) continue
      link.href = decodeURIComponent(match[1])
    }
  }

  removeLinkConfirm()
})()

