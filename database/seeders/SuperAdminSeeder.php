<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $role = Role::firstOrCreate(
            ['name' => 'super_admin'],
            [
                'description' => 'Full system access',
                'is_active' => true,
            ]
        );

        $user = User::updateOrCreate(
            ['email' => 'superadmin@tfvc.local'],
            [
                'name' => 'TFVC Super Admin',
                'password' => 'Tfvc@2026',
                'is_active' => true,
                'must_change_password' => true,
            ]
        );

        $user->roles()->syncWithoutDetaching([$role->id]);
    }
}