import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import FeedbackCard from '../../components/common/FeedbackCard'
import FormError from '../../components/common/FormError'
import { resetPassword } from '../../services/authService'
import { settingService } from '../../services/settingService'
import { getAuthUser, saveAuthData, getAuthToken, getAuthMenu } from '../../lib/storage'
import { notify } from '../../utils/notify'

const redirectByRole = (role) => (['ELEITOR', 'VOTER'].includes(role) ? '/portal-eleitor/votacoes' : '/dashboard')

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const firstAccess = searchParams.get('primeiro_acesso') === '1'
  const resetEmail = searchParams.get('email') || sessionStorage.getItem('ademo_reset_email') || ''
  const resetCode = sessionStorage.getItem('ademo_reset_code') || ''
  const [values, setValues] = useState({
    password: '',
    passwordConfirmation: '',
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function updateField(event) {
    const { name, value } = event.target

    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '', form: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}

    if (!firstAccess && (!resetEmail || !resetCode)) {
      nextErrors.form = 'Confirme primeiro o código enviado para o seu email.'
    }

    if (values.password.length < 8) {
      nextErrors.password = 'A nova palavra-passe deve ter pelo menos 8 caracteres.'
    }

    if (values.passwordConfirmation !== values.password) {
      nextErrors.passwordConfirmation = 'As palavras-passe não coincidem.'
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      setSuccess(false)
      notify.error('Não foi possível actualizar a palavra-passe.', 'Verifique os campos assinalados.')
      return
    }

    setLoading(true)

    try {
      if (firstAccess) {
        await settingService.updatePassword({
          current_password: '12345678',
          password: values.password,
          password_confirmation: values.passwordConfirmation,
        })
        const user = getAuthUser()
        saveAuthData({
          token: getAuthToken(),
          user: { ...user, must_change_password: false },
          menu: getAuthMenu(),
        })
        setSuccess(true)
        notify.success('Palavra-passe definida.', 'A redireccionar para a sua área inicial.')
        window.setTimeout(() => navigate(redirectByRole(user?.role), { replace: true }), 900)
      } else {
        await resetPassword({
          email: resetEmail,
          code: resetCode,
          password: values.password,
          password_confirmation: values.passwordConfirmation,
        })
        sessionStorage.removeItem('ademo_reset_email')
        sessionStorage.removeItem('ademo_reset_code')
        setSuccess(true)
        notify.success('Palavra-passe actualizada.', 'Pode iniciar sessão com a nova palavra-passe.')
        window.setTimeout(() => navigate('/login'), 900)
      }
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Não foi possível actualizar a palavra-passe.'
      setErrors((current) => ({ ...current, form: message }))
      notify.error('Palavra-passe não actualizada.', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-copy">
        <h2>{firstAccess ? 'Definir palavra-passe' : 'Nova palavra-passe'}</h2>
        <p>{firstAccess ? 'Defina a palavra-passe que pretende usar na plataforma. Pode manter a palavra-passe inicial, caso seja essa a sua escolha.' : 'Crie uma palavra-passe forte para proteger a segurança da sua conta.'}</p>
      </div>

      {success ? (
        <FeedbackCard
          title={firstAccess ? 'Palavra-passe definida' : 'Palavra-passe actualizada'}
          message={firstAccess ? 'A redireccionar para a sua área inicial.' : 'Pode iniciar sessão com a nova palavra-passe.'}
        />
      ) : null}

      <FormError message={errors.form} />

      <label className="form-field">
        <span>NOVA PALAVRA-PASSE</span>
        <input
          aria-invalid={Boolean(errors.password)}
          name="password"
          onChange={updateField}
          placeholder="........"
          type="password"
          value={values.password}
        />
        <FormError message={errors.password} />
      </label>

      <label className="form-field">
        <span>CONFIRMAR</span>
        <input
          aria-invalid={Boolean(errors.passwordConfirmation)}
          name="passwordConfirmation"
          onChange={updateField}
          placeholder="........"
          type="password"
          value={values.passwordConfirmation}
        />
        <FormError message={errors.passwordConfirmation} />
      </label>

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? 'A actualizar...' : 'Confirmar'}
      </button>

      <Link className="cancel-link" to={firstAccess ? '/login' : '/login'}>
        CANCELAR E VOLTAR
      </Link>
    </form>
  )
}
