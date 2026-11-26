import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
// import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface LoginForm {
    [key: string]: string | boolean;
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    // canResetPassword: boolean;
}

export default function Login({ status, }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="relative isolate min-h-screen w-full">
            <Head title="Log in" />

            <AuthLayout title="Welcome Back" description="Login to your TFVC Grading System account">
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <div className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                                Email Address
                            </Label>

                            <div className="relative">
                                <Mail className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-400" />

                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    autoFocus
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Enter your email address"
                                    className="h-12 rounded-xl border-slate-200 bg-white/80 pl-11 text-sm shadow-sm transition focus-visible:border-blue-700 focus-visible:ring-blue-700"
                                />
                            </div>

                            <InputError message={errors.email} />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                                    Password
                                </Label>

                                {/* {canResetPassword && (
                                    <TextLink href={route('password.request')} className="text-xs font-semibold text-blue-800 hover:text-blue-600">
                                        Forgot password?
                                    </TextLink>
                                )} */}
                            </div>

                            <div className="relative">
                                <LockKeyhole className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-400" />

                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Enter your password"
                                    className="h-12 rounded-xl border-slate-200 bg-white/80 pl-11 text-sm shadow-sm transition focus-visible:border-blue-700 focus-visible:ring-blue-700"
                                />
                            </div>

                            <InputError message={errors.password} />
                        </div>

                        {/* Login Button */}
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-12 w-full rounded-xl bg-blue-950 text-sm font-semibold text-white shadow-md transition hover:bg-blue-900 disabled:opacity-60"
                        >
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Login
                        </Button>
                    </div>

                    {/* Status */}
                    {status && <div className="rounded-lg bg-blue-50 p-3 text-center text-sm font-medium text-blue-800">{status}</div>}
                </form>
            </AuthLayout>
        </div>
    );
}
