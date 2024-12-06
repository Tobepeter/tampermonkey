
function addVConsole() {
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/vconsole@3.9.0/dist/vconsole.min.js'

  script.onload = () => {
    new VConsole()
  }
  document.head.appendChild(script)
}
addVConsole()
