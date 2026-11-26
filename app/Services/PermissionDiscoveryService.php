<?php

namespace App\Services;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class PermissionDiscoveryService
{

    public function discover(): array
    {
        $permissions = [];

        $actionMap = [
            'index' => 'view',
            'show' => 'view',
            'store' => 'create',
            'update' => 'update',
            'destroy' => 'delete',

            // Custom controller actions
            'sync' => 'sync',
            'assignPermissions' => 'assign-permissions',
            'assignRoles' => 'assign-roles',
            'updateStatus' => 'update-status',
        ];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();

            if (!Str::startsWith($uri, 'api/')) {
                continue;
            }

            $action = $route->getActionName();

            if (!str_contains($action, '@')) {
                continue;
            }

            [$controller, $method] = explode('@', $action);

            if (!str_contains($controller, '\\Http\\Controllers\\Api\\')) {
                continue;
            }

            if (!isset($actionMap[$method])) {
                continue;
            }

            // Get the resource name from the API URL.
            $segments = explode('/', substr($uri, 4));
            $resource = $segments[0] ?? null;

            if (!$resource || str_contains($resource, '{')) {
                continue;
            }

            $resource = Str::kebab($resource);
            $actionName = $actionMap[$method];

            // Example: users.view, students.create
            $slug = "{$resource}.{$actionName}";

            $moduleName = Str::headline(
                Str::singular(str_replace('-', ' ', $resource))
            );

            $permissions[$slug] = [
                'name' => Str::headline($actionName) . ' ' . $moduleName,
                'slug' => $slug,
                'module' => $moduleName . ' Management',
                'description' => "Allows users to {$actionName} {$moduleName} records.",
                'is_active' => true,
            ];
        }

        return array_values($permissions);
    }

    public function sync(): array
    {
        $discovered = $this->discover();

        return DB::transaction(function () use ($discovered) {
            $created = 0;
            $existing = 0;

            foreach ($discovered as $permissionData) {
                $permission = Permission::firstOrCreate(
                    ['slug' => $permissionData['slug']],
                    $permissionData
                );

                if ($permission->wasRecentlyCreated) {
                    $created++;
                } else {
                    $existing++;
                }
            }

            return [
                'total' => count($discovered),
                'created' => $created,
                'existing' => $existing,
            ];
        });
    }
}
