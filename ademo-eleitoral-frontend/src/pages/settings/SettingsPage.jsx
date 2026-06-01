import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, ShieldCheck, Type } from 'lucide-react'
import RequiredLabel from '../../components/common/RequiredLabel'
import { settingService } from '../../services/settingService'
import { notify } from '../../utils/notify'
import { getApiErrorMessage } from '../../utils/apiError'
import { getAuthMenu, getAuthToken, getAuthUser, saveAuthData } from '../../lib/storage'

const updatePreference = (key, value) => {
  localStorage.setItem(key, value)
  window.dispatchEvent(new Event('ademo-preferences-change'))
}

function PasswordField({ label, name }) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="form-field password-field">
      <RequiredLabel>{label}</RequiredLabel>
      <div className="password-input-shell">
        <input name={name} type={visible ? 'text' : 'password'} autoComplete="new-password" />
        <button type="button" className="password-eye-button" aria-label={visible ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'} onClick={() => setVisible((current) => !current)}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  )
}

export default function SettingsPage() {
  const passwordToastId = 'settings-password-update'
  const submitLockRef = useRef(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(() => localStorage.getItem('ademo-accessibility') === 'true')

  useEffect(() => {
    updatePreference('ademo-accessibility', String(accessibilityEnabled))
  }, [accessibilityEnabled])

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    if (isSavingPassword || submitLockRef.current) return
    submitLockRef.current = true

    const form = event.currentTarget
    const formData = new FormData(form)
    const currentPassword = String(formData.get('current_password') || '')
    const newPassword = String(formData.get('password') || '')
    const confirmPassword = String(formData.get('password_confirmation') || '')

    if (!currentPassword || !newPassword || !confirmPassword) {
      notify.error('Campos obrigatórios.', 'Preencha a palavra-passe actual, a nova palavra-passe e a confirmação.', { id: passwordToastId })
      submitLockRef.current = false
      return
    }

    if (newPassword.length < 8) {
      notify.error('Palavra-passe inválida.', 'A nova palavra-passe deve ter pelo menos 8 caracteres.', { id: passwordToastId })
      submitLockRef.current = false
      return
    }

    if (newPassword !== confirmPassword) {
      notify.error('Confirmação inválida.', 'A confirmação deve ser igual à nova palavra-passe.', { id: passwordToastId })
      submitLockRef.current = false
      return
    }

    try {
      setIsSavingPassword(true)
      const updatedPasswordPayload = await settingService.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })
      const user = getAuthUser()
      if (user) {
        saveAuthData({
          token: getAuthToken(),
          user: { ...user, ...(updatedPasswordPayload?.user ?? {}), must_change_password: false },
          menu: getAuthMenu(),
        })
      }
      notify.success('Palavra-passe actualizada com sucesso.', 'A alteração foi guardada na base de dados.', { id: passwordToastId })
      form.reset()
    } catch (error) {
      const message = getApiErrorMessage(error)
      notify.error('Palavra-passe não actualizada.', message, { id: passwordToastId })
    } finally {
      setIsSavingPassword(false)
      submitLockRef.current = false
    }
  }

  return (
    <section className="management-page settings-page">
      <header className="management-header">
        <h1>Configurações</h1>
        <p>Altere a palavra-passe e active opções de acessibilidade.</p>
      </header>

      <section className="settings-grid settings-compact-grid">
        <form className="settings-card" onSubmit={handlePasswordSubmit} noValidate>
          <div className="settings-card-header">
            <div>
              <h2>Segurança da conta</h2>
              <p>Use uma palavra-passe forte e diferente da palavra-passe anterior.</p>
            </div>
            <ShieldCheck size={22} />
          </div>
          <div className="form-grid two-columns">
            <PasswordField label="Palavra-passe actual" name="current_password" />
            <PasswordField label="Nova palavra-passe" name="password" />
            <PasswordField label="Confirmar palavra-passe" name="password_confirmation" />
          </div>
          <div className="form-footer">
            <button className="primary-action-button" type="submit" disabled={isSavingPassword}>
              {isSavingPassword ? 'A guardar...' : 'Guardar palavra-passe'}
            </button>
          </div>
        </form>

        <section className="settings-card settings-preferences">
          <div className="settings-card-header">
            <div>
              <h2>Acessibilidade</h2>
              <p>Melhore contraste e conforto de leitura.</p>
            </div>
            <label className="toggle-switch" title="Acessibilidade">
              <input checked={accessibilityEnabled} type="checkbox" onChange={() => setAccessibilityEnabled((current) => !current)} />
              <span></span>
            </label>
          </div>
          <p className="settings-state-text">
            <Type size={16} /> {accessibilityEnabled ? 'Acessibilidade activa' : 'Acessibilidade desactivada'}
          </p>
        </section>
      </section>
    </section>
  )
}
