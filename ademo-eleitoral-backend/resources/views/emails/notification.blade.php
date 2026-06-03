@extends('emails.layout')

@section('title', $title)
@section('preheader', $messageText)

@section('content')
  <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Olá, {{ $name }}</p>

  {{-- <p style="margin:0 0 8px;color:#b91c1c;font-size:13px;font-weight:700;text-transform:uppercase;">
    {{ $type }}
  </p> --}}

  <h2 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#111827;">{{ $title }}</h2>

  <p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#263244;">{{ $messageText }}</p>

  <p style="margin:0 0 24px;">
    <a href="{{ $actionUrl }}" style="display:inline-block;background:#b91c1c;color:#ffffff;text-decoration:none;border-radius:6px;padding:12px 18px;font-weight:700;">
      Abrir plataforma
    </a>
  </p>

  <p style="margin:0;color:#607086;font-size:13px;line-height:1.6;">
    Se o botão não abrir, copie este endereço no navegador:<br>
    <span style="word-break:break-all;">{{ $actionUrl }}</span>
  </p>
@endsection
