const fieldLabels = {
  access_code: 'código de acesso',
  member_code: 'código de membro',
  email: 'email',
  phone: 'contacto',
  password: 'senha',
  role: 'perfil',
  delegation_id: 'delegação',
  name: 'nome',
}

export function getApiErrorMessage(error, values = {}, fallback = 'Verifique os campos informados.') {
  const errors = error.response?.data?.errors
  const message = error.response?.data?.message

  if (errors && typeof errors === 'object') {
    const [field, messages] = Object.entries(errors)[0] ?? []
    const firstMessage = Array.isArray(messages) ? messages[0] : messages

    if (firstMessage) {
      const label = fieldLabels[field] ?? field
      const value = values[field]
      const text = String(firstMessage)

      if (text.toLowerCase().includes('already') || text.toLowerCase().includes('registado') || text.toLowerCase().includes('taken')) {
        return value ? `O ${label} "${value}" já foi registado.` : text
      }

      return text
    }
  }

  return message || fallback
}
