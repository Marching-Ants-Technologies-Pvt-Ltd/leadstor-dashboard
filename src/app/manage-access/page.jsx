"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bounce, ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  RiArrowLeftLine,
  RiRefreshLine,
  RiSearchLine,
  RiShieldUserLine,
} from "react-icons/ri";

import { xFetch } from "@/utility/xFetch";
import { Corporate } from "@/utility/TinyDB";
import { MANAGE_ACCESS_CORPORATE_ID } from "@/utility/accessControl";

const PAGE_SIZES = [15, 20, 30, 50];

const MODULES = [
  {
    key: "lead",
    label: "Lead Management",
    usingField: "using_lead_management",
    accessField: "lead_module_access",
  },
  {
    key: "payment",
    label: "Payment",
    usingField: "using_payment_module",
    accessField: "payment_module_access",
  },
  {
    key: "batch",
    label: "Batch Management",
    usingField: "using_batch_management",
    accessField: "batch_module_access",
  },
  {
    key: "job",
    label: "Job Management",
    usingField: "using_job_module",
    accessField: "job_module_access",
  },
];

const toBool = (value, fallback = false) => {
  if (value === null || value === undefined || value === "") return fallback;
  return value === 1 || value === "1" || value === true;
};

const ToggleSwitch = ({ checked, disabled = false, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
      checked ? "bg-emerald-500" : "bg-gray-300"
    } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const Badge = ({ active, muted = false, children }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
      active
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : muted
          ? "border-gray-200 bg-gray-50 text-gray-500"
          : "border-rose-200 bg-rose-50 text-rose-700"
    }`}
  >
    {children}
  </span>
);

function getSessionCorporateId() {
  return Corporate?._id ?? Corporate?.corporateId ?? Corporate?.id ?? null;
}

function getSessionCorporateName() {
  return Corporate?.name ?? Corporate?.corporate_name ?? "Manage Access";
}

export default function ManageAccessPage() {
  const corporateId = getSessionCorporateId();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [savingKey, setSavingKey] = useState("");

  const allowed = corporateId === MANAGE_ACCESS_CORPORATE_ID;

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await xFetch({ path: "/services/subscription/getCorporateModuleUsage" });
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load manage access data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    loadRows();
  }, [allowed, loadRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const name = String(row.corporate_name ?? "").toLowerCase();
      const id = String(row.corporate_id ?? "").toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const updateLoginAccess = async (corporateRow, nextEnabled) => {
    const key = `${corporateRow.corporate_id}:login`;
    setSavingKey(key);
    setRows((prev) =>
      prev.map((row) =>
        String(row.corporate_id) === String(corporateRow.corporate_id)
          ? { ...row, login_access_enabled: nextEnabled ? 1 : 0 }
          : row
      )
    );

    try {
      await xFetch({
        method: "POST",
        path: "/services/subscription/enableDisableLogin",
        payload: {
          referenceId: corporateRow.corporate_id,
          disableLink: nextEnabled ? 0 : 1,
        },
      });
      toast.success(nextEnabled ? "Login access enabled" : "Login access disabled");
    } catch (error) {
      console.error(error);
      setRows((prev) =>
        prev.map((row) =>
          String(row.corporate_id) === String(corporateRow.corporate_id)
            ? { ...row, login_access_enabled: nextEnabled ? 0 : 1 }
            : row
        )
      );
      toast.error("Unable to update login access");
    } finally {
      setSavingKey("");
    }
  };

  const updateModuleAccess = async (corporateRow, module) => {
    const currentAccess = toBool(
      corporateRow[module.accessField],
      toBool(corporateRow[module.usingField])
    );
    const nextValue = !currentAccess;
    const key = `${corporateRow.corporate_id}:${module.accessField}`;
    setSavingKey(key);

    setRows((prev) =>
      prev.map((row) =>
        String(row.corporate_id) === String(corporateRow.corporate_id)
          ? { ...row, [module.accessField]: nextValue ? 1 : 0 }
          : row
      )
    );

    try {
      await xFetch({
        method: "POST",
        path: "/services/subscription/updateCorporateModuleAccess",
        payload: {
          corporateId: corporateRow.corporate_id,
          accessField: module.accessField,
          accessValue: nextValue ? 1 : 0,
        },
      });
      toast.success(`${module.label} access ${nextValue ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error(error);
      setRows((prev) =>
        prev.map((row) =>
          String(row.corporate_id) === String(corporateRow.corporate_id)
            ? { ...row, [module.accessField]: currentAccess ? 1 : 0 }
            : row
        )
      );
      toast.error("Unable to update module access");
    } finally {
      setSavingKey("");
    }
  };

  const refresh = async () => {
    await loadRows();
  };

  const pageStart = filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, filteredRows.length);

  if (loading) {
    return <div className="p-5 text-center text-lg">Loading...</div>;
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-800">Manage Access</h1>
          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <ToastContainer position="top-right" autoClose={3000} transition={Bounce} />

      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <RiArrowLeftLine />
            Back
          </Link>

          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <RiRefreshLine className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                <RiShieldUserLine className="text-indigo-500" />
                Manage Access
              </h2>
              <p className="text-sm text-gray-500">
                Corporate name, ID, login access, and module usage are shown together.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
              <div className="relative w-full md:w-80">
                <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by corporate name or ID"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="max-h-[65vh] overflow-y-auto">
              <table className="min-w-[1300px] w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100">
                  <tr className="text-left text-slate-600">
                    <th className="px-5 py-3 font-medium">Corporate</th>
                    <th className="px-5 py-3 font-medium">ID</th>
                    <th className="px-5 py-3 font-medium">Login Access</th>
                    {MODULES.map((module) => (
                      <th key={module.key} className="px-5 py-3 font-medium">
                        {module.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={3 + MODULES.length} className="px-5 py-10 text-center text-gray-500">
                        No corporates found
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row) => {
                      const loginEnabled = toBool(row.login_access_enabled);

                      return (
                        <tr key={row.corporate_id} className="border-t align-top hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-800">{row.corporate_name}</div>
                          </td>
                          <td className="px-5 py-4 text-gray-600">{row.corporate_id}</td>
                          <td className="px-5 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <Badge active={loginEnabled} muted={!loginEnabled}>
                                  {loginEnabled ? "Enabled" : "Disabled"}
                                </Badge>
                                <ToggleSwitch
                                  checked={loginEnabled}
                                  disabled={savingKey === `${row.corporate_id}:login`}
                                  onChange={() => updateLoginAccess(row, !loginEnabled)}
                                />
                              </div>
                              <div className="text-[11px] text-gray-500">
                                {loginEnabled ? "Corporate can log in" : "Corporate cannot log in"}
                              </div>
                            </div>
                          </td>

                          {MODULES.map((module) => {
                            const using = toBool(row[module.usingField]);
                            const accessEnabled = toBool(row[module.accessField], using);
                            const busy = savingKey === `${row.corporate_id}:${module.accessField}`;

                            return (
                              <td key={module.key} className="px-5 py-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="text-[11px] uppercase tracking-wide text-gray-400">Using</div>
                                      <div className="mt-1 flex items-center gap-2">
                                        <Badge active={using} muted={!using}>
                                          {using ? "Yes" : "No"}
                                        </Badge>
                                        <span className="truncate text-[11px] text-gray-500">
                                          {using
                                            ? "Currently active"
                                            : accessEnabled
                                              ? "Allowed by admin"
                                              : "Blocked by admin"}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <ToggleSwitch
                                        checked={accessEnabled}
                                        disabled={busy}
                                        onChange={() => updateModuleAccess(row, module)}
                                      />
                                      <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => updateModuleAccess(row, module)}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {accessEnabled ? "Disable" : "Enable"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <div>
              Showing <span className="font-medium text-slate-800">{pageStart}</span> to{" "}
              <span className="font-medium text-slate-800">{pageEnd}</span> of{" "}
              <span className="font-medium text-slate-800">{filteredRows.length}</span> corporates
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="min-w-[92px] text-center">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Corporate: {getSessionCorporateName()} ({corporateId})
        </div>
      </div>
    </div>
  );
}
