"use client";
import { RiShieldUserLine, RiToggleFill, RiToggleLine } from "react-icons/ri";
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.min.css';
import { xFetch } from "@/utility/xFetch";
import { Corporate } from "@/utility/TinyDB";
import { MANAGE_ACCESS_CORPORATE_ID } from "@/utility/accessControl";
import Link from 'next/link';
import { RiArrowLeftLine } from "react-icons/ri";
import React, { useEffect, useState, useRef } from "react";

function CompanyDropdown({ companies, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const boxRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = companies.find(c => String(c.corporate_id) === String(selectedId));
  const filtered = companies.filter(c =>
    c.corporate_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative mt-1 mb-6" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between border border-gray-300 rounded-lg py-2 px-3 text-left bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected?.corporate_name || "Select a company"}
        </span>
        <i className="ri-arrow-down-s-line text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <input
            autoFocus
            type="text"
            placeholder="Search company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border-b border-gray-100 focus:outline-none text-sm"
          />
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">No matches</div>
            )}
            {filtered.map((c) => (
              <div
                key={c.corporate_id}
                onClick={() => {
                  onSelect(String(c.corporate_id));
                  setOpen(false);
                  setSearch("");
                }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                  String(c.corporate_id) === String(selectedId) ? "bg-blue-50 font-medium" : ""
                }`}
              >
                {c.corporate_name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManageAccess() {
  const [companies, setCompanies] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);  
  const [hasAccess, setHasAccess] = useState(false);

  const fetchCompanies = async () => {
    setLoading(true);
    await xFetch({ path: `/services/profile/getAllCorporates` })
      .then((res) => {
        setCompanies(res || []);
        if (res?.length) setSelectedId(String(res[0].corporate_id));
      })
      .catch(() => toast.error("Unable to load companies"))
      .finally(() => setLoading(false));
  };

  const fetchStatus = async (corporateId) => {
    if (!corporateId) return;
    setStatusLoading(true);
    await xFetch({
      path: `/services/subscription/getCorporateEnableStatus`,
      payload: { corporateId },
    })
      .then((res) => setEnabled(Number(res) === 0))
      .catch(() => toast.error("Unable to load access status"))
      .finally(() => setStatusLoading(false));
  };

  useEffect(() => { fetchCompanies(); }, []);
  useEffect(() => { fetchStatus(selectedId); }, [selectedId]);
  useEffect(() => {                                              // ← add
    setHasAccess(Corporate?._id === MANAGE_ACCESS_CORPORATE_ID);
    setAccessChecked(true);
    }, []);

  const confirmToggle = async () => {
    setShowConfirm(false);
    const nextEnabled = !enabled;
    await xFetch({
      method: "POST",
      path: `/services/subscription/enableDisableLogin`,
      payload: {
        referenceId: selectedId,
        disableLink: nextEnabled ? 0 : 1,
      },
    })
      .then(() => {
        setEnabled(nextEnabled);
        toast.success(nextEnabled ? "Access enabled" : "Access disabled");
      })
      .catch(() => toast.error("Something went wrong, please try again."));
  };

  if (!accessChecked || loading) {
    return <div className="p-5 text-center text-lg">Loading...</div>;
    }

    if (!hasAccess) {
    return (
        <div className="p-10 text-center text-gray-500">
        You don't have permission to view this page.
        </div>
    );
    }

  const selectedCompany = companies.find(c => String(c.corporate_id) === String(selectedId));

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="max-w-xl w-full mx-auto p-6 bg-white shadow-xl rounded-xl border">
        <ToastContainer position="top-center" autoClose={2000} theme="light" transition={Bounce} />

        <Link href="/leads" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-4">
            <RiArrowLeftLine /> Back to Leads
        </Link>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-3 flex items-center gap-2">
          <RiShieldUserLine className="text-indigo-500" /> Manage Access
        </h2>

        <label className="text-sm font-medium">Company</label>
        <CompanyDropdown
        companies={companies}
        selectedId={selectedId}
        onSelect={setSelectedId}
        />

        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <div className="font-medium">{selectedCompany?.corporate_name}</div>
            <div className="text-sm text-gray-500">
              {statusLoading ? "Checking status..." : enabled ? "Access enabled" : "Access disabled"}
            </div>
          </div>

          <button
            disabled={statusLoading}
            onClick={() => setShowConfirm(true)}
            className="text-3xl disabled:opacity-40"
            title={enabled ? "Disable access" : "Enable access"}
          >
            {enabled
              ? <RiToggleFill className="text-emerald-500" />
              : <RiToggleLine className="text-gray-400" />}
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">
              {enabled ? "Disable access?" : "Enable access?"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {enabled
                ? `This will revoke login access for ${selectedCompany?.corporate_name}.`
                : `This will restore login access for ${selectedCompany?.corporate_name}.`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggle}
                className={`px-4 py-2 rounded-lg text-white font-medium ${enabled ? "bg-rose-500 hover:bg-rose-600" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {enabled ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}