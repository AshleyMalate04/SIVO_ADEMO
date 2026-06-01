export const toInputDateTime = (value) => {
  if (!value) return ''

  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    const hours = String(value.getHours()).padStart(2, '0')
    const minutes = String(value.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  return String(value).replace(' ', 'T').slice(0, 16)
}

export const getCurrentMinDateTime = () => toInputDateTime(new Date())
export const getTodayMinDateTime = getCurrentMinDateTime

export const toApiDateTime = (value) => {
  if (!value) return ''
  const normalised = String(value).replace('T', ' ').slice(0, 16)
  return `${normalised}:00`
}

export const isBeforeNow = (value) => {
  if (!value) return false
  return String(value).slice(0, 16) < getCurrentMinDateTime()
}

export const isBeforeToday = isBeforeNow

export const isSameOrBefore = (endValue, startValue) => {
  if (!endValue || !startValue) return false
  return String(endValue).slice(0, 16) <= String(startValue).slice(0, 16)
}

export const formatDateTime = (value) => {
  if (!value) return 'Sem data'
  const [datePart, timePart = ''] = String(value).replace(' ', 'T').split('T')
  const [year, month, day] = datePart.split('-')
  const [hour = '00', minute = '00'] = timePart.split(':')
  if (!year || !month || !day) return String(value)
  return `${day}/${month}/${year} ${hour}:${minute}`
}
