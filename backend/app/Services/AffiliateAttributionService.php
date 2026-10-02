<?php

namespace App\Services;

use App\Models\AffiliateProfile;
use App\Models\Order;
use App\Models\ReferralAttribution;
use App\Models\User;

class AffiliateAttributionService
{
    /**
     * Resolve a referral code (learner_code or vanity slug) to an active referrer User and metadata.
     */
    public function resolveReferralCode(string $codeOrSlug): ?array
    {
        $normalized = trim($codeOrSlug);
        if (empty($normalized)) {
            return null;
        }

        // 1. Try finding by learner_code directly on users table
        $user = User::where('learner_code', $normalized)
            ->where('status', 'active')
            ->first();

        // 2. If not found, try finding via custom_slug on affiliate_profiles
        if ($user === null) {
            $profile = AffiliateProfile::where('custom_slug', $normalized)
                ->where('status', 'active')
                ->with('user')
                ->first();

            if ($profile !== null && $profile->user !== null && $profile->user->status === 'active') {
                $user = $profile->user;
            }
        }

        if ($user === null) {
            return null;
        }

        return [
            'valid' => true,
            'referrer_id' => $user->id,
            'referral_code' => $user->learner_code,
            'referrer' => [
                'display_name' => $user->display_name ?? 'KNZiN Member',
                'avatar_url' => $user->avatar_url,
                'is_verified_creator' => $user->isVerified(),
            ],
            'incentives' => [
                'buyer_promotional_tickets_part' => 1,
                'buyer_promotional_tickets_bundle' => 15,
                'buyer_surcharge' => false,
                'notice_ar' => 'ستحصل على جميع مميزات الدورة وتذاكر السحب الترويجي كاملة دون أي نقصان.',
            ],
        ];
    }

    /**
     * Check if the referral constitutes a self-referral exploit attempt.
     */
    public function isSelfReferral(User|string $referrer, ?string $buyerUserId, ?string $buyerEmail): bool
    {
        $referrerUser = is_string($referrer) ? User::find($referrer) : $referrer;
        if ($referrerUser === null) {
            return false;
        }

        // Check matching User IDs
        if (!empty($buyerUserId) && $referrerUser->id === $buyerUserId) {
            return true;
        }

        // Check matching normalized emails
        if (!empty($buyerEmail) && !empty($referrerUser->email)) {
            $normalizedReferrerEmail = strtolower(trim($referrerUser->email));
            $normalizedBuyerEmail = strtolower(trim($buyerEmail));
            if ($normalizedReferrerEmail === $normalizedBuyerEmail) {
                return true;
            }
        }

        return false;
    }

    /**
     * Record referral attribution server-side against an authoritative order.
     */
    public function recordAttribution(
        Order $order,
        string $codeOrSlug,
        ?string $campaignTag = null,
        ?string $ip = null,
        ?string $userAgent = null
    ): ?ReferralAttribution {
        $resolved = $this->resolveReferralCode($codeOrSlug);
        if ($resolved === null) {
            return null;
        }

        $referrer = User::find($resolved['referrer_id']);
        if ($referrer === null) {
            return null;
        }

        // Anti-self-referral check
        $buyerUser = $order->user ?? User::find($order->user_id);
        $buyerEmail = $buyerUser?->email;
        if ($this->isSelfReferral($referrer, $order->user_id, $buyerEmail)) {
            return null;
        }

        $salt = (string) config('app.key', 'knzin-affiliate-salt');
        $ipHash = $ip ? hash('sha256', $ip . $salt) : null;
        $uaHash = $userAgent ? hash('sha256', $userAgent . $salt) : null;

        return ReferralAttribution::create([
            'order_id' => $order->id,
            'referrer_user_id' => $referrer->id,
            'buyer_user_id' => $order->user_id,
            'referral_code' => $resolved['referral_code'],
            'campaign_tag' => $campaignTag,
            'commission_rate_bps' => config('knzin.affiliate.commission_rate_bps', 2500),
            'attribution_type' => 'cookie',
            'ip_hash' => $ipHash,
            'user_agent_hash' => $uaHash,
        ]);
    }
}
