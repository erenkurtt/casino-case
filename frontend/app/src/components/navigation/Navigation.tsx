"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "../../styles/navigation/navigation.module.scss";
import { getAccessToken, removeAccessToken } from "../../utils/authStorage";
import { getMe } from "../../api/apiCalls";
import type { User } from "../../types/api";
import {
    AUTH_CHANGED_EVENT,
    BALANCE_UPDATED_EVENT,
} from "../../utils/appEvents";
import { emitAuthChanged } from "../../utils/appEvents";

const Navigation: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            const token = getAccessToken();

            if (!token) {
                setUser(null);
                return;
            }

            try {
                const me = await getMe();
                setUser(me);
            } catch {
                removeAccessToken();
                setUser(null);
            }
        };

        const handleBalanceUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ balance: number }>;

            setUser((prev) =>
                prev
                    ? {
                        ...prev,
                        balance: customEvent.detail.balance,
                    }
                    : prev,
            );
        };

        loadUser();

        window.addEventListener(AUTH_CHANGED_EVENT, loadUser);
        window.addEventListener(BALANCE_UPDATED_EVENT, handleBalanceUpdated);

        return () => {
            window.removeEventListener(AUTH_CHANGED_EVENT, loadUser);
            window.removeEventListener(BALANCE_UPDATED_EVENT, handleBalanceUpdated);
        };
    }, [pathname]);

    const logout = () => {
        removeAccessToken();
        emitAuthChanged();
        setUser(null);
        router.push("/login");
        router.refresh();
    };

    const isActive = (href: string) => pathname === href;

    return (
        <header className={styles.header}>
            <div className={styles.navbar}>
                <Link href="/" className={styles.brand}>
                    Casino Royale
                </Link>

                <nav className={styles.navLinks}>
                    <Link
                        href="/"
                        className={`${styles.navItem} ${isActive("/") ? styles.active : ""}`}
                    >
                        Games
                    </Link>

                    <Link
                        href="/spin"
                        className={`${styles.navItem} ${isActive("/spin") ? styles.active : ""
                            }`}
                    >
                        Spin
                    </Link>

                    {user && (
                        <Link
                            href="/favorites"
                            className={`${styles.navItem} ${isActive("/favorites") ? styles.active : ""
                                }`}
                        >
                            Favorites
                        </Link>
                    )}
                </nav>

                <div className={styles.authArea}>
                    {user ? (
                        <>
                            <div className={styles.userBadge}>
                                <span className={styles.username}>{user.username}</span>
                                <span className={styles.balance}>{user.balance} coins</span>
                            </div>

                            <button type="button" className={styles.logoutButton} onClick={logout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className={`${styles.authButton} ${isActive("/login") ? styles.activeAuth : ""
                                    }`}
                            >
                                Login
                            </Link>

                            <Link
                                href="/register"
                                className={`${styles.authButton} ${styles.primaryButton} ${isActive("/register") ? styles.activeAuth : ""
                                    }`}
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navigation;