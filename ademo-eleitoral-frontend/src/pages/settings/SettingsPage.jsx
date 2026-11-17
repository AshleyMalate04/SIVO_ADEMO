import { useEffect, useMemo, useRef, useState } from 'react'
import { AtSign, BadgeCheck, Eye, EyeOff, IdCard, LockKeyhole, Mail, Phone, Save, ShieldCheck, UserRound } from 'lucide-react'
import RequiredLabel from '../../components/common/RequiredLabel'
import { settingService } from '../../services/settingService'
import { getMe } from '../../services/authService'
import { notify } from '../../utils/notify'
import { getApiErrorMessage } from '../../utils/apiError'
import { getAuthMenu, getAuthToken, getAuthUser, saveAuthData } from '../../lib/storage'
import { getRoleLabel } from '../../constants/roles'

function PasswordField({ label, name, autoComplete }) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="form-field password-field">
      <RequiredLabel>{label}</RequiredLabel>
      <div className="password-input-shell">
        <LockKeyhole size={18} aria-hidden="true" />
        <input name={name} type={visible ? 'text' : 'password'} autoComplete={autoComplete} placeholder="Introduza a palavra-passe" />
        <button type="button" className="password-eye-button" aria-label={visible ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'} onClick={() => setVisible((current) => !current)}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  )
}

function saveUser(updatedUser) {
  const current = getAuthUser()
  saveAuthData({
    token: getAuthToken(),
    user: { ...current, ...updatedUser },
    menu: getAuthMenu(),
  })
}

