"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { api, getDocumentUrl } from "@/lib/api-client";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Modal
} from "@/components/ui";
import {
  FlaskConical,
  Plus,
  FileText,
  ExternalLink,
  Upload,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileUp,
  X,
  Search,
  BookOpen,
  Calendar,
  Building,
  UserCheck
} from "lucide-react";

export default function FacultyResearchPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [authors, setAuthors] = useState("");
  const [journal, setJournal] = useState("");
  const [doi, setDoi] = useState("");
  const [keywordsStr, setKeywordsStr] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(null);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document Viewer Modal State
  const [viewingPaper, setViewingPaper] = useState<any | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPapers = async () => {
    try {
      const data = await api.get("/faculty/research-papers");
      setPapers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validExtensions = [".pdf", ".docx", ".doc", ".txt", ".odt"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setUploadError(`Invalid file format '${fileExt}'. Please select a PDF, DOCX, or TXT file.`);
      return;
    }

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("File size exceeds 25 MB. Please select a smaller document.");
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    // Auto-upload file immediately
    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.upload("/faculty/research-papers/upload", formData);
      setUploadedDocUrl(res.file_url);
      setUploadedDocName(file.name);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed to upload document. Please try again.");
      setSelectedFile(null);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setUploadedDocUrl(null);
    setUploadedDocName(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      const kw = keywordsStr
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      // Prefer uploaded document URL, then external URL
      const finalDocUrl = uploadedDocUrl || (externalUrl.trim() ? externalUrl.trim() : null);

      await api.post("/faculty/research-papers", {
        title,
        abstract,
        authors,
        journal,
        doi,
        pdf_url: finalDocUrl,
        keywords_json: kw,
      });

      setShowPublishModal(false);
      // Reset form
      setTitle("");
      setAbstract("");
      setAuthors("");
      setJournal("");
      setDoi("");
      setKeywordsStr("");
      setExternalUrl("");
      removeSelectedFile();
      fetchPapers();
    } catch (e: any) {
      alert(e.message || "Failed to publish research paper");
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredPapers = useMemo(() => {
    if (!searchQuery.trim()) return papers;
    const q = searchQuery.toLowerCase();
    return papers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q) ||
        p.abstract.toLowerCase().includes(q) ||
        (p.keywords || []).some((k: string) => k.toLowerCase().includes(q)) ||
        (p.institution_name || "").toLowerCase().includes(q)
    );
  }, [papers, searchQuery]);

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading research publications...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#4a0817] via-[#631024] to-[#801b33] p-6 text-white shadow-md border border-amber-300/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
              <FlaskConical className="h-3.5 w-3.5" /> Research Discovery Network
            </span>
            <span className="text-xs text-amber-200/80 font-medium">National Open-Access Repository</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Peer-Reviewed Publications & Working Papers</h1>
          <p className="text-xs text-slate-200">
            Publish research papers, attach full manuscripts & PDFs, and enable students, faculty, and industry partners to read and cite your work.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowPublishModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-0 shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Publish Research Paper
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search papers by title, abstract, authors, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
          <span>{filteredPapers.length} Publications</span>
          <span className="h-3 w-px bg-slate-200" />
          <span className="text-emerald-700 font-bold">
            {filteredPapers.filter((p) => p.pdf_url).length} with Full Manuscript
          </span>
        </div>
      </div>

      {/* Publications List */}
      <div className="space-y-4">
        {filteredPapers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No research papers found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? "Try refining your search query." : "Be the first faculty member to publish a paper with full manuscript!"}
            </p>
          </div>
        ) : (
          filteredPapers.map((p) => {
            const hasDocument = Boolean(p.pdf_url);
            const docFullUrl = hasDocument ? getDocumentUrl(p.pdf_url) : "";

            return (
              <Card key={p.id} className="hover:border-[#801b33]/40 transition border-slate-200 shadow-xs overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="gov">{p.status || "PUBLISHED"}</Badge>
                      {hasDocument ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Full Manuscript Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          Abstract Only
                        </span>
                      )}
                    </div>

                    {p.doi && (
                      <span className="text-[11px] font-mono text-blue-600 font-medium hover:underline">
                        DOI: {p.doi}
                      </span>
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 leading-snug">{p.title}</h3>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      {p.authors} • <span className="text-slate-500">{p.journal || "Peer-Reviewed Proceedings"}</span>
                      {p.publication_date && (
                        <span className="text-slate-400 ml-2">
                          ({new Date(p.publication_date).getFullYear()})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Abstract */}
                  <p className="text-xs text-slate-600 leading-relaxed max-w-4xl bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {p.abstract}
                  </p>

                  {/* Keywords & Affiliation */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <div className="flex flex-wrap gap-1">
                      {(p.keywords || []).map((k: string) => (
                        <span key={k} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          #{k}
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Affiliation: <strong>{p.institution_name}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Document View & Download Action Toolbar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#fdf2f4]/60 to-white -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
                    <div className="flex items-center gap-2">
                      {hasDocument ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setViewingPaper(p)}
                            className="bg-[#801b33] hover:bg-[#631024] text-white font-bold"
                          >
                            <Eye className="h-4 w-4 mr-1.5" /> Read Full Paper
                          </Button>

                          <a
                            href={docFullUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition"
                          >
                            <Download className="h-3.5 w-3.5 text-slate-500" /> Download Document
                          </a>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" /> Author has not uploaded document manuscript yet.
                        </span>
                      )}
                    </div>

                    {p.doi && (
                      <a
                        href={`https://doi.org/${p.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        External DOI Link <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. PUBLISH RESEARCH PAPER MODAL WITH DOCUMENT UPLOADER                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => {
          setShowPublishModal(false);
          removeSelectedFile();
        }}
        title="Publish Research Paper & Upload Document"
        description="Index your peer-reviewed manuscript or technical report in the national research network so students, faculty, and industry can read and cite it."
        maxWidth="2xl"
      >
        <form onSubmit={handlePublish} className="space-y-4 pt-2">
          <Input
            label="Paper Title"
            placeholder="e.g. Resilient Fault-Tolerance in Distributed Microservice Architectures"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="Authors (Comma separated)"
            placeholder="e.g. Dr. Rajesh Sharma, K. Narayanan, Vikramaditya Sen"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Abstract <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Provide a comprehensive summary of the problem, empirical methodology, evaluation benchmarks, and outcomes..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-[#801b33] focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Journal / Conference Name"
              placeholder="e.g. IEEE Transactions on Cloud Computing"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
            />
            <Input
              label="DOI (Digital Object Identifier)"
              placeholder="e.g. 10.1109/TCC.2025.1092817"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
            />
          </div>

          <Input
            label="Keywords (Comma separated)"
            placeholder="e.g. Distributed Systems, Fault Tolerance, Cloud Computing, Kubernetes"
            value={keywordsStr}
            onChange={(e) => setKeywordsStr(e.target.value)}
          />

          {/* ================= DOCUMENT UPLOAD SECTION ================= */}
          <div className="rounded-xl border-2 border-dashed border-slate-300 p-4 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileUp className="h-4 w-4 text-[#801b33]" /> Upload Full Paper Document (.pdf, .docx, .txt)
              </label>
              <span className="text-[10px] text-slate-500 font-medium">Max 25 MB</span>
            </div>

            {uploadedDocUrl ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-950 truncate max-w-sm">
                      {uploadedDocName || "Document Uploaded"}
                    </p>
                    <p className="text-[11px] text-emerald-700">Document ready for publication & online viewing</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeSelectedFile}
                  className="text-slate-400 hover:text-red-600 p-1 transition"
                  title="Remove document"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.txt,.odt"
                  className="hidden"
                  id="paper-file-upload"
                />
                <label
                  htmlFor="paper-file-upload"
                  className={`cursor-pointer flex flex-col items-center justify-center p-5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#801b33]/40 transition text-center ${
                    isUploadingFile ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <Upload className="h-6 w-6 text-[#801b33] mb-1.5 animate-bounce" />
                  <span className="text-xs font-bold text-slate-800">
                    {isUploadingFile ? "Uploading document to server..." : "Click to select or drop research document"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Supports Adobe PDF, Microsoft Word (.docx), or OpenDocument (.odt)
                  </span>
                </label>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1 pt-1">
                <AlertCircle className="h-3.5 w-3.5" /> {uploadError}
              </p>
            )}

            <div className="pt-2">
              <p className="text-[11px] text-slate-400 font-medium">Or provide hosted PDF / arXiv URL:</p>
              <Input
                placeholder="https://arxiv.org/pdf/2401.00000.pdf"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="text-xs mt-1"
                disabled={Boolean(uploadedDocUrl)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setShowPublishModal(false);
                removeSelectedFile();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isPublishing || isUploadingFile}
              className="bg-[#801b33] hover:bg-[#631024] text-white font-bold"
            >
              Publish & Share Research
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. IN-APP RESEARCH DOCUMENT / PDF VIEWER MODAL                            */}
      {/* ========================================================================= */}
      {viewingPaper && (
        <Modal
          isOpen={Boolean(viewingPaper)}
          onClose={() => setViewingPaper(null)}
          title={viewingPaper.title}
          description={`${viewingPaper.authors} • ${viewingPaper.journal || "Peer-Reviewed Publication"} • ${viewingPaper.institution_name}`}
          maxWidth="5xl"
        >
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#801b33] text-white font-bold text-xs flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Document Reader
                </span>
                {viewingPaper.doi && (
                  <span className="text-xs font-mono text-slate-600 font-medium">
                    DOI: {viewingPaper.doi}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={getDocumentUrl(viewingPaper.pdf_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-blue-600" /> Open in New Tab
                </a>

                <a
                  href={getDocumentUrl(viewingPaper.pdf_url)}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition"
                >
                  <Download className="h-3.5 w-3.5 text-amber-400" /> Download Manuscript
                </a>
              </div>
            </div>

            {/* Embedded Document Frame */}
            <div className="w-full h-[68vh] rounded-xl border border-slate-300 bg-slate-100 overflow-hidden shadow-inner relative">
              <iframe
                src={getDocumentUrl(viewingPaper.pdf_url)}
                title={viewingPaper.title}
                className="w-full h-full border-0"
              />
              <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 bg-white/90 px-2 py-0.5 rounded shadow-xs pointer-events-none">
                SETU Document Viewer
              </div>
            </div>

            {/* Footer Abstract / Info */}
            <div className="text-xs text-slate-600 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
              <strong className="text-slate-900 font-bold">Abstract: </strong>
              <span>{viewingPaper.abstract}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
