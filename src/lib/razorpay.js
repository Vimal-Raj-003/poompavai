let p;
export function loadRazorpay() {
  p ||= new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(window.Razorpay);
    s.onerror = () => { p = null; reject(new Error('razorpay')); };
    document.head.appendChild(s);
  });
  return p;
}
