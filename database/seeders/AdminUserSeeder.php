<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $name = env('CLASSSHARE_ADMIN_NAME');
        $email = env('CLASSSHARE_ADMIN_EMAIL');
        $password = env('CLASSSHARE_ADMIN_PASSWORD');

        if (!$name || !$email || !$password) {
            throw new RuntimeException(
                'Please configure CLASSSHARE_ADMIN_NAME, CLASSSHARE_ADMIN_EMAIL, and CLASSSHARE_ADMIN_PASSWORD in .env.'
            );
        }

        if (strlen($password) < 8) {
            throw new RuntimeException('Admin password must be at least 8 characters.');
        }

        User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password,
                'role' => 'admin',
            ]
        );
    }
}