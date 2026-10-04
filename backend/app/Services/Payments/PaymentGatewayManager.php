<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use App\Services\Payments\Drivers\AsiaHawalaDriver;
use App\Services\Payments\Drivers\SimulatorDriver;
use App\Services\Payments\Drivers\ZainCashDriver;
use Illuminate\Support\Manager;

class PaymentGatewayManager extends Manager
{
    /**
     * Get the default payment driver name.
     */
    public function getDefaultDriver(): string
    {
        if (app()->environment('testing') || config('payments.simulator_enabled', false)) {
            return config('payments.default', 'simulator');
        }

        return config('payments.default', 'zaincash');
    }

    /**
     * Create the deterministic local simulator driver instance.
     */
    public function createSimulatorDriver(): PaymentGatewayInterface
    {
        return $this->container->make(SimulatorDriver::class);
    }

    /**
     * Create the ZainCash driver instance.
     */
    public function createZaincashDriver(): PaymentGatewayInterface
    {
        return $this->container->make(ZainCashDriver::class);
    }

    /**
     * Create the AsiaHawala driver instance.
     */
    public function createAsiahawalaDriver(): PaymentGatewayInterface
    {
        return $this->container->make(AsiaHawalaDriver::class);
    }
}
