import { useRef, useState } from 'react'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import RequiredLabel from '../../components/common/RequiredLabel'
import { settingService } from '../../services/settingService'
import { notify } from '../../utils/notify'
import { getApiErrorMessage } from '../../utils/apiError'
import { getAuthMenu, getAuthToken, getAuthUser, saveAuthData } from '../../lib/storage'

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
      notify.error('Campos obrigatorios.', 'Preencha a palavra-passe actual, a nova palavra-passe e a confirmacao.', { id: passwordToastId })
      submitLockRef.current = false
      return
    }

    if (newPassword.length < 8) {
      notify.error('Palavra-passe invalida.', 'A nova palavra-passe deve ter pelo menos 8 caracteres.', { id: passwordToastId })
      submitLockRef.current = false
      return
    }

    if (newPassword !== confirmPassword) {
      notify.error('Confirmacao invalida.', 'A confirmacao deve ser igual a nova palavra-passe.', { id: passwordToastId })
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
      notify.success('Palavra-passe actualizada com sucesso.', 'A alteracao foi guardada na base de dados.', { id: passwordToastId })
      form.reset()
    } catch (error) {
      const message = getApiErrorMessage(error)
      notify.error('Palavra-passe nao actualizada.', message, { id: passwordToastId })
    } finally {
      setIsSavingPassword(false)
      submitLockRef.current = false
    }
  }

  return (
    <section className="management-page settings-page">
      <header className="management-header">
        <h1>Configuracoes</h1>
        <p>Altere a palavra-passe da sua conta.</p>
      </header>

      <section className="settings-grid settings-compact-grid settings-password-only">
        <form className="settings-card" onSubmit={handlePasswordSubmit} noValidate>
          <div className="settings-card-header">
            <div>
              <h2>Seguranca da conta</h2>
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
      </section>
    </section>
  )
}
