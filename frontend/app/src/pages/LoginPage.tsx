"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Form, Input } from "antd";
import Navigation from "../components/navigation/Navigation";
import { loginUser } from "../api/apiCalls";
import { saveAccessToken } from "../utils/authStorage";
import styles from "../styles/auth/auth.module.scss";
import { emitAuthChanged } from "../utils/appEvents";

type LoginFormValues = {
    email: string;
    password: string;
};

const LoginPage: React.FC = () => {
    const router = useRouter();
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: LoginFormValues) => {
        try {
            setError("");
            setLoading(true);

            const response = await loginUser(values);

            saveAccessToken(response.accessToken);
            emitAuthChanged();

            const params = new URLSearchParams(window.location.search);
            const redirectTo = params.get("redirect") || "/";

            router.push(redirectTo);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Navigation />

            <div className={styles.authPage}>
                <div className={styles.authCard}>
                    <h1>Login</h1>
                    <p>Login to spin, manage favorites and view your profile.</p>

                    {error && (
                        <Alert
                            type="error"
                            message={error}
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <Form layout="vertical" onFinish={onFinish}>
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: "Email is required" },
                                { type: "email", message: "Enter a valid email" },
                            ]}
                        >
                            <Input placeholder="eren@test.com" />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[{ required: true, message: "Password is required" }]}
                        >
                            <Input.Password placeholder="Password123" />
                        </Form.Item>

                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Login
                        </Button>
                    </Form>

                    <div className={styles.authLink}>
                        Don&apos;t have an account? <Link href="/register">Register</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;