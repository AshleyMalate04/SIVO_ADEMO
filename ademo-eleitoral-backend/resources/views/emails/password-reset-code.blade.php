@extends('emails.layout')

@section('title', 'Código de verificação para redefinir palavra-passe')
@section('preheader', 'Use este código para confirmar a redefinição da sua palavra-passe.')

@section('content')
  <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Olá, {{ $name }}</p>

  <p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:#263244;">
    Recebemos um pedido para redefinir a sua palavra-passe no sistema eleitoral ADEMO.
  </p>

  <p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:#263244;">Código de verificação:</p>
  <p style="margin:0 0 22px;background:#f8fafc;border:1px solid #dde3ec;border-radius:8px;padding:16px 18px;font-size:30px;letter-spacing:5px;font-weight:700;color:#111827;text-align:center;">
    {{ $code }}
  </p>

  <p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#263244;">
    Este código é válido por 15 minutos.
  </p>

  <p style="margin:0 0 24px;">
    <a href="{{ $resetUrl }}" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;border-radius:6px;padding:12px 18px;font-weight:700;">
      Redefinir palavra-passe
    </a>
  </p>

  <p style="margin:0;color:#607086;font-size:13px;line-height:1.6;">
    Caso não tenha solicitado esta alteração, ignore este e-mail.
  </p>
@endsection
