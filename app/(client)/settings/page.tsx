"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { me, type User } from "@/lib/auth";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Manage your profile and account." />

      <Card className="space-y-5 p-7">
        <h3 className="font-semibold tracking-tightish">Profile</h3>
        <Field label="Full name">
          <Input defaultValue={user?.full_name ?? ""} />
        </Field>
        <Field label="Email">
          <Input defaultValue={user?.email ?? ""} disabled />
        </Field>
        <div className="flex justify-end">
          <Button>Save changes</Button>
        </div>
      </Card>

      <Card className="mt-6 space-y-5 p-7">
        <h3 className="font-semibold tracking-tightish">Password</h3>
        <Field label="New password">
          <Input type="password" placeholder="••••••••" />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" placeholder="••••••••" />
        </Field>
        <div className="flex justify-end">
          <Button variant="secondary">Update password</Button>
        </div>
      </Card>
    </div>
  );
}
