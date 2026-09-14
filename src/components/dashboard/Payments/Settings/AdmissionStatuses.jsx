"use client";
import { xFetch } from "@/utility/xFetch";
import { Corporate } from "@/utility/TinyDB";
import { useEffect, useState } from "react";
import { Search, Trash2, X, Edit3, Plus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/ReactToastify.min.css";

export default function AdmissionStatuses() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: null, status: "" });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [highlightedId, setHighlightedId] = useState(null);

  const fetchData = () => {
    setLoading(true);
    xFetch({
      path: `/services/profile/getAdmissionStatuses`,
      payload: { corporateId: Corporate?._id },
    })
      .then((data) => {
        setData(data);
        setFiltered(data);
      })
      .catch((error) => {
        console.error("Error fetching admission statuses", error);
        setData([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const result = data.filter((item) =>
      item.status.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
    setPage(1);
  }, [search, data]);

  const paginated = filtered.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filtered.length / limit);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!form.status) newErrors.status = "Status is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const url = editing
        ? "/services/profile/updateAdmissionStatuses"
        : "/services/profile/addAdmissionStatuses";

    const payload = editing
        ? new URLSearchParams({ admissionStatusId: form.id, admissionStatusName: form.status })
        : new URLSearchParams({ corporateId: Corporate?._id, admissionStatusName: form.status });

    xFetch({ path: url, method: "POST", payload, isFormData: true })
        .then(() => {
        toast.success(editing ? "Status updated successfully" : "Status added successfully");
        setShowModal(false);
        setErrors({});
        setForm({ id: null, status: "" });
        setEditing(false);
        fetchData();
        })
        .catch((error) => {
        console.error("Error saving admission status", error);
        toast.error("Failed to save status");
        })
        .finally(() => setLoading(false));
    };

  const handleDelete = async (id) => {
    xFetch({
      path: "/services/profile/deleteAdmissionStatuses",
      method: "POST",
      payload: { admissionStatusId: id },
    })
      .then(() => {
        toast.success("Status deleted successfully");
        fetchData();
      })
      .catch((error) => {
        console.error("Error deleting admission status", error);
        toast.error("Failed to delete status");
      })
      .finally(() => setLoading(false));
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return toast.error("No statuses selected");
    if (!window.confirm("Delete selected statuses?")) return;
    for (const id of selected) {
      await handleDelete(id);
    }
    setSelected([]);
    toast.success("Selected statuses deleted successfully");
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h2 className="text-xl">Admission Statuses</h2>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => {
              setEditing(false);
              setForm({ id: null, status: "" });
              setShowModal(true);
            }}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
            title="Add Status"
          >
            <Plus size={16} />
          </button>

          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
            title="Delete Selected"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-auto max-h-[calc(100vh-220px)]">
          {loading ? (
            <p className="text-center py-4 text-gray-500">Loading...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr className="text-left">
                  <th className="p-2 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setSelected(e.target.checked ? paginated.map((r) => r.id) : [])
                      }
                      checked={
                        paginated.length > 0 &&
                        paginated.every((r) => selected.includes(r.id))
                      }
                    />
                  </th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t hover:bg-gray-50 transition-colors duration-500 ${
                      highlightedId === row.id ? "bg-yellow-100" : ""
                    }`}
                  >
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(row.id)}
                        onChange={() => toggleSelect(row.id)}
                      />
                    </td>
                    <td className="p-2">{row.status}</td>
                    <td className="p-2 text-center space-x-2">
                      <button
                        onClick={() => {
                          setForm({ id: row.id, status: row.status });
                          setEditing(true);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-gray-500">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-end items-center mt-3 gap-2 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-1 rounded ${page === 1 ? "bg-gray-200 text-gray-500" : "bg-blue-500 text-white hover:bg-blue-600"}`}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-gray-700">Page {page} of {totalPages || 1}</span>
          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            className={`px-3 py-1 rounded ${page === totalPages || totalPages === 0 ? "bg-gray-200 text-gray-500" : "bg-blue-500 text-white hover:bg-blue-600"}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
            <h3 className="text-lg mb-4">{editing ? "Update" : "Add"} Status</h3>
            <input
              name="status"
              placeholder="Status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2 mb-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.status && <p className="text-red-500 text-sm mb-2">{errors.status}</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowModal(false); setErrors({}); }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                title="Cancel"
              >
                <X size={15} />
              </button>
              <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" title={editing ? "Update" : "Add"}>
                {editing ? <Check size={15} /> : <Plus size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}