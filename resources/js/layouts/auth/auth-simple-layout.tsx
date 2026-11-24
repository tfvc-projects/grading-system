
import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden p-4 sm:p-6">

            {/* Single Full-Screen Background */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('/images/tfvc.jpg')",
                }}
            />

            {/* White Overlay */}
            <div className="fixed inset-0 z-0 bg-white/55" />

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/60 bg-white/95 p-6 shadow-2xl sm:p-8">

                <div className="flex flex-col gap-8">

                    {/* Logo */}
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={route('home')}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="flex h-12 w-12 items-center justify-center">
                              <AppLogoIcon className="h-20 w-20 object-contain" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        {/* Title */}
                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-semibold">
                                {title}
                            </h1>

                            <p className="text-muted-foreground text-sm">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    {children}

                </div>
            </div>
        </div>
    );
}
