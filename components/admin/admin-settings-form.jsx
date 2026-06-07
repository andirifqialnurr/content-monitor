"use client";

import { CreditCard, KeyRound, Save, ShieldCheck, Upload } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/react";

const paymentProviders = [
  { value: "MIDTRANS", label: "Midtrans" },
  { value: "XENDIT", label: "Xendit" },
];

const paymentModes = [
  { value: "DISABLED", label: "Disabled" },
  { value: "SANDBOX", label: "Sandbox" },
  { value: "PRODUCTION", label: "Production" },
];

export function AdminSettingsForm({ settings, environment }) {
  const [form, setForm] = useState(() => ({
    ...settings,
    allowedMimeTypesText: settings.allowedMimeTypes.join("\n"),
  }));
  const [saved, setSaved] = useState(false);
  const mutation = trpc.admin.updatePlatformSettings.useMutation({
    onSuccess: (updatedSettings) => {
      setSaved(true);
      setForm({
        ...updatedSettings,
        allowedMimeTypesText: updatedSettings.allowedMimeTypes.join("\n"),
      });
    },
  });

  function updateField(name, value) {
    setSaved(false);
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSaved(false);
    mutation.mutate({
      paymentProvider: form.paymentProvider,
      paymentMode: form.paymentMode,
      platformFeePercent: Number(form.platformFeePercent),
      maxUploadMb: Number(form.maxUploadMb),
      allowedMimeTypes: parseMimeTypes(form.allowedMimeTypesText),
      publicCheckoutEnabled: form.publicCheckoutEnabled,
      learnerAccessEnabled: form.learnerAccessEnabled,
      analyticsTrackingEnabled: form.analyticsTrackingEnabled,
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="size-5" />
              Payment Connection
            </CardTitle>
            <CardDescription>Provider dan mode checkout global platform.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Provider">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.paymentProvider}
                onChange={(event) => updateField("paymentProvider", event.target.value)}
              >
                {paymentProviders.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mode">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.paymentMode}
                onChange={(event) => updateField("paymentMode", event.target.value)}
              >
                {paymentModes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Platform fee (%)">
              <Input
                min="0"
                max="100"
                type="number"
                value={form.platformFeePercent}
                onChange={(event) => updateField("platformFeePercent", event.target.value)}
              />
            </Field>
            <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">Midtrans server key</span>
                <Badge variant={environment.midtransServerKeyConfigured ? "secondary" : "outline"}>
                  {environment.midtransServerKeyConfigured ? "Configured" : "Missing"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">NEXTAUTH_URL</span>
                <Badge variant={environment.nextAuthUrlConfigured ? "secondary" : "outline"}>
                  {environment.nextAuthUrlConfigured ? "Configured" : "Fallback localhost"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-5" />
              Feature Flags
            </CardTitle>
            <CardDescription>Kontrol operasional untuk flow publik dan learner.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <CheckboxRow
              id="publicCheckoutEnabled"
              title="Public checkout"
              description="CTA beli dapat memulai checkout."
              checked={form.publicCheckoutEnabled}
              onCheckedChange={(checked) => updateField("publicCheckoutEnabled", checked)}
            />
            <CheckboxRow
              id="learnerAccessEnabled"
              title="Learner access"
              description="Area belajar tetap bisa dibuka user."
              checked={form.learnerAccessEnabled}
              onCheckedChange={(checked) => updateField("learnerAccessEnabled", checked)}
            />
            <CheckboxRow
              id="analyticsTrackingEnabled"
              title="Analytics tracking"
              description="Event publik dan checkout dicatat."
              checked={form.analyticsTrackingEnabled}
              onCheckedChange={(checked) => updateField("analyticsTrackingEnabled", checked)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="size-5" />
            Upload Policy
          </CardTitle>
          <CardDescription>Batas file digital yang boleh dipakai modul produk dan course.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <Field label="Max upload (MB)">
            <Input
              min="1"
              max="2048"
              type="number"
              value={form.maxUploadMb}
              onChange={(event) => updateField("maxUploadMb", event.target.value)}
            />
          </Field>
          <Field label="Allowed MIME types">
            <textarea
              className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.allowedMimeTypesText}
              onChange={(event) => updateField("allowedMimeTypesText", event.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <KeyRound className="size-4" />
          <span>Secret gateway tetap dibaca dari environment server.</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {mutation.error && <p className="text-sm text-destructive">{mutation.error.message}</p>}
          {saved && <p className="text-sm text-muted-foreground">Settings tersimpan.</p>}
          <Button type="submit" disabled={mutation.isPending}>
            <Save className="size-4" />
            {mutation.isPending ? "Menyimpan..." : "Simpan settings"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function CheckboxRow({ id, title, description, checked, onCheckedChange }) {
  return (
    <div className="flex gap-3 rounded-md border bg-background p-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
        className="mt-1"
      />
      <label htmlFor={id} className="grid gap-1 text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">{description}</span>
      </label>
    </div>
  );
}

function parseMimeTypes(value) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
