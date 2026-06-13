import Swal from 'sweetalert2';

export const swal = {
  confirm: (title, text, confirmText = 'Ya', cancelText = 'Batal') => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      background: '#1A1D27',
      color: '#E0E0E0',
      width: 340,
      padding: '20px 24px',
      customClass: {
        popup: 'swal-dark',
        title: 'swal-title',
        htmlContainer: 'swal-text',
        confirmButton: 'swal-btn-confirm',
        cancelButton: 'swal-btn-cancel',
      }
    });
  },

  success: (title, text) => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      background: '#1A1D27',
      color: '#E0E0E0',
      confirmButtonColor: '#3b82f6',
      width: 340,
      padding: '20px 24px',
      customClass: {
        popup: 'swal-dark',
        confirmButton: 'swal-btn-confirm',
      }
    });
  },

  error: (title, text) => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      background: '#1A1D27',
      color: '#E0E0E0',
      confirmButtonColor: '#ef4444',
      width: 340,
      padding: '20px 24px',
      customClass: {
        popup: 'swal-dark',
        confirmButton: 'swal-btn-confirm',
      }
    });
  },

  info: (title, text) => {
    return Swal.fire({
      icon: 'info',
      title,
      text,
      background: '#1A1D27',
      color: '#E0E0E0',
      confirmButtonColor: '#3b82f6',
      width: 340,
      padding: '20px 24px',
      customClass: {
        popup: 'swal-dark',
        confirmButton: 'swal-btn-confirm',
      }
    });
  },

  toast: (icon, title) => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: '#1A1D27',
      color: '#E0E0E0',
    });

    Toast.fire({ icon, title });
  }
};

export default swal;