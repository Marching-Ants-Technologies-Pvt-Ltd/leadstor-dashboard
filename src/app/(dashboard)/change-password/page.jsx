"use client";
import React, { useState } from "react";
import { RiLockPasswordLine, RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.min.css';
import { xFetch } from "@/utility/xFetch";

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "", width: "0%" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", color: "bg-red-500", text: "text-red-600", width: "33%" };
  if (score <= 3) return { score, label: "Medium", color: "bg-yellow-500", text: "text-yellow-600", width: "66%" };
  return { score, label: "Strong", color: "bg-green-500", text: "text-green-600", width: "100%" };
}

function PasswordInput({ name, label, value, error, showPassword, setShowPassword, onChange, onBlur }) {
  const fieldKey = name === "currentPassword" ? "current" : name === "newPassword" ? "new" : "confirm";

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className={`flex items-center border rounded-lg py-2 px-3 mt-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${error ? "border-red-400" : "border-gray-300"}`}>
        <RiLockPasswordLine className="text-gray-500 mr-2" />
        <input
          type={showPassword[fieldKey] ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full bg-white text-gray-900 placeholder-gray-400 border-0 focus:outline-none focus:ring-0 p-0"
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => ({ ...s, [fieldKey]: !s[fieldKey] }))}
          className="text-gray-400 hover:text-gray-600"
        >
          {showPassword[fieldKey] ? <RiEyeOffLine /> : <RiEyeLine />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [checkingCurrent, setCheckingCurrent] = useState(false);
  const [saving, setSaving] = useState(false);

  const strength = getPasswordStrength(form.newPassword);
  const passwordsMatch = form.confirmPassword.length > 0 && form.newPassword === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;

  const canSubmit =
    form.currentPassword.length > 0 &&
    !currentPasswordError &&
    strength.score >= 3 &&
    passwordsMatch;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "currentPassword") setCurrentPasswordError("");
  };

  // ============================
  // LIVE CHECK ON BLUR
  // ============================
  const handleCurrentPasswordBlur = async () => {
    if (!form.currentPassword) return;
    setCheckingCurrent(true);

    await xFetch({
      path: `/services/profile/verifyPassword`,
      method: "POST",
      payload: { currentPassword: form.currentPassword },
      isformdata: true,
    })
      .then((res) => {
        if (!res.status) {
          setCurrentPasswordError("Incorrect current password");
        } else {
          setCurrentPasswordError("");
        }
      })
      .catch(() => {
        // Fail silently here - final submit re-verifies server-side regardless.
      })
      .finally(() => setCheckingCurrent(false));
  };

  // ============================
  // SUBMIT
  // ============================
  const handleSubmit = async () => {
    setSaving(true);

    await xFetch({
      path: `/services/profile/changePassword`,
      method: "POST",
      payload: form,
      isformdata: true,
    })
      .then((res) => {
        if (res.status) {
          toast.success("Password changed successfully!");
          setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } else {
          toast.error(res.desc || "Something went wrong, please try again.");
          if (res.desc === "Current password is incorrect") {
            setCurrentPasswordError("Incorrect current password");
          }
        }
      })
      .catch(() => {
        toast.error("Something went wrong, please try again.");
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="max-w-2xl w-full mx-auto p-6 bg-white shadow-xl rounded-xl border">
        <ToastContainer />

        <h2 className="text-2xl font-semibold mb-6 border-b pb-3">Change Password</h2>

        <div className="space-y-6">
          <PasswordInput
            name="currentPassword"
            label="Current Password"
            value={form.currentPassword}
            error={currentPasswordError}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onChange={handleChange}
            onBlur={handleCurrentPasswordBlur}
          />
          {checkingCurrent && (
            <p className="text-xs text-gray-400 -mt-4">Checking...</p>
          )}

          <div>
            <PasswordInput
              name="newPassword"
              label="New Password"
              value={form.newPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              onChange={handleChange}
            />
            {form.newPassword && (
              <div className="mt-2">
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className={`text-xs mt-1 font-medium ${strength.text}`}>{strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <PasswordInput
              name="confirmPassword"
              label="Confirm New Password"
              value={form.confirmPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              onChange={handleChange}
            />
            {passwordsMismatch && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
            {passwordsMatch && (
              <p className="text-xs text-green-600 mt-1">Passwords match</p>
            )}
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "Updating..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}