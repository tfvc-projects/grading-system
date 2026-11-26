<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;

class CreateSuperAdmin extends Command
{
    protected $signature = 'app:create-super-admin';

    protected $description = 'Create the initial Super Admin account';

    public function handle(): int
    {
        if (User::whereHas('roles', function ($query) {
            $query->where('name', 'super_admin');
        })->exists()) {
            $this->error('A Super Admin account already exists.');

            return self::FAILURE;
        }

        $role = Role::updateOrCreate(
            ['name' => 'super_admin'],
            [
                'description' => 'Full system access',
                'is_active' => true,
            ]
        );

        $name = $this->ask('Enter Super Admin name');
        $email = $this->ask('Enter Super Admin email');
        $password = $this->secret('Enter Super Admin password');

        if (!$name || !$email || !$password) {
            $this->error('All fields are required.');

            return self::FAILURE;
        }

        if (User::where('email', $email)->exists()) {
            $this->error('This email is already registered.');

            return self::FAILURE;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);

        $user->roles()->attach($role->id);

        $this->info('Super Admin account created successfully!');

        return self::SUCCESS;
    }
}
