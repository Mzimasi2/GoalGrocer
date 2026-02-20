export function currency(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "R0.00";
  return `R${value.toFixed(2)}`;
}

export function formatDate(dateIso) {
  if (!dateIso) return "-";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}
