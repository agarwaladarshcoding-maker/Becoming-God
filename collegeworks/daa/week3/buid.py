"""
Builds the final PDF report:
    - Title page
    - Q1, Q2, Q3, Q4 sections, each with:
        * Theory / explanation
        * Full commented C++ source (syntax highlighted, monospace)
        * Output screenshots for multiple test inputs
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Image,
                                 PageBreak, Table, TableStyle, HRFlowable,
                                 KeepTogether, ListFlowable, ListItem)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image as PILImage

BASE = "/home/claude/heap_project"
SCREENSHOT_DIR = os.path.join(BASE, "screenshots")
OUT_PDF = "/mnt/user-data/outputs/Binary_Heap_Operations_Report.pdf"

# ---------------- Fonts ----------------
pdfmetrics.registerFont(TTFont("DejaVuMono", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuMono-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSans", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSans-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))

PAGE_W, PAGE_H = A4
MARGIN = 0.7 * inch
CONTENT_W = PAGE_W - 2 * MARGIN

styles = getSampleStyleSheet()

title_style = ParagraphStyle("TitleStyle", fontName="DejaVuSans-Bold", fontSize=24,
                              leading=30, alignment=TA_CENTER, textColor=colors.HexColor("#1a1a2e"))
subtitle_style = ParagraphStyle("SubtitleStyle", fontName="DejaVuSans", fontSize=13,
                                 leading=18, alignment=TA_CENTER, textColor=colors.HexColor("#444"))
section_style = ParagraphStyle("SectionStyle", fontName="DejaVuSans-Bold", fontSize=17,
                                leading=22, spaceBefore=6, spaceAfter=10,
                                textColor=colors.white, backColor=colors.HexColor("#2b2d5e"),
                                leftIndent=8, borderPadding=(6, 6, 6, 6))
subsection_style = ParagraphStyle("SubsectionStyle", fontName="DejaVuSans-Bold", fontSize=12.5,
                                   leading=16, spaceBefore=10, spaceAfter=6,
                                   textColor=colors.HexColor("#1a1a2e"))
body_style = ParagraphStyle("BodyStyle", fontName="DejaVuSans", fontSize=10.3,
                             leading=15, alignment=TA_JUSTIFY, spaceAfter=6)
bullet_style = ParagraphStyle("BulletStyle", fontName="DejaVuSans", fontSize=10.3,
                               leading=14.5, leftIndent=14, spaceAfter=3)
code_title_style = ParagraphStyle("CodeTitle", fontName="DejaVuMono-Bold", fontSize=10,
                                   leading=13, textColor=colors.HexColor("#eaeaea"),
                                   backColor=colors.HexColor("#1e1e1e"), leftIndent=6,
                                   borderPadding=(4, 4, 4, 4))
caption_style = ParagraphStyle("CaptionStyle", fontName="DejaVuSans", fontSize=9,
                                leading=12, alignment=TA_CENTER, textColor=colors.HexColor("#555"),
                                spaceBefore=3, spaceAfter=14)
toc_style = ParagraphStyle("TOCStyle", fontName="DejaVuSans", fontSize=11.5, leading=20,
                            leftIndent=10)


def code_block(code_text, font_size=7.6, leading=9.6):
    """Render source code as a Table with a dark background, monospace font,
    manual syntax-ish coloring kept simple (single color) for reliability."""
    lines = code_text.split("\n")
    data = []
    for i, line in enumerate(lines, start=1):
        line = line.replace("\t", "    ")
        data.append([str(i), line])

    t = Table(data, colWidths=[0.34 * inch, CONTENT_W - 0.34 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "DejaVuMono"),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("LEADING", (0, 0), (-1, -1), leading),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#1e1e1e")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#6a6a6a")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#d4d4d4")),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 0.4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0.4),
        ("LEFTPADDING", (0, 0), (0, -1), 2),
        ("RIGHTPADDING", (0, 0), (0, -1), 6),
        ("LEFTPADDING", (1, 0), (1, -1), 4),
    ]))
    return t


def screenshot_flowable(png_path, caption, max_width=CONTENT_W * 0.92):
    """Scale screenshot to fit page width, splitting into a bordered image."""
    with PILImage.open(png_path) as im:
        w, h = im.size
    scale = min(max_width / w, 1.0)
    disp_w = w * scale
    disp_h = h * scale

    # Cap height to something reasonable per single flow; ReportLab will
    # paginate long images awkwardly, so we cap max height and let width
    # scale down further if the image is very tall.
    max_height = 9.2 * inch
    if disp_h > max_height:
        scale2 = max_height / disp_h
        disp_w *= scale2
        disp_h = max_height

    img = Image(png_path, width=disp_w, height=disp_h)
    cap = Paragraph(caption, caption_style)
    return KeepTogether([img, cap])


def read_file(path):
    with open(path, "r") as f:
        return f.read()


def build_pdf():
    doc = SimpleDocTemplate(OUT_PDF, pagesize=A4,
                             leftMargin=MARGIN, rightMargin=MARGIN,
                             topMargin=0.75 * inch, bottomMargin=0.7 * inch,
                             title="Binary Heap Operations - Lab Report",
                             author="Data Structures Lab")
    story = []

    # ============ TITLE PAGE ============
    story.append(Spacer(1, 1.6 * inch))
    story.append(Paragraph("Binary Heap Operations", title_style))
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("Extract-Min/Max &bull; Heap Sort &bull; Decrease/Increase-Key &bull; Delete Node",
                            subtitle_style))
    story.append(Spacer(1, 0.4 * inch))
    story.append(HRFlowable(width="70%", thickness=1.2, color=colors.HexColor("#2b2d5e"),
                             hAlign="CENTER", spaceAfter=0.3 * inch))

    overview_text = """
    This report presents C/C++ implementations of four classical binary-heap
    operations, built entirely from first principles using plain arrays &mdash;
    <b>no inbuilt heap library functions</b> (such as STL's <font name="DejaVuMono">priority_queue</font>,
    <font name="DejaVuMono">make_heap</font>, <font name="DejaVuMono">push_heap</font>, or
    <font name="DejaVuMono">pop_heap</font>) are used anywhere. Every operation
    &mdash; insertion, extraction, heapify-up, heapify-down, sorting, key
    updates, and arbitrary-node deletion &mdash; is implemented manually.
    """
    story.append(Paragraph(overview_text, ParagraphStyle(
        "OverviewStyle", fontName="DejaVuSans", fontSize=10.6, leading=16,
        alignment=TA_JUSTIFY, textColor=colors.HexColor("#333"))))

    story.append(Spacer(1, 0.35 * inch))
    toc_data = [
        ["Q1", "Binary Heap &mdash; Extract-Min / Extract-Max"],
        ["Q2", "Binary Heap Sort (built by modifying Q1)"],
        ["Q3", "Binary Heap &mdash; Decrease-Key / Increase-Key"],
        ["Q4", "Delete any particular node 'i' in a Heap"],
    ]
    toc_table_data = [[Paragraph(f"<b>{a}</b>", toc_style), Paragraph(b, toc_style)] for a, b in toc_data]
    toc_table = Table(toc_table_data, colWidths=[0.7 * inch, CONTENT_W - 0.7 * inch])
    toc_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, colors.HexColor("#ccc")),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f4f4fa")),
        ("LEFTPADDING", (0, 0), (0, -1), 14),
    ]))
    story.append(toc_table)

    story.append(Spacer(1, 0.5 * inch))
    notes_text = """
    <b>Implementation notes common to all four programs:</b>
    """
    story.append(Paragraph(notes_text, body_style))
    notes = [
        "Heaps are represented as plain C-style arrays (complete binary tree encoding): "
        "for a node at index i, parent = (i-1)/2, left child = 2i+1, right child = 2i+2.",
        "Both Min-Heap and Max-Heap variants are supported at runtime via a single flag (isMinHeap), "
        "so the same core logic (heapifyUp / heapifyDown) drives both.",
        "All programs are menu-driven so multiple operations / inputs can be tested interactively "
        "in one run, as shown in the output screenshots.",
        "Each program echoes back what was typed at each prompt (readInt() helper) purely so that "
        "the terminal transcripts captured for this report are fully readable; the underlying logic "
        "is unaffected.",
        "No STL heap/sort utilities, no <algorithm> heap functions, and no library sort() calls are "
        "used anywhere &mdash; only cin/cout for I/O.",
    ]
    story.append(ListFlowable(
        [ListItem(Paragraph(n, bullet_style), leftIndent=6, bulletColor=colors.HexColor("#2b2d5e"))
         for n in notes],
        bulletType="bullet", start="circle"))

    story.append(PageBreak())

    # ============ Q1 SECTION ============
    story.append(Paragraph("Q1 &mdash; Binary Heap: Extract-Min / Extract-Max", section_style))

    q1_theory = """
    A <b>Binary Heap</b> is a complete binary tree stored in an array that satisfies
    the <b>heap-order property</b>: in a Min-Heap, every parent is &le; its children
    (so the minimum is always at the root); in a Max-Heap, every parent is &ge; its
    children (so the maximum is always at the root).
    """
    story.append(Paragraph(q1_theory, body_style))

    story.append(Paragraph("Key operations implemented:", subsection_style))
    q1_ops = [
        "<b>insert(key):</b> place the new key at the end of the array (size), then "
        "\"bubble up\" (heapifyUp) &mdash; repeatedly swap with the parent while the "
        "heap-order property is violated. O(log n).",
        "<b>extract():</b> the root (index 0) holds the min/max. Save it, move the "
        "<i>last</i> element of the array into the root position, shrink the heap size "
        "by 1, then \"bubble down\" (heapifyDown) &mdash; repeatedly swap with the smaller "
        "(Min-Heap) or larger (Max-Heap) child until the property is restored. O(log n).",
        "<b>peek():</b> simply returns arr[0] without modifying the heap. O(1).",
    ]
    story.append(ListFlowable(
        [ListItem(Paragraph(o, bullet_style), leftIndent=6) for o in q1_ops],
        bulletType="bullet", start="circle"))

    story.append(Paragraph("Complexity: Insert O(log n) &nbsp;|&nbsp; Extract-Min/Max O(log n) "
                            "&nbsp;|&nbsp; Peek O(1) &nbsp;|&nbsp; Space O(n)", body_style))

    story.append(Paragraph("Source Code &mdash; Q1_extract_min_max.cpp", subsection_style))
    story.append(code_block(read_file(os.path.join(BASE, "Q1_extract_min_max.cpp"))))

    story.append(PageBreak())
    story.append(Paragraph("Sample Output &mdash; Test Run 1 (Min-Heap)", subsection_style))
    story.append(Paragraph(
        "Elements 40, 20, 10, 50, 5 are inserted one at a time (heap self-adjusts after each "
        "insert), the heap is displayed, and then Extract-Min is called repeatedly &mdash; note "
        "the values come out in increasing order: 5, 10, 20, ...", body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q1_minheap.png"),
                                      "Fig. Q1.1 &ndash; Min-Heap insert and Extract-Min sequence"))

    story.append(Paragraph("Sample Output &mdash; Test Run 2 (Max-Heap)", subsection_style))
    story.append(Paragraph(
        "The same program run with the Max-Heap option: elements 15, 70, 30, 25, 90 are "
        "inserted, and Extract-Max returns values in decreasing order: 90, 70, 30, ...", body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q1_maxheap.png"),
                                      "Fig. Q1.2 &ndash; Max-Heap insert and Extract-Max sequence"))

    story.append(PageBreak())

    # ============ Q2 SECTION ============
    story.append(Paragraph("Q2 &mdash; Binary Heap Sort [Modifying Q1]", section_style))

    q2_theory = """
    <b>Heap Sort</b> reuses exactly the same heapifyDown logic from Q1, adding two
    ideas on top of it:
    """
    story.append(Paragraph(q2_theory, body_style))
    q2_ops = [
        "<b>buildHeap():</b> converts an arbitrary unsorted array into a valid heap in "
        "O(n) time by calling heapifyDown on every non-leaf node, starting from the last "
        "internal node (index n/2 - 1) down to the root (index 0).",
        "<b>heapSort():</b> repeatedly performs the same action as Q1's extract() &mdash; "
        "take the root (largest for ascending / smallest for descending) and move it out of "
        "the active heap region &mdash; but instead of discarding it, it is swapped into the "
        "now-freed last slot of the array. The active heap size shrinks by 1 each iteration "
        "and heapifyDown restores order on the smaller heap. After n-1 iterations the array "
        "is fully sorted.",
    ]
    story.append(ListFlowable(
        [ListItem(Paragraph(o, bullet_style), leftIndent=6) for o in q2_ops],
        bulletType="bullet", start="circle"))
    story.append(Paragraph(
        "To sort <b>ascending</b>, a Max-Heap is built internally (largest element is "
        "repeatedly moved to the end). To sort <b>descending</b>, a Min-Heap is built "
        "internally (smallest element is repeatedly moved to the end).", body_style))
    story.append(Paragraph("Complexity: Build-heap O(n), overall Heap Sort O(n log n), "
                            "in-place &rarr; Space O(1) extra.", body_style))

    story.append(Paragraph("Source Code &mdash; Q2_heap_sort.cpp", subsection_style))
    story.append(code_block(read_file(os.path.join(BASE, "Q2_heap_sort.cpp"))))

    story.append(PageBreak())
    story.append(Paragraph("Sample Output &mdash; Test Run 1 (Ascending)", subsection_style))
    story.append(Paragraph(
        "Input array: 5 2 9 1 5 6 3 8 &rarr; sorted using an internally-built Max-Heap.", body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q2_ascending.png"),
                                      "Fig. Q2.1 &ndash; Heap Sort, ascending order"))

    story.append(Paragraph("Sample Output &mdash; Test Run 2 (Descending)", subsection_style))
    story.append(Paragraph(
        "Input array: 12 4 7 1 20 9 3 &rarr; sorted using an internally-built Min-Heap.", body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q2_descending.png"),
                                      "Fig. Q2.2 &ndash; Heap Sort, descending order"))

    story.append(PageBreak())

    # ============ Q3 SECTION ============
    story.append(Paragraph("Q3 &mdash; Binary Heap: Decrease-Key / Increase-Key", section_style))

    q3_theory = """
    Given the <b>index</b> of a node in the heap array, Decrease-Key / Increase-Key
    changes its value and restores the heap property in O(log n) &mdash; this is the
    core primitive used inside algorithms like Dijkstra's and Prim's.
    """
    story.append(Paragraph(q3_theory, body_style))

    story.append(Paragraph("Direction logic:", subsection_style))
    q3_table_data = [
        [Paragraph("<b>Operation</b>", bullet_style), Paragraph("<b>Min-Heap</b>", bullet_style),
         Paragraph("<b>Max-Heap</b>", bullet_style)],
        [Paragraph("Decrease-Key", bullet_style), Paragraph("heapifyUp (may violate with parent)", bullet_style),
         Paragraph("heapifyDown (may violate with children)", bullet_style)],
        [Paragraph("Increase-Key", bullet_style), Paragraph("heapifyDown (may violate with children)", bullet_style),
         Paragraph("heapifyUp (may violate with parent)", bullet_style)],
    ]
    q3_table = Table(q3_table_data, colWidths=[1.3 * inch, CONTENT_W / 2 - 0.5 * inch, CONTENT_W / 2 - 0.5 * inch])
    q3_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2b2d5e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#bbb")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f4fa")]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(q3_table)
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "The program also validates the input: a decrease-key call must supply a strictly "
        "smaller value than the current one (and increase-key a strictly larger value); "
        "otherwise the operation is rejected with a message. "
        "Complexity: O(log n) per call.", body_style))

    story.append(Paragraph("Source Code &mdash; Q3_decrease_increase_key.cpp", subsection_style))
    story.append(code_block(read_file(os.path.join(BASE, "Q3_decrease_increase_key.cpp"))))

    story.append(PageBreak())
    story.append(Paragraph("Sample Output &mdash; Min-Heap: Decrease-Key", subsection_style))
    story.append(Paragraph(
        "Heap built from 10 15 20 17 25 30. Decrease-Key at index 2 (value 20 &rarr; 5) "
        "makes the node smaller than its parent, so it bubbles up and becomes the new root.",
        body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q3_minheap_decrease.png"),
                                      "Fig. Q3.1 &ndash; Min-Heap Decrease-Key (bubbles up)"))

    story.append(Paragraph("Sample Output &mdash; Min-Heap: Increase-Key", subsection_style))
    story.append(Paragraph(
        "Same initial heap. Increase-Key at index 0 (root, value 10 &rarr; 40) makes it "
        "larger than its children, so it sinks down.", body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q3_minheap_increase.png"),
                                      "Fig. Q3.2 &ndash; Min-Heap Increase-Key (sinks down)"))

    story.append(PageBreak())
    story.append(Paragraph("Sample Output &mdash; Max-Heap: Decrease-Key", subsection_style))
    story.append(Paragraph(
        "Heap built from 50 30 40 10 20 5. Decrease-Key at the root (index 0, 50 &rarr; 2) "
        "sinks down since it is now smaller than its children.", body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q3_maxheap_decrease.png"),
                                      "Fig. Q3.3 &ndash; Max-Heap Decrease-Key (sinks down)"))

    story.append(Paragraph("Sample Output &mdash; Max-Heap: Increase-Key", subsection_style))
    story.append(Paragraph(
        "Same initial heap. Increase-Key at a leaf (index 5, value 5 &rarr; 60) bubbles up "
        "since it is now larger than its ancestors.", body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q3_maxheap_increase.png"),
                                      "Fig. Q3.4 &ndash; Max-Heap Increase-Key (bubbles up)"))

    story.append(PageBreak())
    story.append(Paragraph("Sample Output &mdash; Input Validation", subsection_style))
    story.append(Paragraph(
        "Attempting Decrease-Key with a new value that is NOT smaller than the current value "
        "is correctly rejected without modifying the heap.", body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q3_invalid_validation.png"),
                                      "Fig. Q3.5 &ndash; Invalid decrease-key attempt is rejected"))

    story.append(PageBreak())

    # ============ Q4 SECTION ============
    story.append(Paragraph("Q4 &mdash; Delete Any Particular Node 'i' in Min-Heap / Max-Heap", section_style))

    q4_theory = """
    Unlike Extract-Min/Max (which always removes the <b>root</b>), this operation must
    delete the node at an <b>arbitrary index i</b>, which may be anywhere in the tree
    &mdash; root, internal node, or leaf.
    """
    story.append(Paragraph(q4_theory, body_style))

    story.append(Paragraph("Algorithm:", subsection_style))
    q4_steps = [
        "Validate that index i is within range [0, size-1].",
        "<b>Special case:</b> if i is already the last element of the array, simply "
        "shrink the heap size by 1 &mdash; no heapify needed.",
        "<b>General case:</b> copy the <i>last</i> element of the array into position i, "
        "then shrink the heap size by 1 (the old last slot is dropped).",
        "The value now sitting at index i could violate the heap property either "
        "<i>upward</i> (with its parent) or <i>downward</i> (with its children) &mdash; but "
        "never both at once. So the program checks against the parent first: if it "
        "violates order there, heapifyUp(i) is called; otherwise heapifyDown(i) is called. "
        "Exactly one of the two will actually perform any swaps.",
    ]
    story.append(ListFlowable(
        [ListItem(Paragraph(s, bullet_style), leftIndent=6) for s in q4_steps],
        bulletType="bullet", start="circle"))
    story.append(Paragraph("Complexity: O(log n) per deletion (dominated by the heapify call).",
                            body_style))

    story.append(Paragraph("Source Code &mdash; Q4_delete_node.cpp", subsection_style))
    story.append(code_block(read_file(os.path.join(BASE, "Q4_delete_node.cpp"))))

    story.append(PageBreak())
    story.append(Paragraph("Sample Output &mdash; Min-Heap: Delete a Middle Node", subsection_style))
    story.append(Paragraph(
        "Heap built from 10 15 20 17 25 30 22 &rarr; array form "
        "[0:10] [1:15] [2:20] [3:17] [4:25] [5:30] [6:22]. Deleting the node at index 2 "
        "(value 20, not the root) replaces it with the last element (22); no further "
        "heapify swap is required since 22 is already valid there.", body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q4_minheap_middle.png"),
                                      "Fig. Q4.1 &ndash; Deleting a non-root (middle) node"))

    story.append(Paragraph("Sample Output &mdash; Min-Heap: Delete the Root Node", subsection_style))
    story.append(Paragraph(
        "Same initial heap. Deleting index 0 (the root, value 10) behaves like a "
        "standard Extract-Min &mdash; the last element (22) takes its place and then "
        "sinks down to its correct position.", body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q4_minheap_root.png"),
                                      "Fig. Q4.2 &ndash; Deleting the root node"))

    story.append(PageBreak())
    story.append(Paragraph("Sample Output &mdash; Min-Heap: Delete the Last Node", subsection_style))
    story.append(Paragraph(
        "Same initial heap. Deleting index 6 (already the last array position, value 22) "
        "hits the special case &mdash; the element is simply dropped with no heapify call.",
        body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q4_minheap_last.png"),
                                      "Fig. Q4.3 &ndash; Deleting the last element (special case)"))

    story.append(Paragraph("Sample Output &mdash; Max-Heap: Delete a Middle Node", subsection_style))
    story.append(Paragraph(
        "Heap built from 50 30 40 10 20 5 35. Deleting index 1 (value 30) replaces it "
        "with the last element (35); since 35 &gt; its new children, no swap is needed "
        "in this particular case, and the deletion completes correctly.", body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q4_maxheap_middle.png"),
                                      "Fig. Q4.4 &ndash; Deleting a non-root node from a Max-Heap"))

    story.append(PageBreak())
    story.append(Paragraph("Sample Output &mdash; Invalid Index Handling", subsection_style))
    story.append(Paragraph(
        "Attempting to delete index 9 from a 4-element heap (valid range 0&ndash;3) is "
        "correctly rejected with an error message, and the heap remains unchanged.",
        body_style))
    story.append(screenshot_flowable(os.path.join(SCREENSHOT_DIR, "Q4_invalid.png"),
                                      "Fig. Q4.5 &ndash; Out-of-range index is rejected"))

    doc.build(story)
    print(f"PDF written to {OUT_PDF}")


if __name__ == "__main__":
    build_pdf()