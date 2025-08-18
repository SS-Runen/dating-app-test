"use client";

import { useRouter } from "next/navigation";
import { useAppContext } from "../context/useAppContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAppContext();
    const router = useRouter();

    if (loading) {
        return (
            <div className="auth-guard">
                <h1>
                    <i className="la la-circle-notch spin la-2x text-primary"></i>
                </h1>
            </div>
        );
    }

    if (!user) {
        router.push("/");
        return null; // Render nothing while redirecting
    }

    return <>{children}</>;
}