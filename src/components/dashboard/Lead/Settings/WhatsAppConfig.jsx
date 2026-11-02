"use client";

import React, { useEffect, useState } from "react";
import { xFetch } from "@/utility/xFetch";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Webhook,
} from "lucide-react";

const initialConfig = {
  provider: "META_CLOUD_API",
  businessAccountId: "",
  phoneNumberId: "",
  providerAccountId: "",
  apiKey: "",
  webhookUrl: "",
  active: false,
  configured: false,
  hasApiKey: false,
};

export default function WhatsappConfig() {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const isMeta = config.provider === "META_CLOUD_API";

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);

    try {
      const response = await xFetch({
        path: "/services/profile/getIncomingWhatsAppConfig",
        method: "GET",
      });

      if (!response?.status) {
        toast.error(
          response?.desc || "Unable to load WhatsApp configuration."
        );
        return;
      }

      setConfig({
        ...initialConfig,
        ...response.config,
        apiKey: "",
      });
    } catch (error) {
      console.error("Load WhatsApp configuration:", error);
      toast.error("Unable to load WhatsApp configuration.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    setConfig((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const copyToClipboard = async (value, label) => {
    if (!value) {
      toast.error(`${label} is not available.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch (error) {
      toast.error(`Unable to copy ${label.toLowerCase()}.`);
    }
  };

  const saveConfig = async (event) => {
    event.preventDefault();

    if (saving) return;

    if (isMeta) {
      if (
        !config.businessAccountId.trim() ||
        !config.phoneNumberId.trim()
      ) {
        toast.error(
          "Business Account ID and Phone Number ID are required."
        );
        return;
      }
    } else if (!config.providerAccountId.trim()) {
      toast.error("WATI account/channel identifier is required.");
      return;
    }

    if (!config.hasApiKey && !config.apiKey.trim()) {
      toast.error("Please enter your provider API token.");
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData();

      payload.append("provider", config.provider);
      payload.append(
        "businessAccountId",
        config.businessAccountId.trim()
      );
      payload.append("phoneNumberId", config.phoneNumberId.trim());
      payload.append(
        "providerAccountId",
        config.providerAccountId.trim()
      );
      payload.append("apiKey", config.apiKey.trim());
      payload.append("active", config.active ? "1" : "0");

      const response = await xFetch({
        path: "/services/profile/saveIncomingWhatsAppConfig",
        method: "POST",
        payload,
        isFormData: true,
      });

      if (!response?.status) {
        toast.error(
          response?.desc || "Unable to save WhatsApp connection."
        );
        return;
      }

      toast.success("WhatsApp connection saved successfully.");

      await loadConfig();
    } catch (error) {
      console.error("Save WhatsApp configuration:", error);
      toast.error("Unable to save WhatsApp connection.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span className="text-sm text-gray-600">
          Loading WhatsApp settings...
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Page Header */}
      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <MessageCircle className="h-7 w-7" />
            </div>

            <div>
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                WhatsApp Integration
              </span>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
                Connect WhatsApp to LeadStor
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Connect your WhatsApp Business account to receive incoming
                messages and process leads automatically in LeadStor.
              </p>
            </div>
          </div>

          <div className="min-w-44 rounded-xl border border-white bg-white/90 p-4 shadow-sm">
            <p className="text-xs text-gray-500">
              Integration status
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  config.active
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />

              <span className="text-sm font-semibold text-gray-900">
                {config.active ? "Enabled" : "Not enabled"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={saveConfig} className="space-y-6">
        {/* Connection Settings */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-lg bg-gray-900 p-2.5 text-white">
              <MessageCircle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                WhatsApp Connection
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select your provider and enter the required account details.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Provider */}
            <Field label="WhatsApp Provider" required>
              <select
                name="provider"
                value={config.provider}
                onChange={updateField}
                className="field"
              >
                <option value="META_CLOUD_API">
                  Meta WhatsApp Cloud API
                </option>
                <option value="WATI">WATI</option>
              </select>
            </Field>

            {isMeta ? (
              <>
                <Field label="Business Account ID" required>
                  <input
                    name="businessAccountId"
                    value={config.businessAccountId}
                    onChange={updateField}
                    placeholder="Enter Meta Business Account ID"
                    className="field"
                  />
                </Field>

                <Field label="Phone Number ID" required>
                  <input
                    name="phoneNumberId"
                    value={config.phoneNumberId}
                    onChange={updateField}
                    placeholder="Enter WhatsApp Phone Number ID"
                    className="field"
                  />
                </Field>
              </>
            ) : (
              <Field label="WATI Account / Channel ID" required>
                <input
                  name="providerAccountId"
                  value={config.providerAccountId}
                  onChange={updateField}
                  placeholder="Enter the identifier used by your WATI integration"
                  className="field"
                />
              </Field>
            )}

            {/* Provider Token */}
            <Field
              label={isMeta ? "Access Token" : "WATI API Token"}
              required={!config.hasApiKey}
            >
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  name="apiKey"
                  value={config.apiKey}
                  onChange={updateField}
                  placeholder={
                    config.hasApiKey
                      ? "Saved securely — enter only to replace"
                      : "Enter provider API token"
                  }
                  autoComplete="new-password"
                  className="field pr-12"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowToken((previous) => !previous)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                  aria-label={showToken ? "Hide token" : "Show token"}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {config.hasApiKey && (
                <p className="mt-1.5 text-xs text-emerald-700">
                  A token is already saved. Leave this field empty to
                  retain it.
                </p>
              )}
            </Field>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

            <div>
              <p className="text-sm font-medium text-blue-900">
                Managed by LeadStor
              </p>

              <p className="mt-1 text-sm leading-5 text-blue-800">
                Lead creation, source assignment, and duplicate handling
                follow LeadStor&apos;s predefined processing rules.
              </p>
            </div>
          </div>

          {/* Activation */}
          <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Enable WhatsApp integration
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Turn this off to stop processing messages for this integration.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={config.active}
              onClick={() =>
                setConfig((previous) => ({
                  ...previous,
                  active: !previous.active,
                }))
              }
              className={`relative h-6 w-11 rounded-full transition ${
                config.active ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  config.active ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Connection"}
            </button>
          </div>
        </section>

        {/* Webhook */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-900 p-2.5 text-white">
              <Webhook className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Webhook Configuration
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Configure your provider to send incoming WhatsApp messages
                to LeadStor.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Field label="Webhook URL">
              <div className="flex gap-2">
                <textarea
                  value={config.webhookUrl || ""}
                  readOnly
                  placeholder="Webhook URL will appear here"
                  rows={3}
                  className="field min-h-[88px] resize-none font-mono text-sm leading-6"
                />

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(config.webhookUrl, "Webhook URL")
                  }
                  disabled={!config.webhookUrl}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
            </Field>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl bg-gray-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />

            <div>
              <p className="text-sm font-medium text-gray-800">
                One-time setup
              </p>

              <p className="mt-1 text-sm leading-5 text-gray-600">
                Configure the webhook and message subscription in your
                provider account. Saving this connection does not
                automatically register the webhook with Meta or WATI.
              </p>
            </div>
          </div>

        </section>
      </form>
    </div>
  );
}

function Field({ label, required = false, children }) {
  return (
    <div className="min-w-0 space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}
