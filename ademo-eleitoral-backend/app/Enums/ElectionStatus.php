<?php

namespace App\Enums;

enum ElectionStatus: string
{
    case PROGRAMADA = 'PROGRAMADA';
    case EM_VOTACAO = 'EM_VOTACAO';
    case CONCLUIDA = 'CONCLUIDA';
    case RESULTADOS_PUBLICADOS = 'RESULTADOS_PUBLICADOS';
}
