<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'ADMIN';
    case DELEGATION_ADMIN = 'DELEGATION_ADMIN';
    case COMMISSION = 'COMMISSION';
    case COMISSAO = 'COMISSAO';
    case FISCAL = 'FISCAL';
    case VOTER = 'VOTER';
    case ELEITOR = 'ELEITOR';
}
