// ==UserScript==
// @name         HaoWallpaper Perf
// @name:zh      好壁纸页面优化
// @description  支持方向键进行导航
// @description  优化壁纸缩放尺寸，mac一屏幕能够看完
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @author       Tobe
// @match        https://haowallpaper.com/homeView*
// @grant        none
// @run-at       document-end
// @icon         https://haowallpaper.com/favicon.ico
// ==/UserScript==


(async function () {
    'use strict';

    var DEBUG = true;

    // -- feature config --
    var SMALL_CARD = true;
    var SHOW_TIP = true;

    var pageDiv, prevButton, nextButton, valid;

    function waitUntil(predict, timeout) {
        return new Promise(function (resolve, reject) {
            var timeOutId = -1;
            var intervalId = -1;
            function clear() {
                clearTimeout(timeOutId);
                clearInterval(intervalId);
            }
            intervalId = setInterval(function () {
                if (predict()) {
                    clear();
                    resolve();
                }
            })
            timeOutId = setTimeout(function () {
                clear();
                resolve(); // 外面自行处理
            }, timeout);

        })
    }

    async function preCheck() {
        await waitUntil(function () {
            pageDiv = document.getElementById('pagination');
            return !!pageDiv;
        }, 3000);
        if (!pageDiv) return;
        prevButton = pageDiv.childNodes[0];
        nextButton = pageDiv.childNodes[pageDiv.childNodes.length - 1];
        if (!prevButton || !nextButton) return;
        valid = true;
    }
    await preCheck();

    if (!valid) {
        if (DEBUG) {
            console.error('[tampermonkey] halowallpaper page navigator error');
        }
        return;
    }

    if (DEBUG) {
        console.log('[tampermonkey] haowallpaper page navigator ready');
    }

    // 从URL中获取当前页码
    function getCurrentPage() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('page')) || 1;
    }

    // 跳转到指定页面
    function goToPage(page) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('page', page);

        // NOTE: 这个会导致页面刷新
        // window.location.search = urlParams.toString();

        // NOTE: 这个不会触发react-router的效果，只是url变化了
        history.pushState(
            { page }, // state 对象
            '', // title（大多数浏览器忽略这个参数）
            `${window.location.pathname}?${urlParams.toString()}`
        );
    }

    function goPrev() {
        prevButton.click();
    }

    function goNext() {
        nextButton.click();
    }


    // 监听键盘事件
    document.addEventListener('keydown', function (e) {
        const currentPage = getCurrentPage();
        switch (e.key) {
            case 'ArrowLeft':
                // if (currentPage > 1) {
                //     goToPage(currentPage - 1);
                // }
                goPrev();
                break;
            case 'ArrowRight':
                // goToPage(currentPage + 1);
                goNext();
                break;
        }
    });

    // 默认一屏幕看不下，缩小一点卡片
    function fixCardCss() {
        if (!SMALL_CARD) return;
        for (let stylesheet of document.styleSheets) {
            for (let rule of stylesheet.cssRules) {
                if (rule.selectorText === '.TheHomeBody .card') {
                    rule.style.width = '16%';
                    return
                }
            }
        }
    }
    fixCardCss();

    // 添加提示信息
    function addTip() {
        if (!SHOW_TIP) return;
        const tip = document.createElement('div');
        tip.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 9999;
            font-size: 14px;
        `;
        tip.textContent = '← →方向键切换页面';
        document.body.appendChild(tip);

        // 3秒后隐藏提示
        setTimeout(() => {
            // tip.style.display = 'none';
            tip.remove();
        }, 3000);
    }
    addTip();

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
})();
