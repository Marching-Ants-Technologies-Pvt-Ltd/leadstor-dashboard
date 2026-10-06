"use client";
import { xFetch } from "@/utility/xFetch";
import { useEffect, useState } from "react";
import { Search, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/ReactToastify.min.css";
import { useRouter } from "next/navigation";

export default function MyForms() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;
  const router = useRouter();

  const fetchData = () => {
    setLoading(true);
    xFetch({ path: "/services/widget/getAllForms/", method: "POST" })
      .then((res) => {
        const forms = res?.myforms || [];
        setData(forms);
        setFiltered(forms);
      })
      .catch(() => {
        toast.error("Failed to load forms");
        setData([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const result = data.filter((item) =>
      item.title?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
    setPage(1);
  }, [search, data]);

  const paginated = filtered.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filtered.length / limit);

  const handleAdd = () => {
    const formTitle = prompt("Enter your form title");
    if (!formTitle || formTitle.trim().length < 3) {
      toast.error("Kindly enter a valid form title");
      return;
    }
    xFetch({
      path: "/services/widget/createNewForm/",
      method: "POST",
      payload: new URLSearchParams({ formTitle }),
      isFormData: true,
    })
      .then((res) => {
        if (res?.status) {
          toast.success(`Form "${res.title}" created successfully`);
          fetchData();
        } else {
          toast.error(res?.desc || "Failed to create form");
        }
      })
      .catch(() => toast.error("Failed to create form"));
  };

  const handleDelete = (token) => {
    if (!window.confirm("Delete this form?")) return;
        xFetch({ path: "/services/widget/deleteMyForm/", method: "POST", payload: new URLSearchParams({ token }), isFormData: true })      .then((res) => {
        if (res?.status) {
          toast.success("Form deleted successfully");
          fetchData();
        } else {
          toast.error(res?.desc || "Failed to delete form");
        }
      })
      .catch(() => toast.error("Failed to delete form"));
  };

  return (
    <div className="p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h2 className="text-xl">My Forms</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search forms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
            title="Add Form"
          >
            <Plus size={16} />
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
                  <th className="p-2">Title</th>
                  <th className="p-2">Type</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-2">{row.title}</td>
                    <td className="p-2">{row.is_paid}</td>
                    <td className="p-2 text-center space-x-2">
                      <button onClick={() => router.push(`/leads/forms/builder?token=${encodeURIComponent(row.token)}`)} className="text-blue-600 hover:text-blue-800">Edit</button>
                      <button onClick={() => router.push(`/leads/forms/preview?token=${encodeURIComponent(row.token)}`)} className="text-gray-600 hover:text-gray-800">View</button>
                      <button onClick={() => handleDelete(row.token)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan="3" className="text-center py-4 text-gray-500">No forms found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex justify-end items-center mt-3 gap-2 text-sm">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className={`px-3 py-1 rounded ${page === 1 ? "bg-gray-200 text-gray-500" : "bg-blue-500 text-white hover:bg-blue-600"}`}>
            <ChevronLeft size={20} />
          </button>
          <span className="text-gray-700">Page {page} of {totalPages || 1}</span>
          <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)} className={`px-3 py-1 rounded ${page === totalPages || totalPages === 0 ? "bg-gray-200 text-gray-500" : "bg-blue-500 text-white hover:bg-blue-600"}`}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}