import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import FeedbackCard from "../../components/common/FeedbackCard";
import FormError from "../../components/common/FormError";
import { notify } from "../../utils/notify";
import { login } from "../../services/authService";
import { saveAuthData } from "../../lib/storage";

const initialValues = {
  access_code: "",
  password: "",
  remember: false,
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accessibility] = useState(
    () => localStorage.getItem("ademo-accessibility") === "true",
  );

  useEffect(() => {
    localStorage.setItem("ademo-accessibility", String(accessibility));
    document.documentElement.dataset.accessibility = accessibility
      ? "true"
      : "false";
  }, [accessibility]);

  function updateField(event) {
    const { checked, name, type, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: "", form: "" }));
  }

  function validate() {
    const nextErrors = {};

    if (!values.access_code.trim()) {
      nextErrors.access_code = "Informe o código de acesso.";
    }

    if (!values.password.trim()) {
      nextErrors.password = "Informe a palavra-passe.";
    } else if (values.password.length < 6) {
      nextErrors.password = "A palavra-passe deve ter pelo menos 6 caracteres.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setSuccess(false);
      notify.error("Não foi possível iniciar sessão.", "Verifique os campos assinalados.");
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const result = await login({
        access_code: values.access_code,
        password: values.password,
      });

      saveAuthData({
        token: result.data.token,
        user: result.data.user,
        menu: result.data.menu,
      });

      setSuccess(true);
      if (result.data.user?.must_change_password) {
        notify.success("Primeiro acesso.", "Defina uma palavra-passe para concluir a configuração da conta.");
        navigate("/nova-senha?primeiro_acesso=1", { replace: true });
        return;
      }

      notify.success("Acesso validado.", "A redireccionar para a área inicial.");
      navigate(result.data.redirect_to || "/dashboard", { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Não foi possível autenticar. Tente novamente.";

      setErrors((current) => ({ ...current, form: message }));
      notify.error("Falha na autenticação.", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-copy">
        <h2>Bem-vindo de volta</h2>
        <p>Insira as suas credenciais para aceder ao sistema ADEMO.</p>
      </div>

      {success ? (
        <FeedbackCard
          title="Acesso validado"
          message="A redireccionar para a área inicial."
        />
      ) : null}

      <FormError message={errors.form} />

      <label className="form-field">
        <span>CÓDIGO</span>
        <input
          aria-invalid={Boolean(errors.access_code)}
          autoComplete="username"
          name="access_code"
          onChange={updateField}
          placeholder="ADM-0001"
          value={values.access_code}
        />
        <FormError message={errors.access_code} />
      </label>

      <label className="form-field">
        <span>PALAVRA-PASSE</span>
        <div className="password-field">
          <input
            aria-invalid={Boolean(errors.password)}
            autoComplete="current-password"
            name="password"
            onChange={updateField}
            placeholder="........"
            type={showPassword ? "text" : "password"}
            value={values.password}
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <FormError message={errors.password} />
      </label>

      <div className="auth-row">
        <label className="check-field">
          <input
            checked={values.remember}
            name="remember"
            onChange={updateField}
            type="checkbox"
          />
          <span>Manter sessão iniciada</span>
        </label>
        <Link to="/recuperar-acesso">Esqueci a senha</Link>
      </div>

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "A entrar..." : "Entrar"}
      </button>
    </form>
  );
}
