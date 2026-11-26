import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 sm:p-6 lg:justify-end lg:px-20">
            {/* Existing School Background */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('/images/tfvc.jpg')",
                }}
            />

            {/* No Background Overlay */}
            <div className="fixed inset-0 z-0 bg-transparent" />

            {/* Login Card - Right Side */}
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/80 bg-white/95 p-7 shadow-2xl backdrop-blur-md sm:p-9">
                <div className="flex flex-col gap-8">
                    {/* Logo */}
                    <div className="flex flex-col items-center gap-4">
                        <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                            <div className="flex h-16 w-16 items-center justify-center">
                                <AppLogoIcon className="h-16 w-16 object-contain" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        {/* Title */}
                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>

                            <p className="text-sm text-slate-500">{description}</p>
                        </div>
                    </div>

                    {/* Login Form */}
                    {children}

                    {/* Footer */}
                    <div className="border-t border-slate-100 pt-4 text-center">
                        <p className="text-xs text-slate-400">The Fisher Valley College, Inc.</p>
                        <p className="mt-1 text-xs text-slate-400">Grading Management System</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
