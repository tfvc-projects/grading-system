<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    // GET: List all roles
    public function index()
    {
        $roles = Role::with('permissions')
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $roles,
        ]);
    }

    // POST: Create role
    public function store(Request $request)
    {
        if (strtolower(trim($request->name ?? '')) === 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'The Super Admin role is reserved and cannot be created.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:roles,name',
                Rule::notIn(['super_admin']),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $role = Role::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Role created successfully.',
            'data' => $role,
        ], 201);
    }

    // GET: View one role
    public function show(Role $role)
    {
        $role->load('permissions');

        return response()->json([
            'success' => true,
            'data' => $role,
        ]);
    }

    // PUT/PATCH: Update role
    public function update(Request $request, Role $role)
    {
        if ($role->name === 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'The Super Admin role is protected.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'name')->ignore($role->id),
                Rule::notIn(['super_admin']),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $role->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully.',
            'data' => $role,
        ]);
    }

    // DELETE: Deactivate role
    public function destroy(Role $role)
    {
        if ($role->name === 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'The Super Admin role is protected.',
            ], 403);
        }

        $role->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Role deactivated successfully.',
        ]);
    }

    // PUT: Assign permissions
    public function assignPermissions(Request $request, Role $role)
    {
        if ($role->name === 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Permissions cannot be modified for Super Admin.',
            ], 403);
        }

        $validated = $request->validate([
            'permission_ids' => ['present', 'array'],
            'permission_ids.*' => [
                'required',
                'integer',
                'distinct',
                'exists:permissions,id',
            ],
        ]);

        $role->permissions()->sync($validated['permission_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Permissions assigned successfully.',
            'data' => $role->load('permissions'),
        ]);
    }
}
