<?php

namespace App\Support;

use App\Models\User;

class AdminCapabilities
{
    public const MANAGE_ADMIN_CAPABILITIES = 'manage_admin_capabilities';
    public const MANAGE_PLATFORM_SETTINGS = 'manage_platform_settings';
    public const ADJUDICATE_AFFILIATE_COPRIZE = 'adjudicate_affiliate_coprize';
    public const ISSUE_KYC_APPROVAL = 'issue_kyc_approval';
    public const ISSUE_DRAW_AUDIT_APPROVAL = 'issue_draw_audit_approval';
    public const SETTLE_AFFILIATE_PAYOUT = 'settle_affiliate_payout';

    public const ALL = [
        self::MANAGE_ADMIN_CAPABILITIES,
        self::MANAGE_PLATFORM_SETTINGS,
        self::ADJUDICATE_AFFILIATE_COPRIZE,
        self::ISSUE_KYC_APPROVAL,
        self::ISSUE_DRAW_AUDIT_APPROVAL,
        self::SETTLE_AFFILIATE_PAYOUT,
    ];

    /**
     * Determines whether the given administrator is authorized to view full recipient financial details.
     * Only holders of settle_affiliate_payout are entitled to see unmasked recipient details.
     */
    public static function canViewRecipientDetails(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        return $user->hasCapability(self::SETTLE_AFFILIATE_PAYOUT);
    }
}
