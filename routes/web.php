<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Login Page
Route::get('/', [AuthenticatedSessionController::class, 'create'])
    ->middleware('guest')
    ->name('home');

// Authenticated Pages
Route::middleware(['auth', 'password.changed'])->group(function () {

    Route::get('/change-password', function () {
        return Inertia::render('auth/change-password');
    })->name('password.change');

    Route::get('/dashboard', function (Request $request) {
        return Inertia::render('dashboard', [
            'mustChangePassword' => (bool) $request->user()->must_change_password,
        ]);
    })->name('dashboard');

    Route::get('/api-test', function () {
        return Inertia::render('api-test');
    })->name('api-test');

    // Automatic Permission Checking
    Route::middleware('permission:auto')->group(function () {

        Route::get('/permissions', function () {
            return Inertia::render('permissions/index');
        })->name('permissions.index');

        Route::get('/roles', function () {
            return Inertia::render('roles/index');
        })->name('roles.index');

        Route::get('/users', function () {
            return Inertia::render('users/index');
        })->name('users.index');
    });
});

// Additional Routes
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
