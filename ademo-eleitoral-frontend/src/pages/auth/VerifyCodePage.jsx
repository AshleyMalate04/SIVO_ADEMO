import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import FeedbackCard from '../../components/common/FeedbackCard'
import FormError from '../../components/common/FormError'
import { forgotPassword, verifyCode } from '../../services/authService'
import { notify } from '../../utils/notify'

const codeFields = Array.from({ length: 6 }, (_, index) => index)

function digitsToArray(value = '') {
  return value.replace(/\D/g, '').slice(0, 6).padEnd(6, ' ').split('').map((digit) => digit.trim())
}

export default function VerifyCodePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inputsRef = useRef([])
  const email = useMemo(() => {
    const queryEmail = searchParams.get('email')

    if (queryEmail) {
      sessionStorage.setItem('ademo_reset_email', queryEmail)
      return queryEmail
    }

    return sessionStorage.getItem('ademo_reset_email') || ''
  }, [searchParams])
  const [code, setCode] = useState(() => digitsToArray(searchParams.get('code') || ''))
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  function fillCode(value, startIndex = 0) {
    const digits = value.replace(/\D/g, '').slice(0, 6 - startIndex)

    if (!digits) return

    const nextCode = [...code]
    digits.split('').forEach((digit, offset) => {
      nextCode[startIndex + offset] = digit
    })
    setCode(nextCode)
    setError('')

    const nextFocus = Math.min(startIndex + digits.length, code.length - 1)
    inputsRef.current[nextFocus]?.focus()
  }

  function updateCode(index, value) {
    if (value.length > 1) {
      fillCode(value, index)
      return
    }

    const cleanValue = value.replace(/\D/g, '').slice(0, 1)
    const nextCode = [...code]
    nextCode[index] = cleanValue
    setCode(nextCode)
    setError('')

    if (cleanValue && index < code.length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, event) {
    if (event.key !== 'Backspace') return

    if (code[index]) {
      const nextCode = [...code]
      nextCode[index] = ''
      setCode(nextCode)
      event.preventDefault()
      return
    }

    if (index > 0) {
      const nextCode = [...code]
      nextCode[index - 1] = ''
      setCode(nextCode)
      inputsRef.current[index - 1]?.focus()
      event.preventDefault()
    }
  }

  function handlePaste(index, event) {
    event.preventDefault()
    fillCode(event.clipboardData.getData('text'), index)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const typedCode = code.join('')

    if (!email) {
      setError('Volte a informar o email para recuperar o acesso.')
      notify.error('Email em falta.', 'Informe novamente o email de recuperação.')
      return
    }

    if (code.some((digit) => !digit)) {
      setError('Preencha os 6 dígitos do código.')
      notify.error('Código incompleto.', 'Preencha os 6 dígitos do código de segurança.')
      return
    }

    setLoading(true)

    try {
      await verifyCode({ email, code: typedCode })
      sessionStorage.setItem('ademo_reset_code', typedCode)
      notify.success('Código confirmado.', 'Pode criar uma nova palavra-passe.')
      navigate(`/nova-senha?email=${encodeURIComponent(email)}`)
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Código inválido ou expirado.'
      setError(message)
      notify.error('Código não confirmado.', message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email) {
      setError('Volte a informar o email para recuperar o acesso.')
      return
    }

    setResending(true)
    setError('')

    try {
      await forgotPassword({ email })
      setResent(true)
      notify.success('Código reenviado.', 'Verifique novamente a sua caixa de entrada.')
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Não foi possível reenviar o código.'
      setError(message)
      notify.error('Código não reenviado.', message)
    } finally {
      setResending(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-copy">
        <h2>Verificação de identidade</h2>
        <p>
          Enviámos um código de segurança para o seu email
          <br />
          <strong>{email || 'email informado'}</strong>
        </p>
      </div>

      {resent ? (
        <FeedbackCard
          title="Código reenviado"
          message="Verifique novamente a sua caixa de entrada."
          type="info"
        />
      ) : null}

      <div className="code-grid" aria-label="Código de segurança">
        {codeFields.map((field) => (
          <input
            aria-label={`Dígito ${field + 1}`}
            aria-invalid={Boolean(error)}
            inputMode="numeric"
            key={field}
            maxLength="6"
            onChange={(event) => updateCode(field, event.target.value)}
            onKeyDown={(event) => handleKeyDown(field, event)}
            onPaste={(event) => handlePaste(field, event)}
            ref={(element) => {
              inputsRef.current[field] = element
            }}
            value={code[field]}
          />
        ))}
      </div>
      <FormError message={error} />

      <div className="code-meta">
        <button type="button" disabled={resending} onClick={handleResend}>
          {resending ? 'A reenviar...' : 'Reenviar código'}
        </button>
      </div>

      <div className="auth-link-row">
        <Link to="/login">Voltar ao login</Link>
      </div>

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? 'A confirmar...' : 'Confirmar'}
      </button>
    </form>
  )
}
