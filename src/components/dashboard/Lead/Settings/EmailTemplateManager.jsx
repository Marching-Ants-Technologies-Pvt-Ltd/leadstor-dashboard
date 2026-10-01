"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { xFetch } from "@/utility/xFetch";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

const mdToHtml = (text = "") => {
    // Escape HTML-special characters first, so nothing pasted can break markup
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const lines = html.split(/\r?\n/);
    const out = [];
    let inList = false;
    let tableBuffer = [];

    const flushList = () => {
        if (inList) {
            out.push("</ul>");
            inList = false;
        }
    };

    const isTableRow = (line) => /^\s*\|.*\|\s*$/.test(line);
    const isTableSeparator = (line) => /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line);

    const flushTable = () => {
        if (tableBuffer.length === 0) return;
        const rows = tableBuffer.filter((l) => !isTableSeparator(l));
        const cellsOf = (line) =>
            line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

        if (rows.length > 0) {
            out.push("<table border='1' cellpadding='6' style='border-collapse:collapse;'>");
            const headerCells = cellsOf(rows[0]);
            out.push("<tr>" + headerCells.map((c) => `<th>${c}</th>`).join("") + "</tr>");
            for (let i = 1; i < rows.length; i++) {
                const cells = cellsOf(rows[i]);
                out.push("<tr>" + cells.map((c) => `<td>${c}</td>`).join("") + "</tr>");
            }
            out.push("</table>");
        }
        tableBuffer = [];
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Table detection: current line + next line look like a table header + separator
        if (isTableRow(line) && (isTableSeparator(lines[i + 1] || "") || tableBuffer.length > 0)) {
            flushList();
            tableBuffer.push(line);
            continue;
        } else if (tableBuffer.length > 0) {
            flushTable();
        }

        // Heading detection: "# text", "## text", "### text" (up to 6 levels, standard Markdown)
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            flushList();
            const level = headingMatch[1].length;
            out.push(`<h${level}>${headingMatch[2]}</h${level}>`);
            continue;
        }

        // Bullet detection: "* text" or "- text"
        const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
        if (bulletMatch) {
            if (!inList) {
                out.push("<ul>");
                inList = true;
            }
            out.push(`<li>${bulletMatch[1]}</li>`);
            continue;
        } else {
            flushList();
        }

        out.push(line);
    }
    flushList();
    flushTable();

    html = out.join("\n");

    // Bold: **text**  (must run before italic, or ** gets mangled by the * rule)
    html = html.replace(/\*\*\s*([^*]+?)\s*\*\*/g, "<strong>$1</strong>");

    // Strikethrough: ~~text~~
    html = html.replace(/~~([^~]+?)~~/g, "<del>$1</del>");

    // Italic: *text* (single asterisk, safe now since ** is already consumed)
    html = html.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");

    // Convert remaining plain newlines to <br>, but not the ones already inside <ul>/<table> blocks
    html = html
        .split("\n")
        .map((line) => (/^<(ul|\/ul|li|table|tr|\/table|h[1-6])/.test(line.trim()) ? line : line + "<br>"))
        .join("\n");

    return html;
};

