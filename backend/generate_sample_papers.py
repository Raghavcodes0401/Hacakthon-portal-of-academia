#!/usr/bin/env python3
"""
Generate sample PDF papers in backend/uploads and link them to existing papers in the database.
"""
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from app.core.database import SessionLocal
from app.models import ResearchPaper

def create_sample_pdf(filepath: str, title: str, authors: str, journal: str, abstract: str, sections: list):
    """
    Creates a clean, valid PDF file using pure Python PDF specification.
    """
    # PDF stream building
    lines = []
    lines.append("BT")
    lines.append("/F1 18 Tf")
    lines.append("50 740 Td")
    lines.append(f"({title[:60]}) Tj")
    lines.append("ET")

    if len(title) > 60:
        lines.append("BT")
        lines.append("/F1 18 Tf")
        lines.append("50 718 Td")
        lines.append(f"({title[60:120]}) Tj")
        lines.append("ET")

    lines.append("BT")
    lines.append("/F2 11 Tf")
    lines.append("50 685 Td")
    lines.append(f"(Authors: {authors}) Tj")
    lines.append("ET")

    lines.append("BT")
    lines.append("/F2 10 Tf")
    lines.append("50 668 Td")
    lines.append(f"(Publication: {journal}) Tj")
    lines.append("ET")

    # Horizontal rule
    lines.append("50 655 m 550 655 l S")

    # Abstract Header
    lines.append("BT")
    lines.append("/F1 12 Tf")
    lines.append("50 635 Td")
    lines.append("(ABSTRACT) Tj")
    lines.append("ET")

    # Abstract Body
    y = 615
    words = abstract.split()
    chunk = []
    for w in words:
        chunk.append(w)
        if len(" ".join(chunk)) > 75:
            lines.append("BT")
            lines.append("/F2 10 Tf")
            lines.append(f"50 {y} Td")
            text = " ".join(chunk).replace("(", "[").replace(")", "]")
            lines.append(f"({text}) Tj")
            lines.append("ET")
            y -= 15
            chunk = []
    if chunk:
        lines.append("BT")
        lines.append("/F2 10 Tf")
        lines.append(f"50 {y} Td")
        text = " ".join(chunk).replace("(", "[").replace(")", "]")
        lines.append(f"({text}) Tj")
        lines.append("ET")
        y -= 25

    # Sections
    for sec_title, sec_body in sections:
        lines.append("BT")
        lines.append("/F1 12 Tf")
        lines.append(f"50 {y} Td")
        lines.append(f"({sec_title}) Tj")
        lines.append("ET")
        y -= 18

        sec_words = sec_body.split()
        chunk = []
        for w in sec_words:
            chunk.append(w)
            if len(" ".join(chunk)) > 78:
                lines.append("BT")
                lines.append("/F2 9.5 Tf")
                lines.append(f"50 {y} Td")
                text = " ".join(chunk).replace("(", "[").replace(")", "]")
                lines.append(f"({text}) Tj")
                lines.append("ET")
                y -= 14
                chunk = []
        if chunk:
            lines.append("BT")
            lines.append("/F2 9.5 Tf")
            lines.append(f"50 {y} Td")
            text = " ".join(chunk).replace("(", "[").replace(")", "]")
            lines.append(f"({text}) Tj")
            lines.append("ET")
            y -= 22

    # Footer
    lines.append("BT")
    lines.append("/F2 8 Tf")
    lines.append("50 40 Td")
    lines.append("(SETU - National Academic & Research Digital Union Repository - Govt. of India) Tj")
    lines.append("ET")

    content_stream = "\n".join(lines)
    content_bytes = content_stream.encode("latin1", errors="replace")
    stream_len = len(content_bytes)

    objects = []
    # 1: Catalog
    objects.append("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    # 2: Pages
    objects.append("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n")
    # 3: Page
    objects.append(
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        "/Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj\n"
    )
    # 4: Stream
    objects.append(f"4 0 obj << /Length {stream_len} >>\nstream\n{content_stream}\nendstream\nendobj\n")
    # 5: Bold Font
    objects.append("5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n")
    # 6: Regular Font
    objects.append("6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n")

    # Calculate offsets
    pdf_parts = ["%PDF-1.4\n"]
    offsets = [0]
    curr_len = len(pdf_parts[0])

    for obj in objects:
        offsets.append(curr_len)
        pdf_parts.append(obj)
        curr_len += len(obj.encode("latin1"))

    xref_start = curr_len
    xref = f"xref\n0 {len(offsets)}\n0000000000 65535 f \n"
    for off in offsets[1:]:
        xref += f"{off:010d} 00000 n \n"
    pdf_parts.append(xref)

    trailer = f"trailer << /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n"
    pdf_parts.append(trailer)

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "wb") as f:
        f.write("".join(pdf_parts).encode("latin1"))

def main():
    uploads_dir = os.path.join(backend_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    db = SessionLocal()
    try:
        papers = db.query(ResearchPaper).all()
        for p in papers:
            filename = f"sample_paper_{p.id[:8]}.pdf"
            filepath = os.path.join(uploads_dir, filename)
            
            sections = [
                ("1. INTRODUCTION", "Modern cloud-native systems and transformer architectures require stringent verification, fault isolation, and reproducible evaluation benchmarks across national computational grids."),
                ("2. SYSTEM ARCHITECTURE & METHODOLOGY", "Our empirical evaluation framework deploys automated telemetry probes, tracking p99 request latencies, gradient throughput, and memory pressure during high concurrency stress testing."),
                ("3. EXPERIMENTAL RESULTS", "Across 10,000 synthetic request iterations, our method demonstrated superior stability, achieving an overall 43 percent decrease in tail latency and 94 percent model fidelity on benchmark datasets."),
                ("4. CONCLUSION & FUTURE WORK", "We established an open-source baseline for researchers across national academic institutions. Future extensions will incorporate federated edge telemetry and multi-modal distillation.")
            ]

            create_sample_pdf(
                filepath=filepath,
                title=p.title,
                authors=p.authors,
                journal=p.journal or "National Peer-Reviewed Publication",
                abstract=p.abstract,
                sections=sections
            )
            p.pdf_url = f"/uploads/{filename}"
            print(f"Generated PDF for paper '{p.title[:40]}...' at {p.pdf_url}")

        db.commit()
        print("Updated research papers with valid downloadable PDF files.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
