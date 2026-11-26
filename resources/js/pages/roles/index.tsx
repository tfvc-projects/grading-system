import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import type { AxiosError } from 'axios';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Role Maintenance',
        href: '/roles',
    },
];

type Permission = {
    id: number;
    name: string;
    slug: string;
    module: string;
    is_active: boolean;
};

type Role = {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    permissions: Permission[];
};

type RoleForm = {
    name: string;
    description: string;
    is_active: boolean;
    permission_ids: number[];
};

const initialForm: RoleForm = {
    name: '',
    description: '',
    is_active: true,
    permission_ids: [],
};

export default function RoleMaintenance() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<RoleForm>(initialForm);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const editingRole = roles.find((role) => role.id === editingId);
    const isSuperAdmin = editingRole?.name === 'super_admin';

    const fetchData = async () => {
        try {
            setLoading(true);

            const [rolesResponse, permissionsResponse] = await Promise.all([api.get('/roles'), api.get('/permissions')]);

            setRoles(rolesResponse.data.data);
            setPermissions(permissionsResponse.data.data);
        } catch (error) {
            console.error(error);
            setErrorMessage('Unable to load roles and permissions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getModulePermissions = (module: string) => permissions.filter((permission) => permission.module === module && permission.is_active);

    const getViewPermission = (module: string) => getModulePermissions(module).find((permission) => permission.slug.endsWith('.view'));

    const normalizePermissions = (permissionIds: number[]) => {
        return permissionIds.filter((id) => {
            const permission = permissions.find((item) => item.id === id);

            if (!permission) return false;

            const viewPermission = getViewPermission(permission.module);

            return permission.slug.endsWith('.view') || (viewPermission && permissionIds.includes(viewPermission.id));
        });
    };

    const openCreateModal = () => {
        setEditingId(null);
        setForm(initialForm);
        setErrorMessage('');
        setShowModal(true);
    };

    const openEditModal = (role: Role) => {
        if (role.name === 'super_admin') {
            return;
        }

        setEditingId(role.id);

        setForm({
            name: role.name,
            description: role.description ?? '',
            is_active: role.is_active,
            permission_ids: normalizePermissions(role.permissions.map((permission) => permission.id)),
        });

        setErrorMessage('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (isSuperAdmin) return;

        try {
            setSaving(true);
            setErrorMessage('');

            const { permission_ids, ...roleData } = form;

            let roleId = editingId;

            if (editingId) {
                await api.put(`/roles/${editingId}`, roleData);
            } else {
                const response = await api.post('/roles', roleData);
                roleId = response.data.data.id;
            }

            await api.put(`/roles/${roleId}/permissions`, {
                permission_ids,
            });

            setShowModal(false);
            setForm(initialForm);
            setEditingId(null);

            await fetchData();
        } catch (error) {
            const axiosError = error as AxiosError<{
                message?: string;
                errors?: Record<string, string[]>;
            }>;

            setErrorMessage(
                Object.values(axiosError.response?.data?.errors ?? {}).flat()[0] ?? axiosError.response?.data?.message ?? 'Unable to save role.',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (role: Role) => {
        if (role.name === 'super_admin') return;

        if (!window.confirm(`Deactivate "${role.name}"?`)) return;

        try {
            await api.delete(`/roles/${role.id}`);
            await fetchData();
        } catch (error) {
            console.error(error);
            setErrorMessage('Unable to deactivate role.');
        }
    };

    const togglePermission = (permissionId: number) => {
        const selectedPermission = permissions.find((permission) => permission.id === permissionId);

        if (!selectedPermission) return;

        const modulePermissions = getModulePermissions(selectedPermission.module);
        const viewPermission = getViewPermission(selectedPermission.module);

        if (!viewPermission) return;

        setForm((current) => {
            const selected = current.permission_ids.includes(permissionId);

            // If View is unchecked, remove all permissions in this module.
            if (selectedPermission.id === viewPermission.id) {
                return {
                    ...current,
                    permission_ids: selected
                        ? current.permission_ids.filter((id) => !modulePermissions.some((permission) => permission.id === id))
                        : [...current.permission_ids, permissionId],
                };
            }

            // Other permissions require View.
            if (!current.permission_ids.includes(viewPermission.id)) {
                return current;
            }

            return {
                ...current,
                permission_ids: selected ? current.permission_ids.filter((id) => id !== permissionId) : [...current.permission_ids, permissionId],
            };
        });
    };

    const toggleModulePermissions = (module: string) => {
        const modulePermissions = getModulePermissions(module);
        const viewPermission = getViewPermission(module);

        if (!viewPermission) return;

        const moduleIds = modulePermissions.map((permission) => permission.id);

        const allSelected = moduleIds.every((id) => form.permission_ids.includes(id));

        setForm((current) => ({
            ...current,
            permission_ids: allSelected
                ? current.permission_ids.filter((id) => !moduleIds.includes(id))
                : [...new Set([...current.permission_ids, ...moduleIds])],
        }));
    };

    const groupedPermissions = permissions
        .filter((permission) => permission.is_active)
        .reduce<Record<string, Permission[]>>((groups, permission) => {
            groups[permission.module] ??= [];
            groups[permission.module].push(permission);
            return groups;
        }, {});

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role Maintenance" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Role Maintenance</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Manage system roles and their permissions.</p>
                    </div>

                    <button onClick={openCreateModal} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium">
                        + Add Role
                    </button>
                </div>

                {errorMessage && !showModal && <p className="text-sm text-red-600">{errorMessage}</p>}

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-4">Role</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Permissions</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">
                                        Loading roles...
                                    </td>
                                </tr>
                            ) : roles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">
                                        No roles found.
                                    </td>
                                </tr>
                            ) : (
                                roles.map((role) => (
                                    <tr key={role.id} className="border-t">
                                        <td className="p-4 font-medium">{role.name}</td>
                                        <td className="p-4">{role.description || '-'}</td>
                                        <td className="p-4">
                                            {role.name === 'super_admin'
                                                ? permissions.filter((permission) => permission.is_active).length
                                                : role.permissions.length}
                                        </td>
                                        <td className="p-4">
                                            <span className={role.is_active ? 'text-green-600' : 'text-red-600'}>
                                                {role.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {role.name !== 'super_admin' && (
                                                <>
                                                    <button onClick={() => openEditModal(role)} className="mr-3 text-blue-600">
                                                        Edit
                                                    </button>

                                                    {role.is_active && (
                                                        <button onClick={() => handleDeactivate(role)} className="text-red-600">
                                                            Deactivate
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {role.name === 'super_admin' && <span className="text-muted-foreground text-xs">Protected</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                        <div className="bg-background my-8 w-full max-w-2xl space-y-5 rounded-xl p-6 shadow-xl">
                            <h2 className="text-xl font-semibold">{editingId ? 'Edit Role' : 'Add Role'}</h2>

                            <div className="space-y-3">
                                <input
                                    value={form.name}
                                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                                    placeholder="Role Name (e.g. teacher)"
                                    className="w-full rounded-lg border px-3 py-2"
                                />

                                <textarea
                                    value={form.description}
                                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                                    placeholder="Role Description"
                                    className="w-full rounded-lg border px-3 py-2"
                                />

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                is_active: event.target.checked,
                                            })
                                        }
                                    />
                                    Active
                                </label>
                            </div>

                            <div>
                                <h3 className="mb-3 font-semibold">Assign Permissions</h3>

                                <div className="max-h-72 space-y-4 overflow-y-auto rounded-lg border p-4">
                                    {isSuperAdmin && (
                                        <p className="text-sm text-green-600">Super Admin has full system access. Permissions cannot be modified.</p>
                                    )}

                                    {Object.entries(groupedPermissions).length === 0 ? (
                                        <p className="text-muted-foreground text-sm">No active permissions available.</p>
                                    ) : (
                                        Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                                            <div key={module}>
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h4 className="font-medium">{module}</h4>

                                                    <label className="flex items-center gap-2 text-sm font-medium">
                                                        <input
                                                            type="checkbox"
                                                            checked={modulePermissions.every((permission) =>
                                                                form.permission_ids.includes(permission.id),
                                                            )}
                                                            disabled={isSuperAdmin || !getViewPermission(module)}
                                                            onChange={() => toggleModulePermissions(module)}
                                                        />
                                                        Check All
                                                    </label>
                                                </div>

                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    {modulePermissions.map((permission) => {
                                                        const viewPermission = getViewPermission(module);
                                                        const isView = permission.id === viewPermission?.id;
                                                        const hasView = viewPermission ? form.permission_ids.includes(viewPermission.id) : false;

                                                        return (
                                                            <label key={permission.id} className="flex items-center gap-2 text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSuperAdmin || form.permission_ids.includes(permission.id)}
                                                                    disabled={isSuperAdmin || (!isView && !hasView)}
                                                                    onChange={() => togglePermission(permission.id)}
                                                                />
                                                                {permission.name}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingId(null);
                                        setForm(initialForm);
                                    }}
                                    disabled={saving}
                                    className="rounded-lg border px-4 py-2"
                                >
                                    Cancel
                                </button>

                                {!isSuperAdmin && (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="bg-primary text-primary-foreground rounded-lg px-4 py-2"
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
