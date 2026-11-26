<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\TokenAuthController;
use App\Http\Controllers\Api\UserController;

// API Test
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'TFVC Grading System API is working!',
    ]);
});

// Public Authentication
Route::post('/login', [TokenAuthController::class, 'login'])
    ->name('api.login');

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {

    // Authenticated User
    Route::get('/user', function (Request $request) {
        $user = $request->user();

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is inactive.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    });

    // Authentication
    Route::post('/logout', [TokenAuthController::class, 'logout'])
        ->name('api.logout');

    // Change Password
    Route::patch('/change-password', [UserController::class, 'changePassword']);

    // Protected System and School Modules
    Route::middleware('permission:auto')->group(function () {

        // Permission Maintenance
        Route::post(
            'permissions/sync',
            [PermissionController::class, 'sync']
        )->name('permissions.sync');

        Route::apiResource('permissions', PermissionController::class);

        // Role Maintenance
        Route::apiResource('roles', RoleController::class);

        Route::put(
            'roles/{role}/permissions',
            [RoleController::class, 'assignPermissions']
        );

        // User Management
        Route::apiResource('users', UserController::class);

        Route::patch(
            'users/{user}/reset-password',
            [UserController::class, 'resetPassword']
        );

        Route::put(
            'users/{user}/roles',
            [UserController::class, 'assignRoles']
        );

        Route::patch(
            'users/{user}/status',
            [UserController::class, 'updateStatus']
        );
    });
});
