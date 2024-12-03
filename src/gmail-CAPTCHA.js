// ==UserScript==
// @name          gmail-CAPTCHA
// @namespace     https://github.com/Tobe-T
// @version       0.0.1
// @description   自动复制 gmail 验证码
// @author        Tobe
// @match         https://mail.google.com/*
// @grant         GM_setClipboard
// @run-at        document-end
// @icon          https://mail.google.com/favicon.ico
// ==/UserScript==

; (async function () {
  'use strict'
  // -- config --
  const DEBUG = true

  // -- utils --
  function waitUntil(predict, timeout = 2 * 1000) {
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

  function log(msg) {
    if (DEBUG) {
      console.log(msg)
    }
  }

  class Tip {
    tip = null
    hideTipTimerId = -1
    tipPulseTimerId = -1

    init() {
      this.tip = document.createElement('div')
      document.body.appendChild(this.tip)
      this.tip.style.cssText = `
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
        opacity: 0;
      `
      this.tip.textContent = '提示'
    }

    hide() {
      this.tip.style.opacity = 0
    }

    show(msg, { autoHide = true, pulse = true } = {}) {
      this.tip.textContent = msg
      this.tip.style.opacity = 1

      clearTimeout(this.hideTipTimerId)
      if (autoHide) {
        this.hideTipTimerId = setTimeout(() => {
          this.tip.style.opacity = 0
        }, 3000)
      }

      if (pulse) {
        this.pulse()
      }
    }

    pulse() {
      let scale = 1
      let growing = true
      const scaleStep = 0.05
      const finalScale = 1.3
      clearInterval(this.tipPulseTimerId)
      this.tipPulseTimerId = setInterval(() => {
        if (growing) {
          scale += scaleStep
          if (scale >= finalScale) growing = false
        } else {
          scale -= scaleStep
          if (scale <= 1) {
            clearInterval(this.tipPulseTimerId)
          }
        }
        this.tip.style.transform = `scale(${scale})`
      }, 16)
    }
  }


  let inputboxBtn, valid, inputboxATag
  const tip = new Tip()

  async function preCheck() {
    inputboxBtn = await waitUntil(() => document.querySelector('div[data-tooltip="收件箱"]'))
    if (!inputboxBtn) return

    // 找到 inboxDiv 的子元素中 a 标签
    inputboxATag = inputboxBtn.querySelector('a')
    if (!inputboxATag) return

    const isValidATag = inputboxATag.textContent === '收件箱' && inputboxATag.href.includes('#inbox')
    if (!isValidATag) return

    valid = true
  }

  await preCheck()

  if (!valid) {
    if (DEBUG) {
      console.log('[tampermonkey] gmail-CAPTCHA preCheck failed')
    }
    return
  }

  if (DEBUG) {
    console.log('[tampermonkey] gmail-CAPTCHA preCheck success')
  }

  async function gotoInbox() {
    if (isEntryInbox()) return true
    inputboxBtn.click()
    return await waitUntil(() => isEntryInbox())
  }

  function isReadingMail() {
    // 注意进入到邮箱会多一个斜杠
    return window.location.hash.includes('#inbox/')
  }

  function isEntryInbox() {
    return window.location.hash.includes('#inbox')
  }

  async function clickFirstEmail() {
    if (!isEntryInbox()) return false

    // 找到第一个item
    function waitClickUnread() {
      // 有多个table中，找到收件列表的那个
      const tables = document.querySelectorAll('table')
      let findTable = null
      for (const table of tables) {
        const trs = table.querySelectorAll('tr')
        if (trs.length === 0) continue
        const td = trs[0].querySelector('td[data-tooltip="选择"]')
        if (td) {
          findTable = table
          break
        }
      }
      if (!findTable) return false

      const trs = findTable.querySelectorAll('tr')
      if (trs.length === 0) return false

      function checkIsUnread(tr) {
        // 找到 tr 下的一个含有 email 熟悉的 span
        const span = tr.querySelector('span[email]')
        if (!span) return false
        const fontWeight = +getComputedStyle(span).fontWeight

        return fontWeight !== 400
      }

      if (!checkIsUnread(trs[0])) return false

      const firstTr = trs[0]
      firstTr.click()

      return true
    }

    tip.show('等待未读邮件', { autoHide: false })

    // show ...
    let dotCount = 0
    const dotInterval = 100
    const dotMax = 3
    const dotTimerId = setInterval(() => {
      dotCount++
      if (dotCount > dotMax) dotCount = 0
      tip.tip.textContent = '等待未读邮件' + '.'.repeat(dotCount)
    }, dotInterval)

    const waitTime = 20 * 1000
    const clickFirstEmailSuccess = await waitUntil(() => waitClickUnread(), waitTime)

    clearInterval(dotTimerId)

    if (!clickFirstEmailSuccess) {
      tip.textContent = `未找到未读邮件`
      log(`未找到未读邮件，等待时间：${waitTime}ms`)
      return false
    }
    tip.hide()

    return await waitUntil(() => isReadingMail())
  }

  function getCaptcha() {
    let result = ''
    const walk = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
    )

    while (walk.nextNode()) {
      let content = walk.currentNode.textContent.trim()
      if (content.length === 6 && content.match(/^\d+$/)) {
        result = content
        break
      }
    }

    return result
  }

  function addKeyboardListener() {
    document.addEventListener('keydown', async (event) => {
      if (event.key === 't') {
        tip.hide()
        const inboxSuccess = await gotoInbox()
        if (!inboxSuccess) {
          tip.show('进入收件箱失败')
          return
        }

        if (!isReadingMail()) {
          const firstEmailSuccess = await clickFirstEmail()
          if (!firstEmailSuccess) {
            tip.show('点击第一封邮件失败')
            return
          }
        }

        const captcha = getCaptcha()
        if (captcha) {
          GM_setClipboard(captcha)
          tip.show('复制成功')
        } else {
          tip.show('未找到验证码')
        }
      }
    })
  }

  addKeyboardListener()

  function initTip() {
    tip.init()
    tip.show('按T执行自动化', { pulse: false })
  }

  initTip()

})()