"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { xFetch } from "@/utility/xFetch";

const PREVIEW_STYLE_INJECT = `<style>img{max-width:100%;height:auto;}</style>`;
const FULLSCREEN_STYLE_INJECT = `<style>html,body{margin:0;overflow:hidden;}img{max-width:100%;height:auto;}</style>`;
const FULLSCREEN_BASE_WIDTH = 900;

const PLACEHOLDERS = [
  { key: "$companyName", label: "Your company/institute name" },
  { key: "$companyAddress", label: "Your company/institute address" },
  { key: "$receiptNo", label: "Receipt No" },
  { key: "$paymentDate", label: "Payment Date" },
  { key: "$candidateName", label: "Candidate Name" },
  { key: "$candidateMobile", label: "Candidate Mobile" },
  { key: "$trackingId", label: "Candidate Tracking ID" },
  { key: "$installment", label: "Installment" },
  { key: "$logo", label: "Logo" },
  { key: "$parentAddress", label: "Parent Address" },
  { key: "$wordsAmount", label: "Amount in words" },
  { key: "$course", label: "Course" },
  { key: "$amount", label: "Amount" },
  { key: "$paidMethodText", label: "Paid Method" },
  { key: "$refNum", label: "Reference Number" },
  { key: "$agreedAmount", label: "Agreed Amount" },
  { key: "$paid", label: "Paid Amount" },
  { key: "$balance", label: "Balance Amount" },
  { key: "$currencyName", label: "Currency Name" },
  { key: "$currencySymbol", label: "Currency Symbol" },
  { key: "$currencyCode", label: "Currency Code" },
  { key: "$nextPaymentDetails", label: "Next Payment Details" },
  { key: "$gstPercentage", label: "GST Percentage" },
  { key: "$gstAmount", label: "GST Amount" },
  { key: "$discountAmount", label: "Discount On Standard Fee" },
  { key: "$standardFee", label: "Course Fee" },
];

export default function ReceiptTemplate() {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [helperOpen, setHelperOpen] = useState(false);

  const textareaRef = useRef(null);

  const fsContainerRef = useRef(null);
  const fsIframeRef = useRef(null);
  const fsObserverRef = useRef(null);
  const [fsScale, setFsScale] = useState(1);
  const [fsContentHeight, setFsContentHeight] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    fetchTemplate();
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleResize = () => fitFullscreenPreview();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (fsObserverRef.current) {
        fsObserverRef.current.disconnect();
        fsObserverRef.current = null;
      }
    };
  }, [isFullscreen]);

  const fitFullscreenPreview = () => {
    const iframeEl = fsIframeRef.current;
    const containerEl = fsContainerRef.current;
    if (!iframeEl || !containerEl) return;
    try {
      const doc = iframeEl.contentDocument;
      if (!doc || !doc.documentElement) return;
      const target = doc.documentElement;

      iframeEl.style.width = `${FULLSCREEN_BASE_WIDTH}px`;

      const applyScale = () => {
        const contentHeight = target.scrollHeight;
        if (!contentHeight) return;

        const containerWidth = containerEl.clientWidth;
        const containerHeight = containerEl.clientHeight;
        const scale = Math.min(
          containerWidth / FULLSCREEN_BASE_WIDTH,
          containerHeight / contentHeight,
          1
        );

        iframeEl.style.height = `${contentHeight}px`;
        setFsContentHeight(contentHeight);
        setFsScale(scale);
      };

      applyScale();

      if (fsObserverRef.current) fsObserverRef.current.disconnect();
      fsObserverRef.current = new ResizeObserver(applyScale);
      fsObserverRef.current.observe(target);
    } catch (e) {
      // contentDocument not ready yet — onLoad will retry
    }
  };

  const fetchTemplate = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_LEADSTOR_REST}/services/profile/getReceiptTemplates`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const html = await res.text();
      setContent(html || "");
    } catch (e) {
      toast.error("Failed to load receipt template");
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!content.trim()) return toast.error("Receipt content can't be empty");
    try {
      setSaving(true);
      await xFetch({
        path: "/services/profile/updateReceiptTemplates",
        method: "POST",
        payload: { receiptContent: content },
      });
      toast.success("Receipt template updated!");
    } catch (e) {
      toast.error(e?.message || "Failed to save receipt template");
    } finally {
      setSaving(false);
    }
  };

  const insertPlaceholder = (token) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => `${prev}${token}`);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = `${content.slice(0, start)}${token}${content.slice(end)}`;
    setContent(next);
    // Restore focus/cursor after the inserted token on next tick
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + token.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Receipt Template</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setHelperOpen(true)}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            📌 Helper Fields
          </button>
          <button
            onClick={saveTemplate}
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            HTML Source
          </label>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            className="w-full h-[500px] px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Live Preview
            </label>
            <button
              onClick={() => setIsFullscreen(true)}
              className="text-xs px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition"
            >
              Fullscreen
            </button>
          </div>
          <iframe
            srcDoc={`${PREVIEW_STYLE_INJECT}${content}`}
            sandbox="allow-same-origin"
            scrolling="auto"
            className="w-full h-[500px] border border-gray-300 rounded-lg bg-white"
            title="Receipt Preview"
            />
        </div>
      </div>

      {/* Helper Fields modal */}
      {helperOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setHelperOpen(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
            <div className="shrink-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">💡 Helper Fields</h3>
                <button
                onClick={() => setHelperOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition"
                >
                ✕
                </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-3">
                {PLACEHOLDERS.map((item) => (
                <div
                    key={item.key}
                    onClick={() => insertPlaceholder(item.key)}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition group flex items-center justify-between gap-3"
                >
                    <div>
                    <div className="font-mono font-bold text-indigo-700 group-hover:text-indigo-800">
                        {item.key}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{item.label}</div>
                    </div>
                    <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard
                        .writeText(item.key)
                        .then(() => {
                            setCopiedKey(item.key);
                            toast.success(`${item.key} copied`);
                            setTimeout(
                            () => setCopiedKey((prev) => (prev === item.key ? null : prev)),
                            1500
                            );
                        })
                        .catch(() => toast.error("Copy failed"));
                    }}
                    title="Copy to clipboard"
                    className="shrink-0 p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-md transition"
                    >
                    {copiedKey === item.key ? "✅" : "📋"}
                    </button>
                </div>
                ))}
                <button
                onClick={() => setHelperOpen(false)}
                className="w-full mt-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                Close
                </button>
            </div>
            </div>
        </div>
       )}

      {/* Fullscreen preview */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="relative bg-white rounded-xl shadow-2xl w-full h-full max-w-6xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Receipt Preview</h3>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>
            <div
              ref={fsContainerRef}
              className="flex-1 overflow-hidden flex items-center justify-center bg-gray-50"
            >
              <div
                style={{
                  width: FULLSCREEN_BASE_WIDTH * fsScale,
                  height: fsContentHeight * fsScale,
                  overflow: "hidden",
                }}
              >
                <iframe
                    ref={fsIframeRef}
                    srcDoc={`${FULLSCREEN_STYLE_INJECT}${content}`}
                    sandbox="allow-same-origin"
                    scrolling="no"
                    title="Receipt Preview Fullscreen"
                    onLoad={fitFullscreenPreview}
                    style={{ transform: `scale(${fsScale})`, transformOrigin: "top left", border: "none" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}