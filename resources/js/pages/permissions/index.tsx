import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import type { AxiosError } from 'axios';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Permission Maintenance',
        href: '/permissions',
    },
];

type Permission = {
    id: number;
    name: string;
    slug: string;
    module: string;
    description: string | null;
    is_active: boolean;
};

type SyncResult = {
    total: number;
    created: number;
    existing: number;
};

export default function PermissionMaintenance() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedModule, setSelectedModule] = useState('all');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

    const fetchPermissions = async () => {
        try {
            setLoading(true);

            const response = await api.get('/permissions');

            setPermissions(response.data.data);
        } catch (error) {
            console.error(error);
            setErrorMessage('Unable to load permissions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const modules = [...new Set(permissions.map((permission) => permission.module))];

    const filteredPermissions = permissions.filter((permission) => {
        const matchesSearch =
            permission.name.toLowerCase().includes(search.toLowerCase()) || permission.slug.toLowerCase().includes(search.toLowerCase());

        const matchesModule = selectedModule === 'all' || permission.module === selectedModule;

        return matchesSearch && matchesModule;
    });

    const handleSync = async () => {
        try {
            setSyncing(true);
            setErrorMessage('');
            setSuccessMessage('');
            setSyncResult(null);

            const response = await api.post('/permissions/sync');

            setSyncResult(response.data.data);
            setSuccessMessage(response.data.message);

            await fetchPermissions();
        } catch (error) {
            const axiosError = error as AxiosError<{
                message?: string;
            }>;

            setErrorMessage(axiosError.response?.data?.message ?? 'Unable to synchronize permissions.');
        } finally {
            setSyncing(false);
        }
    };

    const handleDeactivate = async (permission: Permission) => {
        if (!window.confirm(`Deactivate "${permission.name}"?`)) {
            return;
        }

        try {
            setErrorMessage('');
            setSuccessMessage('');

            await api.put(`/permissions/${permission.id}`, {
                name: permission.name,
                slug: permission.slug,
                module: permission.module,
                description: permission.description,
                is_active: false,
            });

            setSuccessMessage('Permission deactivated successfully.');

            await fetchPermissions();
        } catch (error) {
            console.error(error);
            setErrorMessage('Unable to deactivate permission.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permission Maintenance" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Permission Maintenance</h1>

                        <p className="text-muted-foreground mt-1 text-sm">Automatically discover permissions from API controllers.</p>
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                    >
                        {syncing ? 'Synchronizing...' : 'Sync Controllers'}
                    </button>
                </div>

                {successMessage && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{successMessage}</div>}

                {syncResult && (
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border p-4">
                            <p className="text-muted-foreground text-sm">Total Discovered</p>
                            <p className="text-2xl font-bold">{syncResult.total}</p>
                        </div>

                        <div className="rounded-lg border p-4">
                            <p className="text-muted-foreground text-sm">Newly Created</p>
                            <p className="text-2xl font-bold text-green-600">{syncResult.created}</p>
                        </div>

                        <div className="rounded-lg border p-4">
                            <p className="text-muted-foreground text-sm">Already Existing</p>
                            <p className="text-2xl font-bold">{syncResult.existing}</p>
                        </div>
                    </div>
                )}

                {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

                <div className="flex flex-wrap gap-3">
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search permissions..."
                        className="w-full rounded-lg border px-3 py-2 sm:w-72"
                    />

                    <select
                        value={selectedModule}
                        onChange={(event) => setSelectedModule(event.target.value)}
                        className="rounded-lg border px-3 py-2"
                    >
                        <option value="all">All Modules</option>

                        {modules.map((module) => (
                            <option key={module} value={module}>
                                {module}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-4">Permission</th>
                                <th className="p-4">Slug</th>
                                <th className="p-4">Module</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">
                                        Loading permissions...
                                    </td>
                                </tr>
                            ) : filteredPermissions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-muted-foreground p-8 text-center">
                                        No permissions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredPermissions.map((permission) => (
                                    <tr key={permission.id} className="border-t">
                                        <td className="p-4">
                                            <div className="font-medium">{permission.name}</div>
                                            <div className="text-muted-foreground text-xs">{permission.description}</div>
                                        </td>

                                        <td className="p-4">{permission.slug}</td>

                                        <td className="p-4">{permission.module}</td>

                                        <td className="p-4">
                                            <span className={permission.is_active ? 'text-green-600' : 'text-red-600'}>
                                                {permission.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>

                                        <td className="p-4 text-right">
                                            {permission.is_active && (
                                                <button onClick={() => handleDeactivate(permission)} className="text-red-600">
                                                    Deactivate
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
