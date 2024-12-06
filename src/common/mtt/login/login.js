
function autoLogin() {
  // -- config -- 
  const emailMap = {
    'localhost': 'tobe583590744+dev01@gmail.com'
  }

  // -- utils -- 
  const isViteLocal = () => {
    // 地址是localhost:5173
    return window.location.host.includes('localhost') && window.location.port === '5173'
  }

  const getEmail = () => {
    return emailMap.localhost
  }

  const isMtt = () => {
    const selector = '.mtt-loading-box'
    return document.querySelector(selector) !== null
  }

  const isLoginView = () => {
    const selector = '.login-title'
    return document.querySelector(selector) !== null
  }

  const getLoginInput = () => {
    // document.querySelector('.mtt-input.mtt-input-lg')
    // 找到第一个input
    const inputs = document.querySelectorAll('input')
    return inputs[0]
  }

  // -- main -- 
  if (!isMtt()) return
  if (!isLoginView()) return
}
