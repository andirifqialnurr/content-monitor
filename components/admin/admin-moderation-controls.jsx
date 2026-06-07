"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/react";

const userStatusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const productModerationOptions = [
  { value: "APPROVED", label: "Approved" },
  { value: "REVIEW_REQUIRED", label: "Review" },
  { value: "DISABLED", label: "Disabled" },
];

export function UserStatusControl({ userId, status }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const mutation = trpc.admin.updateUserStatus.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <StatusControl
      label="User status"
      value={value}
      options={userStatusOptions}
      disabled={mutation.isPending}
      error={mutation.error?.message}
      onChange={setValue}
      onSave={() => mutation.mutate({ id: userId, status: value })}
    />
  );
}

export function ProductModerationControl({ productId, moderationStatus }) {
  const router = useRouter();
  const [value, setValue] = useState(moderationStatus);
  const mutation = trpc.admin.updateProductModeration.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <StatusControl
      label="Moderation"
      value={value}
      options={productModerationOptions}
      disabled={mutation.isPending}
      error={mutation.error?.message}
      onChange={setValue}
      onSave={() => mutation.mutate({ id: productId, moderationStatus: value })}
    />
  );
}

function StatusControl({ label, value, options, disabled, error, onChange, onSave }) {
  return (
    <div className="grid gap-2 rounded-md border bg-background p-2">
      <label className="grid gap-1 text-xs text-muted-foreground">
        <span>{label}</span>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <Button type="button" size="sm" variant="outline" onClick={onSave} disabled={disabled}>
        {disabled ? "Menyimpan..." : "Simpan"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
