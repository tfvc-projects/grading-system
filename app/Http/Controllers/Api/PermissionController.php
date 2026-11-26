<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Services\PermissionDiscoveryService;

class PermissionController extends Controller
{
    // GET: List all permissions
    public function index()
    {
        $permissions = Permission::orderBy('module')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $permissions,
        ]);
    }

    // POST: Create permission
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name'],
            'slug' => ['required', 'string', 'max:255', 'unique:permissions,slug'],
            'module' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $permission = Permission::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Permission created successfully.',
            'data' => $permission,
        ], 201);
    }

    // GET: Show one permission
    public function show(Permission $permission)
    {
        return response()->json([
            'success' => true,
            'data' => $permission,
        ]);
    }

    // PUT/PATCH: Update permission
    public function update(Request $request, Permission $permission)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('permissions', 'name')->ignore($permission->id),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $permission->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Permission updated successfully.',
            'data' => $permission,
        ]);
    }

    // DELETE: Deactivate permission
    public function destroy(Permission $permission)
    {
        if (!$permission->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Permission is already inactive.',
            ], 422);
        }

        $permission->update([
            'is_active' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permission deactivated successfully.',
            'data' => $permission,
        ]);
    }

    // POST: Synchronize permissions from API controllers
    public function sync(PermissionDiscoveryService $discovery)
    {
        $result = $discovery->sync();

        return response()->json([
            'success' => true,
            'message' => 'Permissions synchronized successfully.',
            'data' => $result,
        ]);
    }
}
