<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    public function handle(
        Request $request,
        Closure $next,
        string $permission = 'auto'
    ): Response {
        $user = $request->user();

        // Block inactive users
        if ($user && !$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is inactive.',
            ], 403);
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Super Admin automatically has full access.
        if ($user->hasPermission('*')) {
            return $next($request);
        }

        // Explicit permission or automatic discovery.
        $permissionSlug = $permission === 'auto'
            ? $this->resolvePermission($request)
            : $permission;

        if (!$permissionSlug || !$user->hasPermission($permissionSlug)) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to perform this action.',
                ], 403);
            }

            abort(403, 'You do not have permission to access this page.');
        }

        return $next($request);
    }

    private function resolvePermission(Request $request): ?string
    {
        $route = $request->route();

        if (!$route) {
            return null;
        }

        $actionMap = [
            'index' => 'view',
            'show' => 'view',
            'store' => 'create',
            'update' => 'update',
            'destroy' => 'delete',

            'sync' => 'sync',
            'assignPermissions' => 'assign-permissions',
            'assignRoles' => 'assign-roles',
            'updateStatus' => 'update-status',
        ];

        $controllerAction = $route->getActionMethod();

        // Controller action mapping
        if (isset($actionMap[$controllerAction])) {
            $action = $actionMap[$controllerAction];
        } else {
            // HTTP method fallback
            $action = match ($request->method()) {
                'GET', 'HEAD' => 'view',
                'POST' => 'create',
                'PUT', 'PATCH' => 'update',
                'DELETE' => 'delete',
                default => null,
            };
        }

        if (!$action) {
            return null;
        }

        // Get resource from the first URI segment
        $uri = $route->uri();

        // Remove the API prefix when present.
        if (Str::startsWith($uri, 'api/')) {
            $uri = substr($uri, 4);
        }

        $segments = explode('/', $uri);
        $resource = $segments[0] ?? null;

        if (!$resource || str_contains($resource, '{')) {
            return null;
        }

        return Str::kebab($resource) . '.' . $action;
    }
}
