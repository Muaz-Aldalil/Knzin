<?php

namespace Tests\Feature;

use App\Exceptions\ImmutableLedgerException;
use App\Models\AffiliateLedgerEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AffiliateLedgerImmutabilityTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected AffiliateLedgerEntry $entry;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->entry = AffiliateLedgerEntry::create([
            'user_id' => $this->user->id,
            'entry_type' => 'sales_commission',
            'amount_cents' => 250,
            'currency' => 'USD',
            'status' => 'pending',
            'matures_at' => now()->addHours(24),
            'idempotency_key' => 'comm_immutable_001',
        ]);
    }

    public function test_cannot_delete_ledger_entry(): void
    {
        $this->expectException(ImmutableLedgerException::class);
        $this->expectExceptionMessage('Affiliate ledger is strictly append-only. Cannot delete entry ID');

        $this->entry->delete();
    }

    public function test_cannot_modify_amount_cents(): void
    {
        $this->expectException(ImmutableLedgerException::class);
        $this->expectExceptionMessage('Affiliate ledger financial figures are immutable. Cannot modify amount_cents');

        $this->entry->amount_cents = 500;
        $this->entry->save();
    }

    public function test_cannot_modify_currency(): void
    {
        $this->expectException(ImmutableLedgerException::class);
        $this->expectExceptionMessage('Affiliate ledger financial figures are immutable. Cannot modify amount_cents, currency, or idempotency_key');

        $this->entry->currency = 'EUR';
        $this->entry->save();
    }

    public function test_cannot_modify_idempotency_key(): void
    {
        $this->expectException(ImmutableLedgerException::class);
        $this->expectExceptionMessage('Affiliate ledger financial figures are immutable. Cannot modify amount_cents, currency, or idempotency_key');

        $this->entry->idempotency_key = 'forged_key';
        $this->entry->save();
    }

    public function test_lifecycle_status_and_maturation_can_transition(): void
    {
        // Status transition from pending to available is allowed
        $this->entry->status = 'available';
        $this->entry->save();

        $this->assertEquals('available', $this->entry->fresh()->status);
        $this->assertEquals(250, $this->entry->fresh()->amount_cents);
    }

    public function test_reversal_debit_compensating_entry_preserves_history(): void
    {
        // Compensating entry is appended instead of mutating original
        $reversal = AffiliateLedgerEntry::create([
            'user_id' => $this->user->id,
            'entry_type' => 'reversal_debit',
            'amount_cents' => -250,
            'currency' => 'USD',
            'status' => 'cleared',
            'matures_at' => null,
            'idempotency_key' => 'rev_immutable_001',
        ]);

        $this->assertEquals(-250, $reversal->amount_cents);
        $this->assertEquals('reversal_debit', $reversal->entry_type);

        // Original entry remains untouched
        $original = $this->entry->fresh();
        $this->assertEquals(250, $original->amount_cents);
        $this->assertEquals('sales_commission', $original->entry_type);
        $this->assertEquals(2, AffiliateLedgerEntry::where('user_id', $this->user->id)->count());
    }

    public function test_reversal_credit_compensating_entry_preserves_history(): void
    {
        $payoutDebit = AffiliateLedgerEntry::create([
            'user_id' => $this->user->id,
            'entry_type' => 'payout_debit',
            'amount_cents' => -5000,
            'currency' => 'USD',
            'status' => 'available',
            'matures_at' => null,
            'idempotency_key' => 'payout_deb_001',
        ]);

        $compensatingCredit = AffiliateLedgerEntry::create([
            'user_id' => $this->user->id,
            'entry_type' => 'reversal_credit',
            'amount_cents' => 5000,
            'currency' => 'USD',
            'status' => 'available',
            'matures_at' => null,
            'idempotency_key' => 'payout_rev_001',
        ]);

        $this->assertEquals(5000, $compensatingCredit->amount_cents);
        $this->assertEquals(-5000, $payoutDebit->fresh()->amount_cents);
    }
}
