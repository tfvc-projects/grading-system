<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    // GET: List all users
    public function index()
    {
        $users = User::with('roles')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    // POST: Create user with default password
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $validated['password'] = 'Tfvc@2026';
        $validated['must_change_password'] = true;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully. Default password: Tfvc@2026',
            'data' => $user->load('roles'),
        ], 201);
    }

    // GET: View one user
    public function show(User $user)
    {
        return response()->json([
            'success' => true,
            'data' => $user->load('roles'),
        ]);
    }

    // PUT/PATCH: Update user
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => ['nullable', 'string', 'min:8'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        if (
            isset($validated['is_active']) &&
            $validated['is_active'] === false &&
            $user->roles()->where('name', 'super_admin')->exists()
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Super Admin accounts cannot be deactivated.',
            ], 403);
        }

        if (
            isset($validated['is_active']) &&
            $validated['is_active'] === false &&
            (int) $user->getKey() === (int) Auth::id()
        ) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot deactivate your own account.',
            ], 403);
        }

        $user->update($validated);

        // Revoke all API tokens when the account is deactivated
        if (
            array_key_exists('is_active', $validated) &&
            !$validated['is_active']
        ) {
            $user->tokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully.',
            'data' => $user->load('roles'),
        ]);
    }


    // DELETE: Delete user

    public function destroy(User $user)
    {
        $currentUser = Auth::user();

        // Make sure the authenticated user is an instance of User
        if (!($currentUser instanceof User)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Check Delete User permission
        if (!$currentUser->hasPermission('users.delete')) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete users.',
            ], 403);
        }

        // Prevent deleting own account
        if ((int) $user->getAttribute('id') === (int) $currentUser->getAttribute('id')) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.',
            ], 403);
        }

        // Protect Super Admin accounts
        if ($user->roles()->where('name', 'super_admin')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Super Admin accounts cannot be deleted.',
            ], 403);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully.',
        ]);
    }

    // PUT: Assign roles to user
    public function assignRoles(Request $request, User $user)
    {
        $validated = $request->validate([
            'role_ids' => ['present', 'array'],
            'role_ids.*' => ['required', 'integer', 'distinct', 'exists:roles,id'],
        ]);

        $user->roles()->sync($validated['role_ids']);

        return response()->json([
            'success' => true,
            'message' => 'User roles updated successfully.',
            'data' => $user->load('roles'),
        ]);
    }

    // PATCH: Activate or deactivate user
    public function updateStatus(Request $request, User $user)
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $currentUser = Auth::user();

        if (!$currentUser instanceof User) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (
            !$validated['is_active'] &&
            $user->roles()->where('name', 'super_admin')->exists()
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Super Admin accounts cannot be deactivated.',
            ], 403);
        }

        if (
            !$validated['is_active'] &&
            (int) $user->getKey() === (int) $currentUser->getKey()
        ) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot deactivate your own account.',
            ], 403);
        }

        $user->update([
            'is_active' => $validated['is_active'],
        ]);

        // Revoke all existing API tokens when deactivated
        if (!$validated['is_active']) {
            $user->tokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'User status updated successfully.',
            'data' => $user->load('roles'),
        ]);
    }

    // PATCH: Reset user password to default
    public function resetPassword(User $user)
    {
        $user->update([
            'password' => 'Tfvc@2026',
            'must_change_password' => true,
        ]);

        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'User password has been reset successfully.',
        ]);
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'new_password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'not_in:Tfvc@2026',
            ],
        ]);

        $user = $request->user();

        $user->update([
            'password' => $validated['new_password'],
            'must_change_password' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }
}
