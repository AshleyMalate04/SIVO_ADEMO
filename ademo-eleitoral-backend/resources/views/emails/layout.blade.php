<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>@yield('title', 'ADEMO Eleitoral')</title>
</head>
<body style="margin:0;background:#f4f6f8;color:#172033;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    @yield('preheader', 'Notificação do Sistema de Votação Eleitoral ADEMO')
  </div>

  <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
    <div style="background:#b91c1c;color:#ffffff;border-radius:8px 8px 0 0;padding:22px 26px;">
      <p style="margin:0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;">Sistema de Votação Eleitoral</p>
      <h1 style="margin:6px 0 0;font-size:24px;line-height:1.25;">ADEMO</h1>
    </div>

    <div style="background:#ffffff;border:1px solid #dde3ec;border-top:0;border-radius:0 0 8px 8px;padding:28px 26px;">
      @yield('content')
    </div>

    <p style="margin:18px 0 0;color:#607086;font-size:12px;line-height:1.5;text-align:center;">
      Esta mensagem foi enviada automaticamente. Por favor, não responda a este e-mail.
    </p>
  </div>
</body>
</html>
