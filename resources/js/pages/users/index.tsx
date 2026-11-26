import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useState, type FormEvent } from 'react';

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    roles: Role[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Management',
        href: '/users',
    },
];

export default function UsersIndex() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Create User Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [updating, setUpdating] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [assigningUser, setAssigningUser] = useState<User | null>(null);
    const [assigning, setAssigning] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.roles.some((role) => role.id.toString() === roleFilter);

        return matchesSearch && matchesRole;
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        let valueA = '';
        let valueB = '';

        if (sortBy === 'name') {
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
        } else if (sortBy === 'email') {
            valueA = a.email.toLowerCase();
            valueB = b.email.toLowerCase();
        } else if (sortBy === 'role') {
            valueA = a.roles
                .map((role) => role.name)
                .join(', ')
                .toLowerCase();
            valueB = b.roles
                .map((role) => role.name)
                .join(', ')
                .toLowerCase();
        }

        const result = valueA.localeCompare(valueB);

        return sortOrder === 'asc' ? result : -result;
    });

    const usersPerPage = 10;

    const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

    const startIndex = (currentPage - 1) * usersPerPage;

    const paginatedUsers = sortedUsers.slice(startIndex, startIndex + usersPerPage);

    // Fetch Users
    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data.data);
            setCurrentPage(1);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles');
            setAvailableRoles(response.data.data);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    };

    // Open Create Modal
    const openCreateModal = () => {
        setName('');
        setEmail('');
        setError('');
        setValidationErrors({});
        setShowCreateModal(true);
    };

    // Close Create Modal
    const closeCreateModal = () => {
        if (saving || updating) return;

        setShowCreateModal(false);
        setEditingUser(null);
        setName('');
        setEmail('');
        setError('');
        setValidationErrors({});
    };

    // Create User
    const handleCreateUser = async (e: FormEvent) => {
        e.preventDefault();

        setSaving(true);
        setError('');
        setValidationErrors({});

        try {
            await api.post('/users', {
                name,
                email,
            });

            setShowCreateModal(false);
            setName('');
            setEmail('');

            await fetchUsers();
        } catch (err: any) {
            if (err.response?.status === 422) {
                const errors = err.response.data.errors || {};
                const formattedErrors: Record<string, string> = {};

                Object.keys(errors).forEach((key) => {
                    formattedErrors[key] = errors[key][0];
                });

                setValidationErrors(formattedErrors);
            } else {
                setError(err.response?.data?.message || 'Failed to create user.');
            }
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setName(user.name);
        setEmail(user.email);
        setError('');
        setValidationErrors({});
        setShowCreateModal(false);
    };

    const handleUpdateUser = async (e: FormEvent) => {
        e.preventDefault();

        if (!editingUser) return;

        setUpdating(true);
        setError('');
        setValidationErrors({});

        try {
            await api.put(`/users/${editingUser.id}`, {
                name,
                email,
            });

            setEditingUser(null);
            setName('');
            setEmail('');

            await fetchUsers();
        } catch (err: any) {
            if (err.response?.status === 422) {
                const errors = err.response.data.errors || {};
                const formattedErrors: Record<string, string> = {};

                Object.keys(errors).forEach((key) => {
                    formattedErrors[key] = errors[key][0];
                });

                setValidationErrors(formattedErrors);
            } else {
                setError(err.response?.data?.message || 'Failed to update user.');
            }
        } finally {
            setUpdating(false);
        }
    };

    const openAssignRolesModal = (user: User) => {
        setAssigningUser(user);
        setSelectedRoleIds(user.roles.map((role) => role.id));
        setError('');
    };

    const closeAssignRolesModal = () => {
        if (assigning) return;

        setAssigningUser(null);
        setSelectedRoleIds([]);
        setError('');
    };

    const handleAssignRoles = async (e: FormEvent) => {
        e.preventDefault();

        if (!assigningUser) return;

        setAssigning(true);
        setError('');

        try {
            await api.put(`/users/${assigningUser.id}/roles`, {
                role_ids: selectedRoleIds,
            });

            setAssigningUser(null);
            setSelectedRoleIds([]);

            await fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to assign roles.');
        } finally {
            setAssigning(false);
        }
    };

    const handleDeleteUser = async (user: User) => {
        const confirmed = window.confirm(`Are you sure you want to delete ${user.name}?`);

        if (!confirmed) return;

        try {
            await api.delete(`/users/${user.id}`);
            await fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete user.');
        }
    };

    const handleUpdateStatus = async (user: User) => {
        const newStatus = !user.is_active;

        const confirmed = window.confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} ${user.name}?`);

        if (!confirmed) return;

        try {
            await api.patch(`/users/${user.id}/status`, {
                is_active: newStatus,
            });

            await fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update user status.');
        }
    };

    const handleRoleChange = (roleId: number, checked: boolean) => {
        setSelectedRoleIds((current) => (checked ? [...current, roleId] : current.filter((id) => id !== roleId)));
    };

    const handleResetPassword = async (user: User) => {
        if (!confirm(`Reset password for ${user.name}?`)) return;

        try {
            await api.patch(`/users/${user.id}/reset-password`);
            alert('Password reset successfully!\nDefault Password: Tfvc@2026');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reset password.');
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-semibold">User Management</h1>
                    <p className="text-muted-foreground text-sm">Manage system users and their assigned roles.</p>
                </div>

                {/* Users Table */}
                <div className="rounded-xl border">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                        <div>
                            <h2 className="font-semibold">Users List</h2>
                            <p className="text-muted-foreground text-sm">{filteredUsers.length} user(s) found</p>
                        </div>

                        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
                            <select
                                value={roleFilter}
                                onChange={(e) => {
                                    setRoleFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-background rounded-md border px-3 py-2 text-sm"
                            >
                                <option value="all">All Roles</option>
                                {availableRoles
                                    .filter((role) => role.name !== 'super_admin')
                                    .map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                            </select>

                            {/* Sort By */}
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-background rounded-md border px-3 py-2 text-sm"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="email">Sort by Email</option>
                                <option value="role">Sort by Role</option>
                            </select>

                            {/* Sort Order */}
                            <select
                                value={sortOrder}
                                onChange={(e) => {
                                    setSortOrder(e.target.value as 'asc' | 'desc');
                                    setCurrentPage(1);
                                }}
                                className="bg-background rounded-md border px-3 py-2 text-sm"
                            >
                                <option value="asc">Ascending (A–Z)</option>
                                <option value="desc">Descending (Z–A)</option>
                            </select>

                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search name or email..."
                                className="bg-background w-full max-w-xs rounded-md border px-3 py-2 text-sm"
                            />

                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
                            >
                                + Add User
                            </button>
                        </div>
                    </div>
                    {loading ? (
                        <p className="text-muted-foreground p-4 text-sm">Loading users...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-y">
                                    <tr>
                                        <th className="p-3 text-left">Name</th>
                                        <th className="p-3 text-left">Email</th>
                                        <th className="p-3 text-left">Roles</th>
                                        <th className="p-3 text-left">Status</th>
                                        <th className="p-3 text-left">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedUsers.map((user) => (
                                        <tr key={user.id} className="border-b">
                                            <td className="p-3">{user.name}</td>
                                            <td className="p-3">{user.email}</td>
                                            <td className="p-3">
                                                {user.roles.length > 0 ? user.roles.map((role) => role.name).join(', ') : 'No role assigned'}
                                            </td>
                                            <td className="p-3">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="w-1 p-3 whitespace-nowrap">
                                                <div className="flex w-max items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(user)}
                                                        className="hover:bg-muted rounded-md border px-3 py-1 text-sm"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => openAssignRolesModal(user)}
                                                        className="hover:bg-muted rounded-md border px-3 py-1 text-sm"
                                                    >
                                                        Assign Roles
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="border-destructive text-destructive hover:bg-destructive rounded-md border px-3 py-1 text-sm hover:text-white"
                                                    >
                                                        Delete
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleResetPassword(user)}
                                                        className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
                                                    >
                                                        Reset Password
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateStatus(user)}
                                                        className="hover:bg-muted rounded-md border px-3 py-1 text-sm"
                                                    >
                                                        {user.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-muted-foreground p-4 text-center">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {/* Pagination */}
                            <div className="flex items-center justify-between border-t p-4">
                                <p className="text-muted-foreground text-sm">
                                    Showing {filteredUsers.length === 0 ? 0 : startIndex + 1} to{' '}
                                    {Math.min(startIndex + usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((page) => page - 1)}
                                        disabled={currentPage === 1}
                                        className="hover:bg-muted rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Previous
                                    </button>

                                    <span className="px-3 py-1.5 text-sm">
                                        Page {currentPage} of {Math.max(totalPages, 1)}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((page) => page + 1)}
                                        disabled={currentPage >= totalPages}
                                        className="hover:bg-muted rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create User Modal */}
            {(showCreateModal || editingUser) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background w-full max-w-md rounded-xl p-6 shadow-lg">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-semibold">{editingUser ? 'Edit User' : 'Add New User'}</h2>

                            <button
                                type="button"
                                onClick={closeCreateModal}
                                disabled={saving}
                                className="text-muted-foreground hover:text-foreground text-xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                            {/* General Error */}
                            {error && <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>}

                            {/* Name */}
                            <div>
                                <label className="mb-1 block text-sm font-medium">Full Name</label>

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter full name"
                                    required
                                    className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
                                />

                                {validationErrors.name && <p className="text-destructive mt-1 text-xs">{validationErrors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-1 block text-sm font-medium">Email Address</label>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email address"
                                    required
                                    className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
                                />

                                {validationErrors.email && <p className="text-destructive mt-1 text-xs">{validationErrors.email}</p>}
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    disabled={saving || updating}
                                    className="hover:bg-muted rounded-md border px-4 py-2 text-sm"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving || updating}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm disabled:opacity-50"
                                >
                                    {saving || updating ? 'Saving...' : editingUser ? 'Update User' : 'Save User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Roles Modal */}
            {assigningUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background w-full max-w-md rounded-xl p-6 shadow-lg">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Assign Roles</h2>
                                <p className="text-muted-foreground text-sm">{assigningUser.name}</p>
                            </div>

                            <button
                                type="button"
                                onClick={closeAssignRolesModal}
                                disabled={assigning}
                                className="text-muted-foreground hover:text-foreground text-xl"
                            >
                                &times;
                            </button>
                        </div>

                        {error && <div className="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm">{error}</div>}

                        <form onSubmit={handleAssignRoles} className="space-y-4">
                            <div className="space-y-3">
                                {availableRoles.map((role) => (
                                    <label key={role.id} className="flex items-center gap-3 rounded-md border p-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedRoleIds.includes(role.id)}
                                            onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                                            disabled={role.name === 'super_admin'}
                                        />

                                        <span className="text-sm font-medium">{role.name}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={closeAssignRolesModal}
                                    disabled={assigning}
                                    className="hover:bg-muted rounded-md border px-4 py-2 text-sm"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={assigning}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm disabled:opacity-50"
                                >
                                    {assigning ? 'Saving...' : 'Save Roles'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
