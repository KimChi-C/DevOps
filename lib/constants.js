export const CATEGORIES = ["Tất cả", "Chăm sóc da", "Trang điểm", "Tóc", "Cơ thể", "Phụ kiện"];
export const formatVND = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value || 0));
