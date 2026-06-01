<?php

namespace App\Enums;

enum CandidateStatus: string
{
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';
    case SUSPENDED = 'SUSPENDED';
}
