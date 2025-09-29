// Disable Developer Tools in Production
// Add this to your main app component or index.js

;(function () {
  'use strict'

  // Only in production builds
  if (process.env.NODE_ENV === 'production') {
    // Disable right-click context menu
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault()
      return false
    })

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    document.addEventListener('keydown', function (e) {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault()
        return false
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault()
        return false
      }
    })

    // Detect DevTools and show warning
    let devtools = false
    setInterval(function () {
      if (
        window.outerHeight - window.innerHeight > 200 ||
        window.outerWidth - window.innerWidth > 200
      ) {
        if (!devtools) {
          devtools = true
          console.clear()
          console.log(
            '%c⚠️ WARNING: Unauthorized access detected!',
            'color: red; font-size: 24px; font-weight: bold;',
          )
        }
      } else {
        devtools = false
      }
    }, 500)

    // Override console methods in production
    if (typeof console !== 'undefined') {
      console.log = function () {}
      console.warn = function () {}
      console.error = function () {}
      console.info = function () {}
      console.debug = function () {}
    }

    // Prevent text selection (optional)
    document.onselectstart = function () {
      return false
    }

    // Prevent image dragging (optional)
    document.ondragstart = function () {
      return false
    }
  }
})()
