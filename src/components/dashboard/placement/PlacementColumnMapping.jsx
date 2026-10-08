"use client";

import { useEffect, useMemo, useState } from "react";
import { xFetch } from "@/utility/xFetch";
import { Search } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PlacementColumnMapping() {
  const [columns, setColumns] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchColumns = () => {
    setLoading(true);
    xFetch({ path: "/services/profile/getPlacementColumns" })
      .then((res) => {
        const list = res?.columns || [];
        setColumns(list);
        setSelectedKeys(list.filter((c) => c.visible).map((c) => c.key));
        setCanEdit(res?.canEdit === true);
      })
      .catch(() => toast.error("Failed to load column settings"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchColumns();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? columns.filter((c) => c.label.toLowerCase().includes(q)) : columns;
  }, [columns, search]);

  const toggle = (col) => {
    if (!canEdit || col.compulsory) return;
    setSelectedKeys((prev) =>
      prev.includes(col.key) ? prev.filter((k) => k !== col.key) : [...prev, col.key]
    );
  };

  const selectAll = () => {
    if (canEdit) setSelectedKeys(columns.map((c) => c.key));
  };

  const requiredOnly = () => {
    if (canEdit) setSelectedKeys(columns.filter((c) => c.compulsory).map((c) => c.key));
  };

  const handleSave = () => {
    if (!canEdit) {
      toast.error("Only administrators can change these settings");
      return;
    }

    const formData = new FormData();
    formData.append("visibleColumns", JSON.stringify(selectedKeys));

    setSaving(true);
    xFetch({
      path: "/services/profile/updatePlacementColumns",
      method: "POST",
      payload: formData,
      isFormData: true,
    })
      .then((res) => {
        if (res?.status === true) {
          toast.success("Column settings updated successfully");
        } else {
          toast.error(res?.message || "Failed to update column settings");
        }
      })
      .catch(() => toast.error("Error saving column settings"))
      .finally(() => setSaving(false));
  };

  return (
    <div className="p-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl">Column Mapping</h2>

        <div className="flex items-center gap-4">
          <button
            onClick={selectAll}
            disabled={!canEdit}
            className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            Select all
          </button>
          <button
            onClick={requiredOnly}
            disabled={!canEdit}
            className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            Required only
          </button>

          <div className="flex items-center px-2 border rounded bg-white">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search column..."
              className="px-2 py-1 text-sm bg-white outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Choose which columns appear in the Placements table. Required columns cannot be hidden.
        {" "}
        <span className="font-medium text-gray-700">
          {selectedKeys.length} of {columns.length} selected
        </span>
      </p>

      {!loading && !canEdit && (
        <div className="mb-4 px-3 py-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
          View only — only administrators can change these settings.
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-auto">
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-gray-100 border-b sticky top-0">
              <tr>
                <th className="p-2 text-left w-40">Show</th>
                <th className="p-2 text-left w-16">Sr.</th>
                <th className="p-2 text-left">Column Name</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">No columns found</td>
                </tr>
              ) : (
                filtered.map((col, index) => (
                  <tr key={col.key} className={index % 2 ? "bg-gray-50" : ""}>
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedKeys.includes(col.key)}
                        disabled={!canEdit || col.compulsory}
                        onChange={() => toggle(col)}
                      />
                      {col.compulsory && (
                        <span className="ml-1 text-xs text-gray-500">(Required)</span>
                      )}
                    </td>
                    <td className="p-2">{col.sr}</td>
                    <td className="p-2">{col.label}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={!canEdit || saving || loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Update"}
        </button>
      </div>
    </div>
  );
}