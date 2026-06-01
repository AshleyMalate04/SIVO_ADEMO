<!doctype html>
<html lang="pt">
<body style="margin:0;background:#f5f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
    <div style="background:#ffffff;border:1px solid #e5e9f2;border-radius:8px;padding:28px;">
      <p style="margin:0 0 18px;">Olá, {{ $name }}</p>
      <p style="margin:0 0 18px;">A sua conta foi criada na plataforma ADEMO Eleitoral.</p>
      <p style="margin:0 0 10px;">Utilize os dados abaixo para aceder ao sistema:</p>
      <p style="margin:0 0 8px;"><strong>Código de acesso:</strong> {{ $accessCode }}</p>
      <p style="margin:0 0 18px;"><strong>Palavra-passe inicial:</strong> {{ $initialPassword }}</p>
      <p style="margin:0 0 18px;">Após entrar, aceda às configurações para alterar a sua palavra-passe.</p>
      <p style="margin:0 0 22px;">
        <a href="{{ $loginUrl }}" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;border-radius:6px;padding:12px 18px;font-weight:700;">Aceder à plataforma</a>
      </p>
      <p style="margin:0 0 18px;">Se o botão não abrir, copie este endereço no navegador:<br>{{ $loginUrl }}</p>
      <p style="margin:0;">Atenciosamente,<br>Equipa ADEMO Eleitoral</p>
    </div>
  </div>
</body>
</html>
