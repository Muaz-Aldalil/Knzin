---
name: laravel-mastery
description: >-
  Enterprise architectural engineering skill for modern Laravel 11+ and PHP 8.3/8.4 applications.
  Enforces strict types, Form Request boundaries, Eloquent query optimization (preventing N+1),
  pessimistic locking, idempotent queues/jobs, and Pest 3 architectural security testing.
compatibility: Laravel 10+, 11+, 12+, PHP 8.2, 8.3, 8.4.
---

# Laravel 11+ Enterprise Engineering & Architecture (SKILL.md)

## 1. Status & Purpose
This skill establishes enterprise engineering standards for modern Laravel 11+ applications. It ensures all backend services, controllers, models, and background jobs are built for high concurrency, strict type safety, zero database deadlocks, and maximum testability.

---

## 2. Core Architectural Invariants

### 2.1 Type Safety & Header Hygiene
- Every PHP file MUST begin with:
  ```php
  <?php

  declare(strict_types=1);
  ```
- All method parameters, return types, and class properties MUST have explicit type declarations.
- Return DTOs or `JsonResponse` / `JsonResource` objects rather than un-typed associative arrays.

### 2.2 Boundary Validation (Form Requests)
- NEVER validate request payloads inside controller action methods (`$request->validate(...)` is prohibited in production controllers).
- ALWAYS extract validation into dedicated `FormRequest` classes:
  ```php
  namespace App\Http\Requests\Api;

  use Illuminate\Foundation\Http\FormRequest;

  final class StoreOrderRequest extends FormRequest
  {
      public function authorize(): bool
      {
          return $this->user() !== null;
      }

      public function rules(): array
      {
          return [
              'items' => ['required', 'array', 'min:1'],
              'items.*.product_id' => ['required', 'uuid', 'exists:products,id'],
              'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
          ];
      }
  }
  ```

### 2.3 Eloquent Query Discipline & Anti-N+1 Protection
- NEVER access relationships inside loops or serialized resources without eager loading:
  ```php
  // PROHIBITED: Triggers N+1 query storm
  $orders = Order::all();
  foreach ($orders as $order) {
      echo $order->customer->name;
  }

  // REQUIRED: Eager load relationships
  $orders = Order::query()
      ->with(['customer', 'items.product'])
      ->where('tenant_id', $tenantId)
      ->latest()
      ->paginate(20);
  ```
- Use `loadMissing()` for conditional relationship loading.
- Enable Eloquent strict mode in local/testing environments:
  ```php
  Model::shouldBeStrict(! app()->isProduction());
  ```

### 2.4 Transactional Integrity & Pessimistic Locking (Danger Zone)
- Any operation modifying inventory, wallet balances, checkout carts, or order status MUST execute within a database transaction with pessimistic row locking (`lockForUpdate()`):
  ```php
  DB::transaction(function () use ($productId, $quantity, $userId) {
      $product = Product::query()
          ->where('id', $productId)
          ->lockForUpdate()
          ->firstOrFail();

      if ($product->stock < $quantity) {
          throw new InsufficientStockException("Item is out of stock.");
      }

      $product->decrement('stock', $quantity);

      return Order::create([
          'user_id' => $userId,
          'product_id' => $productId,
          'quantity' => $quantity,
          'status' => OrderStatus::PENDING,
      ]);
  }, attempts: 3);
  ```

### 2.5 Background Jobs & Queue Idempotency
- All queue workers must be strictly idempotent:
  - Check if the side-effect (e.g. email sent, webhook dispatched, payment captured) has already occurred before executing.
  - Implement `ShouldQueue` with appropriate retry limits and backoff:
  ```php
  final class ProcessPaymentJob implements ShouldQueue
  {
      use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

      public int $tries = 3;
      public int $backoff = [5, 30, 120];

      public function handle(PaymentGatewayInterface $gateway): void
      {
          $order = Order::findOrFail($this->orderId);
          if ($order->isPaid()) {
              return; // Already processed - idempotent exit
          }
          // Process charge...
      }
  }
  ```

---

## 3. Pest 3 Testing Standard
- Architectural testing is mandatory for every Laravel repository:
  ```php
  test('backend architecture enforces strict types and security', function () {
      arch()->preset()->php();
      arch()->preset()->security();
      
      arch('controllers remain thin')
          ->expect('App\Http\Controllers')
          ->not->toUse('DB');

      arch('models enforce HasUuids or HasUlids')
          ->expect('App\Models')
          ->toExtend('Illuminate\Database\Eloquent\Model');
  });
  ```
