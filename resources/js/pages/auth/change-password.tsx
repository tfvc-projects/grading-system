import api from '@/lib/api';
import { FormEvent, useState } from 'react';

interface ChangePasswordProps {
    onSuccess: () => void;
}

export default function ChangePassword({ onSuccess }: ChangePasswordProps) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword === 'Tfvc@2026') {
            setError('You cannot use the default password.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);

        try {
            await api.patch('/change-password', {
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
            });

            onSuccess();
        } catch (err: any) {
            const errors = err.response?.data?.errors;

            setError(errors?.new_password?.[0] || err.response?.data?.message || 'Failed to change password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 backdrop-blur-[1px]">
            <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Change Your Password</h1>

                <p className="mb-6 text-sm text-gray-600">You must change your default password before accessing the system.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-900">New Password</label>

                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full rounded-md border p-3"
                            minLength={8}
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-900">Confirm New Password</label>

                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full rounded-md border p-3"
                            minLength={8}
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? 'Changing Password...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