export default function SettingsPage() {
  const initialUser = getAuthUser() || {}
  const profileLockRef = useRef(false)
  const passwordLockRef = useRef(false)
  const [section, setSection] = useState('personal')
  const [user, setUser] = useState(initialUser)
  const [profile, setProfile] = useState({ name: initialUser.name || '', email: initialUser.email || '', phone: initialUser.phone || '' })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    let active = true
    getMe().then((response) => {
      const freshUser = response?.data ?? response
      if (!active || !freshUser?.id) return
      setUser(freshUser)
      setProfile({ name: freshUser.name || '', email: freshUser.email || '', phone: freshUser.phone || '' })
      saveUser(freshUser)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const initials = useMemo(() => user.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AD', [user.name])

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    if (isSavingProfile || profileLockRef.current) return
    profileLockRef.current = true

    if (profile.name.trim().split(/\s+/).length < 2) {
      notify.error('Nome incompleto.', 'Informe o nome e o apelido.', { id: 'settings-profile-update' })
      profileLockRef.current = false
      return
    }

    try {
      setIsSavingProfile(true)
      const updatedUser = await settingService.updateProfile({
        name: profile.name.trim(),
        email: profile.email.trim() || null,
        phone: profile.phone.replace(/\s+/g, '') || null,
      })
      setUser(updatedUser)
      setProfile({ name: updatedUser.name || '', email: updatedUser.email || '', phone: updatedUser.phone || '' })
      saveUser(updatedUser)
      window.dispatchEvent(new Event('ademo-user-updated'))
      notify.success('Perfil actualizado.', 'Os seus dados pessoais foram guardados com segurança.', { id: 'settings-profile-update' })
    } catch (error) {
      notify.error('Perfil não actualizado.', getApiErrorMessage(error), { id: 'settings-profile-update' })
    } finally {
      setIsSavingProfile(false)
      profileLockRef.current = false
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    if (isSavingPassword || passwordLockRef.current) return
    passwordLockRef.current = true
    const form = event.currentTarget
    const formData = new FormData(form)
    const currentPassword = String(formData.get('current_password') || '')
    const newPassword = String(formData.get('password') || '')
    const confirmPassword = String(formData.get('password_confirmation') || '')

    if (!currentPassword || !newPassword || !confirmPassword) {
      notify.error('Campos obrigatórios.', 'Preencha as três palavras-passe.', { id: 'settings-password-update' })
      passwordLockRef.current = false
      return
    }
    if (newPassword.length < 8) {
      notify.error('Palavra-passe inválida.', 'Use pelo menos 8 caracteres.', { id: 'settings-password-update' })
      passwordLockRef.current = false
      return
    }
    if (newPassword !== confirmPassword) {
      notify.error('Confirmação inválida.', 'As novas palavras-passe devem ser iguais.', { id: 'settings-password-update' })
      passwordLockRef.current = false
      return
    }

    try {
      setIsSavingPassword(true)
      const payload = await settingService.updatePassword({ current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword })
      if (payload?.user) {
        setUser((current) => ({ ...current, ...payload.user }))
        saveUser({ ...payload.user, must_change_password: false })
      }
      notify.success('Palavra-passe actualizada.', 'A nova palavra-passe já está activa.', { id: 'settings-password-update' })
      form.reset()
    } catch (error) {
      notify.error('Palavra-passe não actualizada.', getApiErrorMessage(error), { id: 'settings-password-update' })
    } finally {
      setIsSavingPassword(false)
      passwordLockRef.current = false
    }
  }

  return (
    <section className="management-page profile-page">
      <header className="management-header profile-page-header">
        <div><h1>O meu perfil</h1><p>Consulte e actualize os seus dados pessoais e de acesso.</p></div>
      </header>

      <div className="profile-workspace">
        <aside className="profile-summary-card">
          <div className="profile-identity">
            <span className="profile-avatar">{initials}</span>
            <div><strong>{user.name || 'Utilizador'}</strong><span>{user.email || 'Sem email registado'}</span></div>
          </div>
          <dl className="profile-facts">
            <div><dt><IdCard size={16} /> Código de acesso</dt><dd>{user.access_code || '—'}</dd></div>
            <div><dt><BadgeCheck size={16} /> Perfil</dt><dd>{getRoleLabel(user.role)}</dd></div>
            <div><dt>Estado</dt><dd><span className="profile-status">Conta activa</span></dd></div>
          </dl>
          <nav className="profile-section-nav" aria-label="Secções do perfil">
            <button className={section === 'personal' ? 'active' : ''} type="button" aria-pressed={section === 'personal'} onClick={() => setSection('personal')}><UserRound size={19} /> Dados pessoais</button>
            <button className={section === 'security' ? 'active' : ''} type="button" aria-pressed={section === 'security'} onClick={() => setSection('security')}><ShieldCheck size={19} /> Segurança</button>
          </nav>
        </aside>

        <div className="profile-content">
          {section === 'personal' ? (
            <form className="profile-card" onSubmit={handleProfileSubmit} noValidate>
              <div className="profile-card-header"><div><h2>Dados pessoais</h2><p>Informação usada na identificação e no acesso ao sistema.</p></div></div>
              <div className="profile-form-body form-grid two-columns">
                <label className="form-field"><RequiredLabel>Nome completo</RequiredLabel><div className="profile-input-shell"><UserRound size={18} /><input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} autoComplete="name" placeholder="Nome completo" /></div></label>
                <label className="form-field"><span>Email profissional</span><div className="profile-input-shell"><Mail size={18} /><input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} autoComplete="email" placeholder="nome@exemplo.org" /></div></label>
                <label className="form-field"><span>Telefone</span><div className="profile-input-shell"><Phone size={18} /><input value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} autoComplete="tel" inputMode="tel" placeholder="84 000 0000" /></div></label>
                <label className="form-field profile-readonly-field"><span>Código de acesso</span><div className="profile-input-shell"><AtSign size={18} /><input value={user.access_code || ''} readOnly aria-readonly="true" /></div><small>Este código não pode ser alterado.</small></label>
              </div>
              <div className="profile-card-footer"><p>O perfil de acesso só pode ser alterado por um administrador.</p><button className="primary-action-button" type="submit" disabled={isSavingProfile}><Save size={18} />{isSavingProfile ? 'A guardar…' : 'Guardar alterações'}</button></div>
            </form>
          ) : (
            <form className="profile-card" onSubmit={handlePasswordSubmit} noValidate>
              <div className="profile-card-header"><div><h2>Segurança da conta</h2><p>Escolha uma palavra-passe forte que não utilize noutros serviços.</p></div></div>
              <div className="profile-form-body form-grid two-columns">
                <PasswordField label="Palavra-passe actual" name="current_password" autoComplete="current-password" />
                <PasswordField label="Nova palavra-passe" name="password" autoComplete="new-password" />
                <PasswordField label="Confirmar palavra-passe" name="password_confirmation" autoComplete="new-password" />
              </div>
              <div className="profile-security-tip"><ShieldCheck size={20} /><p><strong>Proteja a sua conta.</strong> Use pelo menos 8 caracteres e evite nomes ou datas fáceis de adivinhar.</p></div>
              <div className="profile-card-footer"><p>A alteração não modifica o seu código de acesso.</p><button className="primary-action-button" type="submit" disabled={isSavingPassword}><Save size={18} />{isSavingPassword ? 'A guardar…' : 'Guardar palavra-passe'}</button></div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
