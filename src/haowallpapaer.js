// ==UserScript==
// @name         zhefeng wallpaperp perf
// @name:zh-CN   哲风壁纸优化
// @namespace    tobe
// @version      0.0.1
// @description  一键下载好壁纸网站的图片
// @author       Tobe
// @match        https://haowallpaper.com/*
// @icon         https://haowallpaper.com/favicon.ico
// @grant        none
// @run-at       document-end
// ==/UserScript==

;(async function () {
  'use strict'

  // -- config --
  const DEBUG = true
  const FIND_DOM_TIMEOUT = 1000
  const SMALL_CARD = true

  let paginationDiv, preBtn, nextBtn, valid
  let tip

  function waitUntil(predict, timeout) {
    return new Promise((resolve, reject) => {
      var timeOutId = -1,
        intervalId = -1
      function clear() {
        clearTimeout(timeOutId)
        clearInterval(intervalId)
      }

      function check() {
        if (predict()) {
          clear()
          resolve()
        }
      }

      timeOutId = setTimeout(() => {
        clear()
        resolve()
      }, timeout)
      intervalId = setInterval(check, 100)
      check()
    })
  }

  async function prepare() {
    await waitUntil(() => {
      paginationDiv = document.querySelector('#pagination')
      return paginationDiv
    }, FIND_DOM_TIMEOUT)
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

  // ----- navigation -----
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

  // ----- tip -----
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

  // ----- small card -----
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
})()