const getJoditConfig = (heightPx, joditInstanceRef) => ({
    height: heightPx,
    toolbarAdaptive: false,
    enableDragAndDropFileToEditor: false, 
    buttons:
        "source,|,bold,italic,underline,|,ul,ol,|,link,image,table,|,align,left,center,right,justify",
    buttonsMD:
        "source,|,bold,italic,underline,|,ul,ol,|,link,image,table,|,align,left,center,right,justify",
    buttonsSM:
        "source,|,bold,italic,underline,|,ul,ol,|,link,image,table",
    buttonsXS:
        "source,|,bold,italic,underline,|,ul,ol,|,link,image",

    // UPLOAD FEATURE ON TOOLBAR ICON
    // uploader: {
    //     url: `${process.env.NEXT_PUBLIC_LEADSTOR_REST}/services/profile/uploadTemplateImage`,
    //     format: "json",
    //     headers: {
    //         Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("access_token") : ""}`,
    //     },
    //     filesVariableName: () => "uploadTemplateImage",
    //     isSuccess: (resp) => resp?.success === true,
    //     getMessage: (resp) => resp?.msg || "Upload failed",
    //     process: (resp) => resp,
    //     defaultHandlerSuccess: function (resp) {
    //         const instance = joditInstanceRef.current;
    //         if (resp?.url && instance?.selection) {
    //             instance.selection.insertImage(resp.url, null, 250);
    //         } else {
    //             toast.error(resp?.msg || "Image upload failed");
    //         }
    //     },
    //     error: (e) => {
    //         console.error("Jodit image upload error:", e);
    //         toast.error("Image upload failed. Please try again.");
    //     },
    // },
    
        events: {
        afterInit: (instance) => {
            joditInstanceRef.current = instance;

            const editorNode = instance.editor;
            if (editorNode && !editorNode.dataset.mdPasteBound) {
                editorNode.dataset.mdPasteBound = "true";

                editorNode.addEventListener(
                    "paste",
                    function (event) {
                        let imageFile = null;

                        if (event.clipboardData?.files?.length > 0 && event.clipboardData.files[0].type.startsWith("image/")) {
                            imageFile = event.clipboardData.files[0];
                        } else {
                            const items = event.clipboardData?.items;
                            if (items) {
                                for (let i = 0; i < items.length; i++) {
                                    if (items[i].type.startsWith("image/")) {
                                        imageFile = items[i].getAsFile();
                                        break;
                                    }
                                }
                            }
                        }

                        if (imageFile) {
                            event.preventDefault();
                            event.stopImmediatePropagation();

                            const formData = new FormData();
                            formData.append("uploadTemplateImage", imageFile);

                            const token = localStorage.getItem("access_token");

                            fetch(`${process.env.NEXT_PUBLIC_LEADSTOR_REST}/services/profile/uploadTemplateImage`, {
                                method: "POST",
                                headers: { Authorization: `Bearer ${token}` },
                                body: formData,
                            })
                                .then((res) => res.json())
                                .then((resp) => {
                                    const inst = joditInstanceRef.current;
                                    if (resp?.success && resp?.url && inst?.selection) {
                                        inst.selection.insertImage(resp.url, null, 250);
                                    } else {
                                        toast.error(resp?.msg || "Image upload failed");
                                    }
                                })
                                .catch((err) => {
                                    console.error("Paste image upload error:", err);
                                    toast.error("Image upload failed. Please try again.");
                                });

                            return;
                        }

                        const looksLikeMarkdown = (text) =>
                            /\*\*[^*]+\*\*/.test(text) ||
                            /^\s*[-*]\s+/m.test(text) ||
                            /~~[^~]+~~/.test(text) ||
                            /^\s*\|.*\|\s*$/m.test(text) ||
                            /^#{1,6}\s+/m.test(text);

                        const pastedText = event.clipboardData?.getData("text/plain") || "";
                        if (looksLikeMarkdown(pastedText)) {
                            event.preventDefault();
                            event.stopImmediatePropagation();
                            instance.selection?.insertHTML(mdToHtml(pastedText));
                        }
                    },
                    true // capture phase — runs before Jodit's own internal paste handling
                );
            }
        },
    },
});

