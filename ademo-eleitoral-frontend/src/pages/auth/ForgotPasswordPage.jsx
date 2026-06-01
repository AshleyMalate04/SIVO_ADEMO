import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FeedbackCard from '../../components/common/FeedbackCard'
import FormError from '../../components/common/FormError'
import { notify } from '../../utils/notify'
import { forgotPassword } from '../../services/authService'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (!email.trim()) {
      setError('Informe o seu email.')
      setSuccess(false)
      notify.error('Email obrigatório.', 'Informe o email para recuperar o acesso.')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Informe um email válido.')
      setSuccess(false)
      notify.error('Email inválido.', 'Digite um endereço de email válido.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await forgotPassword({ email: email.trim() })
      sessionStorage.setItem('ademo_reset_email', email.trim())
      setSuccess(true)
      notify.success('Pedido enviado.', 'Enviamos um código de segurança para o email informado.')
      window.setTimeout(() => navigate('/verificar-codigo'), 750)
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Não foi possível enviar o código. Tente novamente.'
      setError(message)
      notify.error('Pedido não enviado.', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-copy">
        <h2>Recuperar acesso</h2>
        <p>Introduza o seu email</p>
      </div>

      {success ? (
        <FeedbackCard
          title="Pedido enviado"
          message="Enviamos um código de segurança para o email informado."
        />
      ) : null}

      <label className="form-field">
        <span>EMAIL</span>
        <input
          aria-invalid={Boolean(error)}
          name="email"
          onChange={(event) => {
            setEmail(event.target.value)
            setError('')
          }}
          placeholder="exemplo@gmail.com"
          type="email"
          value={email}
        />
        <FormError message={error} />
      </label>

      <div className="auth-link-row">
        <Link to="/login">Voltar ao login</Link>
      </div>

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? 'A enviar...' : 'Enviar pedido'}
      </button>
    </form>
  )
}
