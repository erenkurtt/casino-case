"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Form, Input } from "antd";
import Navigation from "../components/navigation/Navigation";
import { registerUser } from "../api/apiCalls";
import { saveAccessToken } from "../utils/authStorage";
import styles from "../styles/auth/auth.module.scss";
import { emitAuthChanged } from "../utils/appEvents";

type RegisterFormValues = {
  email: string;
  username: string;
  password: string;
};

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: RegisterFormValues) => {
    try {
      setError("");
      setLoading(true);

      const response = await registerUser(values);

      saveAccessToken(response.accessToken);
      emitAuthChanged();

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navigation />

      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <h1>Register</h1>
          <p>Create an account to start with 20 coins.</p>

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
              label="Username"
              name="username"
              rules={[
                { required: true, message: "Username is required" },
                { min: 3, message: "Username must be at least 3 characters" },
              ]}
            >
              <Input placeholder="eren" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Password is required" },
                { min: 8, message: "Password must be at least 8 characters" },
              ]}
            >
              <Input.Password placeholder="Password123" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block loading={loading}>
              Register
            </Button>
          </Form>

          <div className={styles.authLink}>
            Already have an account? <Link href="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;