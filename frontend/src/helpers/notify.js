// Centralized toast/notification helpers using SweetAlert2
import Swal from 'sweetalert2'

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  showCloseButton: true,
  didOpen: (el) => {
    try {
      el.style.padding = '8px 12px'
      el.style.fontSize = '14px'
      el.style.minHeight = 'auto'
    } catch (_) {}
  },
})

export const notifySuccess = (title = 'Success', text = '') =>
  toast.fire({ icon: 'success', title, text })

export const notifyError = (title = 'Error', text = '') =>
  toast.fire({ icon: 'error', title, text })

export const notifyInfo = (title = 'Info', text = '') =>
  toast.fire({ icon: 'info', title, text })

export const confirm = (title, text, confirmButtonText = 'Yes', options = {}) =>
  Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: options.cancelButtonText || 'Cancel',
    ...options,
  })

export default {
  notifySuccess,
  notifyError,
  notifyInfo,
  confirm,
}