export default function EmailTemplateManager() {
    const editorRef = useRef(null);
    const contentRef = useRef("");

    const joditInstanceRef = useRef(null); 

    const joditConfig320 = useMemo(() => getJoditConfig(320, joditInstanceRef), []);
    const joditConfig300 = useMemo(() => getJoditConfig(300, joditInstanceRef), []);

    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [openHelper, setOpenHelper] = useState(false);
    const handleOpenHelper = () => setOpenHelper(true);
    const handleCloseHelper = () => setOpenHelper(false);

    const [templateName, setTemplateName] = useState("");
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const placeholders = [
        { key: "$testName", label: "Test Name" },
        { key: "$candidateName", label: "Candidate Name" },
        { key: "$corporateName", label: "Your company/ institute name" },
        { key: "$candResult", label: "Candidate performance result link" },
        { key: "$rating", label: "Rating of the Candidate" },
        { key: "$percentage", label: "Percentage of the Candidate" }
    ];

    const toBase64Utf8 = (value = "") => {
        try {
            return btoa(unescape(encodeURIComponent(value)));
        } catch (e) {
            throw new Error("Template content contains unsupported characters");
        }
    };

    const handleOpen = () => {
        resetForm();
        setOpen(true);
    };
    const handleClose = () => setOpen(false);

    const resetForm = () => {
        setTemplateName("");
        setSubject("");
        setContent("");
        contentRef.current = "";
        setSelectedId("");
    };

    const insertPlaceholder = (token) => {
        const editorInstance = editorRef.current;
        if (editorInstance?.selection?.insertHTML) {
            editorInstance.selection.insertHTML(token);
            const nextContent = editorInstance.value || "";
            contentRef.current = nextContent;
            setContent(nextContent);
            return;
        }
        const nextContent = `${contentRef.current || content || ""}${token}`;
        contentRef.current = nextContent;
        setContent(nextContent);
    };

    const getEditorContent = () => {
        const editorValue = editorRef.current?.value;
        if (typeof editorValue === "string" && editorValue.length > 0) {
            return editorValue;
        }
        return contentRef.current || content || "";
    };

    // Fetch templates
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
        const res = await xFetch({
            path: "/services/profile/getTemplates",
            method: "GET",
        });
        setTemplates(res);
        } catch (e) {
        toast.error("Failed to load templates");
        } finally {
        setLoading(false);
        }
    };

    // Load selected template
    const handleTemplateSelect = (id) => {
        setSelectedId(id);

        const temp = templates.find((t) => t.templateId === id);
        if (temp) {
            setTemplateName(temp.templateName);
            setSubject(temp.subject);

            const editorInstance = editorRef.current;
            if (editorInstance) {
            editorInstance.value = temp.htmlContent;   // Load HTML correctly
            }

            const nextContent = temp.htmlContent || "";
            contentRef.current = nextContent;
            setContent(nextContent);
        }
    };

    const isFailed = (res) => !res || res.msg === false;

    // Save new template
    const saveTemplate = async () => {
        try {
        if (!templateName.trim()) return toast.error("Template name is required");
        if (!subject.trim()) return toast.error("Subject is required");
        const latestContent = getEditorContent();
        if (!latestContent.trim()) return toast.error("Content is required");

        setSaving(true);
        const payload = {
            atitle: templateName.trim(),
            asubject: subject.trim(),
            atextEditor: toBase64Utf8(latestContent),
        };

        const res = await xFetch({
            path: "/services/profile/addTemplates",
            method: "POST",
            payload,
        });

        if (isFailed(res)) {
            toast.error("Failed to create template. Please check the content and try again.");
            return;
        }

        toast.success("Template created!");
    
        handleClose();
        fetchTemplates();
        } catch (e) {
        toast.error(e?.message || "Failed to save");
        } finally {
        setSaving(false);
        }
    };

    // Update template
    const updateTemplate = async () => {
        try {
        if (!selectedId) return toast.error("Select a template");
        if (!templateName.trim()) return toast.error("Template name is required");
        if (!subject.trim()) return toast.error("Subject is required");
        const latestContent = getEditorContent();
        if (!latestContent.trim()) return toast.error("Content is required");

        setSaving(true);
        const payload = {
            tid: selectedId,
            tname: templateName.trim(),
            tsub: subject.trim(),
            tcontent: toBase64Utf8(latestContent),
        };

        const res = await xFetch({
            path: "/services/profile/updateTemplates",
            method: "POST",
            payload,
        });

        if (isFailed(res)) {
            toast.error("Failed to update template. Please check the content and try again.");
            return;
        }

        toast.success("Template updated!");
        fetchTemplates();
        } catch (e) {
        toast.error(e?.message || "Update failed");
        } finally {
        setSaving(false);
        }
    };

    // Delete template
    const deleteTemplate = async () => {
        if (!selectedId) return toast.info("Select a template");

        try {
            const res = await xFetch({
            path: "/services/profile/deleteTemplates",
            method: "POST",
            payload: { tid: selectedId },
            });

            if (isFailed(res)) {
                toast.error("Delete failed");
                return;
            }

            toast.success("Template deleted!");
            resetForm();
            fetchTemplates();
            } catch {
            toast.error("Delete failed");
            }
    };

    // ── Render ─────────────────────────────────────────────────
    if (loading) {
        return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <ToastContainer position="top-right" autoClose={3000} />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
            Email Template Manager
            </h2>
            <div className="flex flex-wrap gap-3">
            <button
                onClick={handleOpen}
                className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
            >
                Add Template
            </button>
            <button
                onClick={handleOpenHelper}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
                📌 Show Helper Fields
            </button>
            </div>
        </div>

        {/* Template Selector */}
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Select Template
            </label>
            <select
            value={selectedId}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition shadow-sm"
            >
            <option value="">-- Choose a template --</option>
            {templates.map((temp) => (
                <option key={temp.templateId} value={temp.templateId}>
                {temp.templateName}
                </option>
            ))}
            </select>
        </div>

        {/* Editor Form – shown when template selected */}
        {selectedId && (
            <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Template Name
                </label>
                <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject
                </label>
                <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Content
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                <JoditEditor
                    ref={editorRef}
                    value={content}
                    config={joditConfig320}
                    onBlur={(newContent) => {
                        contentRef.current = newContent || "";
                        setContent(newContent || "");
                    }}
                />
                </div>
            </div>

            <div className="flex flex-wrap gap-4">
                <button
                    onClick={updateTemplate}
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
                >
                {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                onClick={deleteTemplate}
                className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition shadow-sm"
                >
                Delete
                </button>
            </div>
            </div>
        )}

        {/* ── Add Template Modal ──────────────────────────────────────── */}
        {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal content */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-xl font-semibold text-gray-900">
                    Add New Email Template
                </h3>
                <button
                    onClick={handleClose}
                    className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition"
                >
                    <i className="ri-close-line text-2xl"></i>
                </button>
                </div>

                <div className="p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Template Name
                    </label>
                    <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Subject
                    </label>
                    <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Content
                    </label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <JoditEditor
                        ref={editorRef}
                        value={content}
                        config={joditConfig300}
                        onBlur={(newContent) => {
                            contentRef.current = newContent || "";
                            setContent(newContent || "");
                        }}
                    />
                    </div>
                </div>

                <button
                    onClick={saveTemplate}
                    disabled={saving}
                    className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                    {saving ? "Saving..." : "Save Template"}
                </button>
                </div>
            </div>
            </div>
        )}

        {/* ── Helper Fields Modal ─────────────────────────────────────── */}
        {openHelper && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleCloseHelper}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-xl font-semibold text-gray-900">
                    💡 Helper Fields
                </h3>
                <button
                    onClick={handleCloseHelper}
                    className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition"
                >
                    <i className="ri-close-line text-2xl"></i>
                </button>
                </div>

                <div className="p-6 space-y-3">
                {placeholders.map((item) => (
                    <div
                    key={item.key}
                    onClick={() => insertPlaceholder(item.key)}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition group"
                    >
                    <div className="font-mono font-bold text-indigo-700 group-hover:text-indigo-800">
                        {item.key}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{item.label}</div>
                    </div>
                ))}

                <button
                    onClick={handleCloseHelper}
                    className="w-full mt-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                    Close
                </button>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}