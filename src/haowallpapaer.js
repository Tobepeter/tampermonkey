// ==UserScript==
// @name         zhefeng wallpaperp perf
// @name:zh-CN   哲风壁纸优化
// @namespace    tobe
// @version      0.0.1
// @description  优化好壁纸网站的交互
// @author       Tobe
// @match        https://haowallpaper.com/*
// @icon         https://haowallpaper.com/favicon.ico
// @grant        none
// @run-at       document-end
// @icon         https://haowallpaper.com/favicon.ico
// ==/UserScript==

; (async function () {
  'use strict'

  // -- config --
  const DEBUG = true
  const FIND_DOM_TIMEOUT = 1000
  const SMALL_CARD = true

  let paginationDiv, preBtn, nextBtn, valid
  let tip

  // -- utils --
  function waitUntil(predict, timeout) {
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

  function getManualPromise() {
    let callResolve
    const p = new Promise((resolve) => {
      callResolve = resolve
    })
    p.callResolve = callResolve
    return p
  }

  async function prepare() {
    const paginationDiv = await waitUntil(() => document.querySelector('#pagination'), FIND_DOM_TIMEOUT)
    if (!paginationDiv) {
      valid = false
      return
    }
    var children = paginationDiv.children
    preBtn = children[0]
    nextBtn = children[children.length - 1]
    if (!preBtn || !nextBtn) {
      valid = false
      return
    }
    valid = true
  }

  await prepare()

  if (!valid) {
    if (DEBUG) {
      console.error('[tampermonkey] haowallpaper dom not ready')
    }
    return
  }

  if (DEBUG) {
    console.log('[tampermonkey] haowallpaper ready')
  }

  /**
   * 导航
   */
  function prev() {
    hideTip()
    preBtn.click()
  }

  function next() {
    hideTip()
    nextBtn.click()
  }

  function addKeyboardEvent() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') prev()
      if (event.key === 'ArrowRight') next()
    })
  }
  addKeyboardEvent()

  /**
   * tip提示
   * @desc 提供一个tip，提示方向键来切换
   * @desc 导航后隐藏
   */
  function hideTip() {
    tip.style.opacity = '0'
  }

  function addTip() {
    tip = document.createElement('div')
    document.body.appendChild(tip)

    // use style text
    tip.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      padding: 5px;
      border-radius: 5px;
      z-index: 999;
      font-size: 30px;
      border: 1px solid white;
      transition: opacity 0.3s;
    `
    tip.textContent = '← → 切换壁纸'
  }
  addTip()

  /**
   * 将卡片设置为小卡片
   * @desc 卡片太大了，需要滚动，最好一个屏幕内能够看完
   */
  function smallCard() {
    if (!SMALL_CARD) return
    for (const styleSheet of document.styleSheets) {
      const rules = styleSheet.cssRules
      for (const rule of rules) {
        if (rule.selectorText === '.TheHomeBody .card') {
          rule.style.width = '16%'
          return
        }
      }
    }
  }
  smallCard()

  /**
   * 预加载
   * @desc 示例地址 https://haowallpaper.com/?isSel=true&page=8
   */
  const INVALID_PAGE = -999
  const loadPageRange = 3
  const loadedPage = new Set()
  let loadingPagePromise

  async function loadByIframe(page) {
    const p = getManualPromise()
    if (loadingPagePromise) {
      await loadingPagePromise
    }
    loadingPagePromise = p

    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('page', page)
    const nextPageUrl = currentUrl.toString()

    // 创建一个隐藏的iframe来加载下一页
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'

    // 监听iframe加载完成
    iframe.onload = function () {
      console.log(`预加载完成: ${nextPageUrl}`)
      p.callResolve()
      // 加载完成后移除iframe
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }

    iframe.onerror = function () {
      console.error(`预加载失败: ${nextPageUrl}`)
      p.callResolve()
    }

    iframe.src = nextPageUrl

    document.body.appendChild(iframe)
  }

  function getCurrentPage() {
    const searchParams = new URLSearchParams(window.location.search)
    const page = Number(searchParams.get('page'))
    return isNaN(page) ? INVALID_PAGE : page
  }

  async function loadPageInRange() {
    // NOTE: 暂时关闭了
    // 1. 使用iframe太多会很卡，还要考虑释放问题
    // 2. 每个iframe还会额外执行一次tampermonkey脚本，会无限加载，非常卡
    return

    await waitIdle()
    const currentPage = getCurrentPage()
    loadedPage.add(currentPage)
    if (currentPage === INVALID_PAGE) return
    for (let i = -loadPageRange; i < loadPageRange; i++) {
      const page = currentPage + i
      if (page < 1) continue
      if (loadedPage.has(page)) continue
      loadedPage.add(page)
      loadByIframe(page)
    }
  }

  loadPageInRange()

  function disableCardAni() {

    // 轮询去掉 animation-duration
    function removeAni() {
      const cards = document.querySelectorAll('.TheHomeBody .card');
      if (!cards) return;
      for (let card of cards) {
        // card.style.animationDuration = '0s';
        card.style.animationDuration = '0.05s';
      }
    }

    setInterval(removeAni, 50);
  }

  // NOTE: 其实图片有一个加载过程，关掉了体验不是很好
  // disableCardAni();
})()
