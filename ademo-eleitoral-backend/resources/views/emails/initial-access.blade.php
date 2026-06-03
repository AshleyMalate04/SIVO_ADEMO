@extends('emails.layout')

@section('title', 'Dados de acesso à plataforma ADEMO Eleitoral')
@section('preheader', 'A sua conta foi criada na plataforma ADEMO Eleitoral.')

@section('content')
  <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Olá, {{ $name }}</p>

  <p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:#263244;">
    A sua conta foi criada na plataforma ADEMO Eleitoral. Utilize os dados abaixo para aceder ao sistema.
  </p>

  <div style="margin:0 0 22px;background:#f8fafc;border:1px solid #dde3ec;border-radius:8px;padding:16px 18px;">
    <p style="margin:0 0 8px;"><strong>Código de acesso:</strong> {{ $accessCode }}</p>
    <p style="margin:0;"><strong>Palavra-passe inicial:</strong> {{ $initialPassword }}</p>
  </div>

  {{-- <p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:#263244;">
    Após entrar, aceda às configurações para alterar a sua palavra-passe.
  </p> --}}

  <p style="margin:0 0 24px;">
    <a href="{{ $loginUrl }}" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;border-radius:6px;padding:12px 18px;font-weight:700;">
      Aceder à plataforma
    </a>
  </p>

  <p style="margin:0;color:#607086;font-size:13px;line-height:1.6;">
    Se o botão não abrir, copie este endereço no navegador:<br>
    <span style="word-break:break-all;">{{ $loginUrl }}</span>
  </p>
@endsection
