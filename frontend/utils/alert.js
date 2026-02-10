import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export const showSuccessToast = (title = "Success!") => {
  Toast.fire({
    icon: "success",
    title: title,
  });
};

export const showErrorToast = (text, title = "An Error Occurred") => {
  Toast.fire({
    icon: "error",
    title: title,
    text: text,
    timer: 5000,
  });
};

export const showWarningToast = (text, title = "Warning!") => {
  Toast.fire({
    icon: "warning",
    title: title,
    text: text,
    timer: 1500,
  });
};

export const showConfirmationDialog = async (
  title = "Are you sure?",
  text = "You won't be able to revert this!",
) => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, proceed!",
    cancelButtonText: "No, cancel",
    allowOutsideClick: true,
    allowEscapeKey: true,
  });

  return {
    isConfirmed: result.isConfirmed,
    isDenied: result.isDenied,
    isDismissed: result.isDismissed,
  };
};

export const showSuccess = (title, message) => showSuccessToast(title);
export const showError = (title, message) => showErrorToast(message, title);
export const showConfirm = async (title, message) => {
  const result = await showConfirmationDialog(title, message);
  return { isConfirmed: result.isConfirmed };
};

export const showBillNotification = async (bill) => {
  const result = await Swal.fire({
    title: "New Bill Detected",
    html: `
      <div style="text-align: left;">
        <p><strong>Merchant:</strong> ${bill.description}</p>
        <p><strong>Amount:</strong> ${bill.amount}</p>
        <p><strong>Date:</strong> ${new Date(
          bill.date,
        ).toLocaleDateString()}</p>
      </div>
    `,
    icon: "info",
    showCancelButton: true,
    confirmButtonText: "Mark as Paid",
    cancelButtonText: "Remind Later",
    confirmButtonColor: "#10b981",
    cancelButtonColor: "#6b7280",
    allowOutsideClick: false,
  });

  return result.isConfirmed ? "PAID" : "SNOOZE";
};

export default {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showConfirmationDialog,
  showBillNotification,
  showSuccess,
  showError,
  showConfirm,
};
