export function formatDate(date) {
  return new Intl.DateTimeFormat('pt-MZ').format(new Date(date))
}
