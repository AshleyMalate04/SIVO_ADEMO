export function formatNumber(value) {
  return new Intl.NumberFormat('pt-MZ').format(value)
}
