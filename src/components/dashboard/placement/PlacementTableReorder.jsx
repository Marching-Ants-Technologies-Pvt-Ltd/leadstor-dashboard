"use client";

import { useEffect, useMemo, useState } from "react";
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
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { xFetch } from "@/utility/xFetch";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// SORTABLE ROW
const SortableRow = ({ id, label, index, total, compulsory, disabled, onMove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id, disabled });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="border-b bg-white hover:bg-gray-50"
    >
      <td className="p-3">
        <div className="flex items-center gap-3">
          <GripVertical
            size={18}
            className={disabled ? "text-gray-200" : "cursor-grab text-gray-400"}
            {...(disabled ? {} : { ...attributes, ...listeners })}
          />
          <span className="w-6 text-xs text-gray-400">{index + 1}</span>
          <span>{label}</span>
          {compulsory && <span className="text-xs text-gray-500">(Required)</span>}
        </div>
      </td>
      <td className="p-3 w-24">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(id, -1)}
            disabled={disabled || index === 0}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
            title="Move up"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => onMove(id, 1)}
            disabled={disabled || index === total - 1}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
            title="Move down"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// MAIN COMPONENT
export default function PlacementTableReorder() {
  const [columns, setColumns] = useState([]); // all columns from the server
  const [order, setOrder] = useState([]);     // ALL keys (visible + hidden) in current order
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    xFetch({ path: "/services/profile/getPlacementColumns" })
      .then((res) => {
        const list = res?.columns || [];
        setColumns(list);
        setOrder(list.map((c) => c.key));
        setCanEdit(res?.canEdit === true);
      })
      .catch(() => toast.error("Failed to load columns"))
      .finally(() => setLoading(false));
  }, []);

  const byKey = useMemo(
    () => Object.fromEntries(columns.map((c) => [c.key, c])),
    [columns]
  );

  // Only the columns currently shown in the table are listed here
  const visibleKeys = useMemo(
    () => order.filter((k) => byKey[k]?.visible),
    [order, byKey]
  );

  // Reorder the visible columns; hidden ones keep their slot
  const applyVisibleOrder = (newVisible) => {
    const visibleSet = new Set(newVisible);
    let i = 0;
    setOrder((prev) => prev.map((k) => (visibleSet.has(k) ? newVisible[i++] : k)));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!canEdit || !over || active.id === over.id) return;

    const oldIndex = visibleKeys.indexOf(active.id);
    const newIndex = visibleKeys.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    applyVisibleOrder(arrayMove(visibleKeys, oldIndex, newIndex));
  };

  const handleMove = (key, direction) => {
    if (!canEdit) return;
    const from = visibleKeys.indexOf(key);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= visibleKeys.length) return;

    applyVisibleOrder(arrayMove(visibleKeys, from, to));
  };

  const handleSave = () => {
    if (!canEdit) {
      toast.error("Only administrators can change these settings");
      return;
    }

    const formData = new FormData();
    formData.append("columnOrder", JSON.stringify(order));

    setSaving(true);
    xFetch({
      path: "/services/profile/updatePlacementColumnOrder",
      method: "POST",
      payload: formData,
      isFormData: true,
    })
      .then((res) => {
        if (res?.status === true) {
          toast.success("Column order saved successfully!");
        } else {
          toast.error(res?.message || "Failed to save column order");
        }
      })
      .catch(() => toast.error("Error updating column order"))
      .finally(() => setSaving(false));
  };

  return (
    <div className="w-full p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mb-2">
        <h2 className="text-xl font-semibold">Reorder Table Columns</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Drag the handle (or use the arrows) to change the order of columns in the Placements
        table. Only columns that are currently shown are listed.
      </p>

      {!loading && !canEdit && (
        <div className="mb-4 px-3 py-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
          View only — only administrators can change these settings.
        </div>
      )}

      <div className="border rounded-xl shadow bg-white">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={visibleKeys} strategy={verticalListSortingStrategy}>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 320px)" }}>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 border-b sticky top-0 z-10">
                  <tr>
                    <th className="p-4 font-medium text-gray-700">Table Column Name</th>
                    <th className="p-4 font-medium text-gray-700 w-24">Move</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-gray-500">
                        Loading columns...
                      </td>
                    </tr>
                  ) : visibleKeys.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-gray-500">
                        No columns found
                      </td>
                    </tr>
                  ) : (
                    visibleKeys.map((key, index) => (
                      <SortableRow
                        key={key}
                        id={key}
                        label={byKey[key].label}
                        index={index}
                        total={visibleKeys.length}
                        compulsory={byKey[key].compulsory}
                        disabled={!canEdit}
                        onMove={handleMove}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={!canEdit || saving || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}