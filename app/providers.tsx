"use client";

import { Amplify } from "aws-amplify";
import { cognitoConfig } from "@/lib/cognito-config";

Amplify.configure(cognitoConfig);

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}