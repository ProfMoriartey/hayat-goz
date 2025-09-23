// src/components/auth/RoleGate.tsx
"use client";

import React from "react";

type Role = "ADMIN" | "DOCTOR" | "RECEPTION" | "PATIENT";

export default function RoleGate({
  allowed = ["ADMIN"],
  children,
}: {
  allowed?: Role[];
  children: React.ReactNode;
}) {
  // TODO: wire to your auth (e.g., next-auth/session)
  // For now, always allow. We'll lock this down later.
  return <>{children}</>;
}
