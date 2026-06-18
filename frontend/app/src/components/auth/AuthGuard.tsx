"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Alert } from "antd";
import { getMe } from "../../api/apiCalls";
import { getAccessToken, removeAccessToken } from "../../utils/authStorage";
import Loading from "../utils/Loading";

type AuthGuardProps = {
  children: React.ReactNode;
};

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState<"checking" | "authenticated" | "error">(
    "checking",
  );

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();

      if (!token) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        await getMe();
        setStatus("authenticated");
      } catch {
        removeAccessToken();
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (status === "checking") {
    return <Loading />;
  }

  if (status === "error") {
    return <Alert type="error" message="Authentication check failed" showIcon />;
  }

  return <>{children}</>;
};

export default AuthGuard;