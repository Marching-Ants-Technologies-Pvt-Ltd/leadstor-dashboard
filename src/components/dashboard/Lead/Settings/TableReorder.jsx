"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { xFetch } from "@/utility/xFetch";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// SORTABLE ROW
const SortableRow = ({ id, label }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="border-b hover:bg-gray-50"
    >
      <td className="p-3 flex items-center gap-3 bg-white">
        <GripVertical size={18} className="cursor-grab text-gray-400" {...attributes} {...listeners} />
        {label}
      </td>
    </tr>
  );
};

// MAIN COMPONENT
export default function TableReorder() {
  const [columns, setColumns] = useState([]);
  const [columnOrder, setColumnOrder] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const sensors = useSensors(useSensor(PointerSensor));

  // Fetch columns
  useEffect(() => {
    xFetch({ path: "/services/profile/columns" })
      .then((data) => {
        setColumns(data);
        console.log("COLUMNS DATA:", data); 
        const order = data.map((item) => item.fieldId).filter((id) => id);
        setColumnOrder(order);
      })
      .catch(() => {
        setColumns([]);
      });
  }, []);

  // Filtered & paginated list
  const filteredOrder = useMemo(() => {
    let result = columnOrder;

    if (search.trim()) {
      result = result.filter((fid) => {
        const col = columns.find((c) => c.fieldId === fid);
        if (!col) return false;
        const label = col.displayName || col.fieldName || col.name || "Unnamed";
        return label.toLowerCase().includes(search.toLowerCase());
      });
    }

    // Pagination
    const start = (currentPage - 1) * recordsPerPage;
    return result.slice(start, start + recordsPerPage);
  }, [search, columns, columnOrder, currentPage, recordsPerPage]);

  const totalPages = Math.ceil(
    (search.trim() ? filteredOrder.length : columnOrder.length) / recordsPerPage
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = columnOrder.indexOf(active.id);
    const newIndex = columnOrder.indexOf(over.id);
    setColumnOrder((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const handleSave = async () => {
    try {
      const payload = columnOrder.map((fid) => ({ fieldId: String(fid) }));

      await xFetch({
        path: "/services/profile/updateLeadTableReorder",
        method: "POST",
        payload: { data: payload },
      });

      toast.success("Column order saved successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Error updating column order", {
        position: "top-right",
        autoClose: 4000,
      });
    }
  };

  return (
    <div className="w-full">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Reorder Table Columns</h2>

        <div className="flex items-center gap-4">
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search columns..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table Container - Increased height */}
      <div className="border rounded-xl shadow bg-white">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredOrder} strategy={verticalListSortingStrategy}>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 60px)" }}>
              <table className="w-full text-left">
                <thead className="bg-gray-100 border-b sticky top-0 z-10">
                  <tr>
                    <th className="p-4 font-medium text-gray-700">Table Column Name</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrder.length === 0 ? (
                    <tr>
                      <td className="p-8 text-center text-gray-500">
                        {search ? "No matching columns found" : "Loading columns..."}
                      </td>
                    </tr>
                  ) : (
                    filteredOrder.map((fid) => {
                      const col = columns.find((c) => c.fieldId === fid);
                      if (!col) return null;
                      const label = col.displayName || col.fieldName || col.name || "Unnamed";
                      return <SortableRow key={fid} id={fid} label={label} />;
                    })
                  )}
                </tbody>
              </table>
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <select
            value={recordsPerPage}
            onChange={(e) => {
              setRecordsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-2 py-1 text-sm rounded border ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Save
        </button>
      </div>
    </div>
  );
}