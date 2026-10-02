<?php

namespace App\Console\Commands;

use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliateProfile;
use App\Models\Order;
use App\Models\ReferralAttribution;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedAffiliateScenariosCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'knzin:seed-affiliates';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed canonical Feature 006 affiliate test actors and scenarios for deterministic local testing';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Seeding canonical Feature 006 affiliate scenarios...');

        DB::transaction(function () {
            // 1. Ensure learner_code 'LRN-AFFA01' is not held by another user
            $existingAffA = User::where('learner_code', 'LRN-AFFA01')->first();
            if ($existingAffA && $existingAffA->email !== 'affiliate_a@test.knzin.com') {
                $existingAffA->update(['learner_code' => 'LRN-OLD-' . substr(md5($existingAffA->id), 0, 6)]);
            }

            // Provision or update Affiliate A
            $affiliateA = User::firstOrNew(['email' => 'affiliate_a@test.knzin.com']);
            $affiliateA->display_name = 'المسوّق أ';
            $affiliateA->auth_provider = 'google';
            $affiliateA->provider_id = 'sub_google_affiliate_a';
            $affiliateA->learner_code = 'LRN-AFFA01';
            $affiliateA->status = 'active';
            $affiliateA->email_verified_at = now();
            $affiliateA->save();

            // Provision Affiliate Profile for Affiliate A
            AffiliateProfile::updateOrCreate(
                ['user_id' => $affiliateA->id],
                [
                    'custom_slug' => 'affiliate-a',
                    'default_payout_method' => 'zain_cash',
                    'payout_details' => ['phone' => '07801234567'],
                    'status' => 'active',
                ]
            );

            // 2. Ensure learner_code 'LRN-CUST02' is not held by another user
            $existingCustB = User::where('learner_code', 'LRN-CUST02')->first();
            if ($existingCustB && $existingCustB->email !== 'customer_b@test.knzin.com') {
                $existingCustB->update(['learner_code' => 'LRN-OLD-' . substr(md5($existingCustB->id), 0, 6)]);
            }

            // Provision or update Customer B
            $customerB = User::firstOrNew(['email' => 'customer_b@test.knzin.com']);
            $customerB->display_name = 'العميل ب';
            $customerB->auth_provider = 'google';
            $customerB->provider_id = 'sub_google_customer_b';
            $customerB->learner_code = 'LRN-CUST02';
            $customerB->status = 'active';
            $customerB->email_verified_at = now();
            $customerB->save();

            // 3. Completed Order 1 ($10.00 bundle)
            $order1 = Order::updateOrCreate(
                ['order_number' => 'KNZ-ORD-2026-J1UHKR'],
                [
                    'user_id' => $customerB->id,
                    'total_amount_cents' => 1000,
                    'currency' => 'USD',
                    'exchange_rate' => 1300,
                    'paid_amount_gateway' => 13000,
                    'display_price_label' => '$10.00',
                    'promotional_tickets_granted' => 15,
                    'status' => 'completed',
                    'idempotency_key' => 'idem_canonical_seed_ord_b1',
                    'legal_terms_agreed' => true,
                    'terms_agreed_ip' => '127.0.0.1',
                    'terms_agreed_at' => now()->subHours(25),
                    'created_at' => now()->subHours(25),
                ]
            );

            // Referral Attribution for Order 1
            ReferralAttribution::updateOrCreate(
                ['order_id' => $order1->id],
                [
                    'buyer_user_id' => $customerB->id,
                    'referrer_user_id' => $affiliateA->id,
                    'referral_code' => 'LRN-AFFA01',
                    'attributed_at' => now()->subHours(25),
                ]
            );

            // Mature Ledger Entry ($2.50 available)
            $maturedEntry = AffiliateLedgerEntry::where('idempotency_key', 'idem_comm_canonical_matured_1')->first();
            if ($maturedEntry) {
                DB::table('affiliate_ledger_entries')
                    ->where('id', $maturedEntry->id)
                    ->update([
                        'user_id' => $affiliateA->id,
                        'order_id' => $order1->id,
                        'amount_cents' => 250,
                        'status' => 'available',
                        'matures_at' => now()->subHour(),
                    ]);
            } else {
                AffiliateLedgerEntry::create([
                    'user_id' => $affiliateA->id,
                    'order_id' => $order1->id,
                    'entry_type' => 'sales_commission',
                    'amount_cents' => 250,
                    'currency' => 'USD',
                    'status' => 'available',
                    'funding_source' => 'platform_marketing',
                    'idempotency_key' => 'idem_comm_canonical_matured_1',
                    'matures_at' => now()->subHour(),
                    'created_at' => now()->subHours(25),
                    'metadata' => ['note' => 'Canonical mature commission for Order 1'],
                ]);
            }

            // 4. Completed Order 2 ($2.00 part)
            $order2 = Order::updateOrCreate(
                ['order_number' => 'KNZ-ORD-2026-PEND02'],
                [
                    'user_id' => $customerB->id,
                    'total_amount_cents' => 200,
                    'currency' => 'USD',
                    'exchange_rate' => 1300,
                    'paid_amount_gateway' => 2600,
                    'display_price_label' => '$2.00',
                    'promotional_tickets_granted' => 1,
                    'status' => 'completed',
                    'idempotency_key' => 'idem_canonical_seed_ord_b2',
                    'legal_terms_agreed' => true,
                    'terms_agreed_ip' => '127.0.0.1',
                    'terms_agreed_at' => now()->subHour(),
                    'created_at' => now()->subHour(),
                ]
            );

            // Referral Attribution for Order 2
            ReferralAttribution::updateOrCreate(
                ['order_id' => $order2->id],
                [
                    'buyer_user_id' => $customerB->id,
                    'referrer_user_id' => $affiliateA->id,
                    'referral_code' => 'LRN-AFFA01',
                    'attributed_at' => now()->subHour(),
                ]
            );

            // Pending Ledger Entry ($0.50 pending hold)
            $pendingEntry = AffiliateLedgerEntry::where('idempotency_key', 'idem_comm_canonical_pending_2')->first();
            if ($pendingEntry) {
                DB::table('affiliate_ledger_entries')
                    ->where('id', $pendingEntry->id)
                    ->update([
                        'user_id' => $affiliateA->id,
                        'order_id' => $order2->id,
                        'amount_cents' => 50,
                        'status' => 'pending',
                        'matures_at' => now()->addHours(23),
                    ]);
            } else {
                AffiliateLedgerEntry::create([
                    'user_id' => $affiliateA->id,
                    'order_id' => $order2->id,
                    'entry_type' => 'sales_commission',
                    'amount_cents' => 50,
                    'currency' => 'USD',
                    'status' => 'pending',
                    'funding_source' => 'platform_marketing',
                    'idempotency_key' => 'idem_comm_canonical_pending_2',
                    'matures_at' => now()->addHours(23),
                    'created_at' => now()->subHour(),
                    'metadata' => ['note' => 'Canonical pending commission for Order 2'],
                ]);
            }
        });

        $this->info('Canonical affiliate scenarios seeded successfully.');
        $this->table(
            ['Actor', 'Email', 'Learner Code', 'Available ($)', 'Pending ($)'],
            [
                ['Affiliate A', 'affiliate_a@test.knzin.com', 'LRN-AFFA01', '$2.50', '$0.50'],
                ['Customer B', 'customer_b@test.knzin.com', 'LRN-CUST02', '-', '-'],
            ]
        );

        return self::SUCCESS;
    }
}
