# -*- coding: utf-8 -*-
"""
Builds "project status.pdf" for KNZiN (executive status report, strictly 2 pages).

Run:  python scripts/build_status_pdf.py

Layout contract enforced here
-----------------------------
* exactly two pages, never a third (explicit PageBreak between the stories)
* every glyph inside the 36pt print margins, including the footer furniture
* grids carry a real gutter COLUMN and an explicit empty cell for it, plus
  hAlign='LEFT' so ReportLab can never centre a narrow table off-page
* badges are single-line pills sized from real font metrics
* Arabic runs (multi-word, spaces and Arabic punctuation included) are reshaped
  and bidi-reversed as ONE unit, so phrase word order renders right-to-left
* every nested table declares a width that fits inside its parent's padding
"""
import os
import re
import shutil
import time

import arabic_reshaper
from bidi.algorithm import get_display

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Flowable, Frame, PageBreak,
                                PageTemplate, Paragraph, Spacer, Table,
                                TableStyle)

# --------------------------------------------------------------------------- #
# Paths
# --------------------------------------------------------------------------- #
ROOT = r"D:\Work Projects\Knzin Project"
OUT_DIR = os.path.join(ROOT, "Project info")
OUT_NAMES = [os.path.join(OUT_DIR, "project status.pdf"),
             os.path.join(ROOT, "project status.pdf")]

# --------------------------------------------------------------------------- #
# Palette (KNZiN)
# --------------------------------------------------------------------------- #
BLUE = colors.HexColor("#1877F2")
BLUE_D = colors.HexColor("#0B5BC0")
SLATE = colors.HexColor("#0F172A")
GRAY = colors.HexColor("#64748B")
LINE = colors.HexColor("#E2E8F0")
GOLD = colors.HexColor("#D97706")
AMBER = colors.HexColor("#F59E0B")
GREEN = colors.HexColor("#059669")
BLUE_BG = colors.HexColor("#EFF6FF")
CARD_BG = colors.HexColor("#F8FAFC")
CHIP_BG = colors.HexColor("#F1F5F9")
AMBER_BG = colors.HexColor("#FFFBEB")
GREEN_BG = colors.HexColor("#ECFDF5")
WHITE = colors.white

# --------------------------------------------------------------------------- #
# Fonts
# --------------------------------------------------------------------------- #
F_REG = "KNZeUI"
F_SEMI = "KNZeUI-Semi"
F_BOLD = "KNZeUI-Bold"
pdfmetrics.registerFont(TTFont(F_REG, r"C:\Windows\Fonts\segoeui.ttf"))
pdfmetrics.registerFont(TTFont(F_SEMI, r"C:\Windows\Fonts\seguisb.ttf"))
pdfmetrics.registerFont(TTFont(F_BOLD, r"C:\Windows\Fonts\segoeuib.ttf"))
pdfmetrics.registerFontFamily(F_REG, normal=F_REG, bold=F_BOLD, italic=F_REG,
                              boldItalic=F_BOLD)

# --------------------------------------------------------------------------- #
# Arabic shaping (reportlab has no complex-text layout, so we pre-shape)
# The class deliberately includes whitespace and Arabic punctuation so that a
# whole PHRASE is captured as one run. Reversing word-by-word leaves the words
# themselves in logical (left-to-right) order, which reads as reversed.
# --------------------------------------------------------------------------- #
AR_RUN = re.compile(
    r"([؀-ۿݐ-ݿࢠ-ࣿ"
    r"ﭐ-﷿ﹰ-﻿"
    r"؋،؛ٟۖ-ۭ۝-۞ۜ-۟"
    r"\s]+)"
)


def ar(text):
    """Convert Arabic runs inside `text` to visual-order presentation forms."""
    def _sub(m):
        run = m.group(1)
        core = run.strip()
        if not core:
            return run
        # Whitespace is stripped before reshaping and re-attached afterwards:
        # the bidi pass reverses the string, so a leading space would jump to
        # the visual right edge of the run.
        lead = run[:len(run) - len(run.lstrip())]
        trail = run[len(run.rstrip()):]
        return lead + get_display(arabic_reshaper.reshape(core)) + trail
    return AR_RUN.sub(_sub, text)


def esc(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def T(text):
    """escape + shape, ready for Paragraph markup."""
    return ar(esc(text))


# --------------------------------------------------------------------------- #
# Geometry
# --------------------------------------------------------------------------- #
PW, PH = A4
M = 36.0                     # 0.5 in side margins
TOP = 36.0                   # top margin
BOT = 52.0                   # bottom margin, room for footer furniture
CW = PW - 2 * M              # content width  = 523.28pt
GUT = 11.0                   # gutter between grid columns
FRAME_H = PH - TOP - BOT     # usable story height = 753.89pt
FOOT_RULE_Y = 44.0           # footer divider
FOOT_BASE_Y = 38.0           # footer text baseline (clears the 36pt margin)

# --------------------------------------------------------------------------- #
# Styles
# --------------------------------------------------------------------------- #
S_TITLE = ParagraphStyle("t", fontName=F_BOLD, fontSize=19, leading=22.5,
                         textColor=SLATE, alignment=TA_LEFT)
S_META = ParagraphStyle("m", fontName=F_REG, fontSize=8.4, leading=11.4,
                        textColor=GRAY)
S_SECT = ParagraphStyle("s", fontName=F_BOLD, fontSize=12.6, leading=15.4,
                        textColor=SLATE)
S_SUB = ParagraphStyle("ss", fontName=F_BOLD, fontSize=9.4, leading=12,
                       textColor=SLATE, spaceBefore=1)
S_BODY = ParagraphStyle("b", fontName=F_REG, fontSize=9.3, leading=13.4,
                        textColor=colors.HexColor("#334155"))
S_CARDT = ParagraphStyle("ct", fontName=F_BOLD, fontSize=9.4, leading=12,
                         textColor=SLATE)
S_CARDD = ParagraphStyle("cd", fontName=F_REG, fontSize=8.5, leading=11.6,
                         textColor=GRAY)
S_LBL = ParagraphStyle("l", fontName=F_BOLD, fontSize=8.4, leading=10.4,
                       textColor=colors.HexColor("#475569"))
S_ITEM = ParagraphStyle("i", fontName=F_REG, fontSize=9.1, leading=12.8,
                        textColor=colors.HexColor("#334155"))
S_ITEMB = ParagraphStyle("ib", fontName=F_BOLD, fontSize=8.7, leading=12.0,
                         textColor=SLATE)
S_PHB = ParagraphStyle("pb", fontName=F_REG, fontSize=8.5, leading=11.4,
                       textColor=colors.HexColor("#334155"))
S_FOOT = ParagraphStyle("f", fontName=F_REG, fontSize=7.4, leading=9.8,
                        textColor=GRAY)


# --------------------------------------------------------------------------- #
# Small flowables
# --------------------------------------------------------------------------- #
class CheckMark(Flowable):
    """Emerald disc with a vector check mark (dingbat glyphs are font-absent)."""

    def __init__(self, size=9.0, color=GREEN, width=15.0):
        Flowable.__init__(self)
        self.size = size
        self.color = color
        self.width = width
        self.height = width

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        c = self.canv
        r = self.size / 2.0
        cx, cy = self.width / 2.0, self.height / 2.0
        c.setFillColor(self.color)
        c.setStrokeColor(self.color)
        c.circle(cx, cy, r, stroke=1, fill=1)
        c.setStrokeColor(WHITE)
        c.setLineWidth(max(0.9, r * 0.30))
        c.setLineCap(1)
        c.setLineJoin(1)
        p = c.beginPath()
        p.moveTo(cx - r * 0.38, cy + r * 0.02)
        p.lineTo(cx - r * 0.10, cy - r * 0.28)
        p.lineTo(cx + r * 0.42, cy + r * 0.32)
        c.drawPath(p, stroke=1, fill=0)


class Dot(Flowable):
    """Small circular marker used for roadmap bullets."""

    def __init__(self, color=GOLD, size=3.0, width=7.0):
        Flowable.__init__(self)
        self.color = color
        self.size = size
        self.width = width
        self.height = width

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.setFillColor(self.color)
        c.setStrokeColor(self.color)
        c.circle(self.width / 2.0, self.height / 2.0, self.size / 2.0,
                 stroke=1, fill=1)


class Pill(Flowable):
    """Single-line rounded badge.

    The width comes from real font metrics, never a guessed per-character
    factor. A guessed factor (len * size * 0.085) produced a ~17pt box and the
    label wrapped into a vertical pole of single characters.
    """

    def __init__(self, text, fg, bg, font=F_BOLD, size=7.6, pad=5.5,
                 height=None, radius=None, fixed_w=None):
        Flowable.__init__(self)
        self.label = T(text)
        self.fg = fg
        self.bg = bg
        self.font = font
        self.size = size
        w = pdfmetrics.stringWidth(self.label, font, size) + 2 * pad
        self.width = max(w, fixed_w) if fixed_w else w
        self.height = height if height else size + 6.0
        self.radius = (self.height / 2.0) if radius is None else radius

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.setFillColor(self.bg)
        c.roundRect(0, 0, self.width, self.height, self.radius,
                    stroke=0, fill=1)
        c.setFillColor(self.fg)
        c.setFont(self.font, self.size)
        asc, desc = pdfmetrics.getAscentDescent(self.font, self.size)
        c.drawCentredString(self.width / 2.0,
                            (self.height - (asc + desc)) / 2.0, self.label)


def pill_width(text, font=F_BOLD, size=7.6, pad=5.5):
    return pdfmetrics.stringWidth(T(text), font, size) + 2 * pad


def pill(text, fg, bg, pad=5.5, font=F_BOLD, size=7.6, **kw):
    """Single-line badge. Always returns one line of text."""
    return Pill(text, fg, bg, font=font, size=size, pad=pad, **kw)


def left(table):
    table.hAlign = "LEFT"
    return table


def grid(cells, ncols, avail, gutter=GUT, equal_rows=False, extra_style=None):
    """Lay out `cells` in ncols columns using real gutter COLUMNS.

    The table declares 2*ncols-1 columns (content, gutter, content, ...), so
    every row MUST carry an explicit empty cell for each gutter. Omitting them
    made ReportLab apply the 11pt gutter width to the second content column and
    squeezed it to 11pt wide.
    """
    nrows = (len(cells) + ncols - 1) // ncols
    cw = (avail - (ncols - 1) * gutter) / float(ncols)
    colw = [cw if (i % 2 == 0) else gutter for i in range(2 * ncols - 1)]

    data = []
    for r in range(nrows):
        row = []
        for c in range(ncols):
            idx = r * ncols + c
            row.append(cells[idx] if idx < len(cells) else "")
            if c < ncols - 1:
                row.append("")  # gutter column cell
        data.append(row)

    row_heights = None
    if equal_rows:
        row_heights = []
        for r in range(nrows):
            h = 0.0
            for c in range(ncols):
                idx = r * ncols + c
                if idx >= len(cells) or isinstance(cells[idx], str):
                    continue
                h = max(h, cells[idx].wrap(cw, FRAME_H)[1])
            row_heights.append(h + (0 if r == 0 else gutter) + 0.5)

    t = left(Table(data, colWidths=colw, rowHeights=row_heights))
    style = [("VALIGN", (0, 0), (-1, -1), "TOP"),
             ("LEFTPADDING", (0, 0), (-1, -1), 0),
             ("RIGHTPADDING", (0, 0), (-1, -1), 0),
             ("TOPPADDING", (0, 0), (-1, -1), 0),
             ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]
    for r in range(nrows):
        style.append(("TOPPADDING", (0, r), (-1, r), 0 if r == 0 else gutter))
    if extra_style:
        style.extend(extra_style)
    t.setStyle(TableStyle(style))
    return t


# --------------------------------------------------------------------------- #
# Page furniture
# --------------------------------------------------------------------------- #
def on_page(canv, doc):
    canv.saveState()
    # top accent bar (full bleed)
    canv.setFillColor(BLUE)
    canv.rect(0, PH - 5, PW, 5, stroke=0, fill=1)
    canv.setFillColor(AMBER)
    canv.rect(PW * 0.62, PH - 5, PW * 0.38, 5, stroke=0, fill=1)
    # footer (kept inside the 36pt bottom margin)
    canv.setStrokeColor(LINE)
    canv.setLineWidth(0.6)
    canv.line(M, FOOT_RULE_Y, PW - M, FOOT_RULE_Y)
    canv.setFillColor(BLUE)
    canv.rect(M, FOOT_BASE_Y - 1.2, 5.5, 5.5, stroke=0, fill=1)
    canv.setFont(F_REG, 6.6)
    canv.setFillColor(GRAY)
    canv.drawString(M + 10, FOOT_BASE_Y,
                    "KNZiN (كنزين) — Confidential project status report")
    canv.setFont(F_BOLD, 6.6)
    canv.setFillColor(SLATE)
    canv.drawRightString(PW - M - 1, FOOT_BASE_Y, "Page %d of 2" % doc.page)
    canv.restoreState()


# --------------------------------------------------------------------------- #
# Content helpers
# --------------------------------------------------------------------------- #
def section_heading(number, text, badge, bfg, bbg):
    """Heading text on the left, single-line badge hard right, blue rule under."""
    bw = max(pill_width(badge), 104.0)
    head = Paragraph(T("%s · %s" % (number, text)), S_SECT)
    t = left(Table([[head, pill(badge, bfg, bbg, pad=9.0)]],
                   colWidths=[CW - bw - 14, bw]))
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("LINEBELOW", (0, 0), (0, 0), 1.6, BLUE),
    ]))
    return t


def feature_card(title, detail, icon, inner_w):
    body = [Paragraph(T(title), S_CARDT), Spacer(1, 1.8),
            Paragraph(T(detail), S_CARDD)]
    icon_w = 25.0
    t = left(Table([[icon, body]], colWidths=[icon_w, inner_w - icon_w]))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LINEBEFORE", (0, 0), (0, 0), 2.6, GREEN),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        # column 0 holds the tick; its right padding is the gap before the text
        ("LEFTPADDING", (0, 0), (0, 0), 7),
        ("RIGHTPADDING", (0, 0), (0, 0), 5),
        ("TOPPADDING", (0, 0), (0, 0), 7.5),
        ("BOTTOMPADDING", (0, 0), (0, 0), 7.5),
        # column 1 carries the copy and supplies the card's right inset
        ("LEFTPADDING", (1, 0), (1, 0), 0),
        ("RIGHTPADDING", (1, 0), (1, 0), 8),
        ("TOPPADDING", (1, 0), (1, 0), 7),
        ("BOTTOMPADDING", (1, 0), (1, 0), 7.5),
    ]))
    return t


def chip(text, w):
    t = left(Table([[Paragraph(T(text), S_ITEMB)]], colWidths=[w]))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CHIP_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6.2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def bullet_rows(items, text_style, accent, avail_w, gap=5.2, dot=3.4,
                dot_w=10.0):
    """Flowables for a dotted list. `avail_w` is the width left by the parent."""
    flows = []
    for it in items:
        t = left(Table([[Dot(accent, dot, dot_w),
                         Paragraph(T(it), text_style)]],
                       colWidths=[dot_w, avail_w - dot_w]))
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), gap),
        ]))
        flows.append(t)
    return flows


def cat_box(title, kicker, items, inner_w, accent, bg, pad_x=7.0, pad_y=6.0):
    """Category card. Every inner table is sized against inner_w - 2*pad_x."""
    avail = inner_w - 2 * pad_x
    head = left(Table([[Paragraph(T(title), S_SUB)]], colWidths=[avail]))
    head.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, 0), 2.6, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5.6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5.8),
    ]))
    flows = [head,
             Spacer(1, 2),
             Paragraph(T(kicker), S_FOOT),
             Spacer(1, 4.5)]
    flows.extend(bullet_rows(items, S_ITEM, accent, avail))
    outer = left(Table([[flows]], colWidths=[inner_w]))
    outer.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), pad_x),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad_x),
        ("TOPPADDING", (0, 0), (-1, -1), pad_y),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad_y),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return outer


def phase_card(num, name, sub, bullets, color, bg, inner_w, pad_x=7.0,
               pad_y=7.5):
    """Roadmap phase card. The title block reserves two lines so the three
    cards line their bullet lists up even when one title wraps."""
    avail = inner_w - 2 * pad_x
    badge_w = 23.0
    badge = Pill(str(num), WHITE, color, size=12.0, height=18.0, radius=3.5,
                 fixed_w=20.0)
    title_st = ParagraphStyle("pt2", parent=S_SUB, leading=12.0)
    hdr = left(Table(
        [[badge, [Paragraph(T(name), title_st), Paragraph(T(sub), S_FOOT),
                  Spacer(1, 12.0)]],   # reserve the 2nd title line
        ], colWidths=[badge_w, avail - badge_w]))
    hdr.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    flows = [hdr, Spacer(1, 5)]
    flows.extend(bullet_rows(bullets, S_PHB, color, avail, gap=4.2, dot=2.8,
                             dot_w=9.0))
    outer = left(Table([[flows]], colWidths=[inner_w]))
    outer.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LEFTPADDING", (0, 0), (-1, -1), pad_x),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad_x),
        ("TOPPADDING", (0, 0), (-1, -1), pad_y),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad_y),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return outer


def status_table(rows):
    """Area-by-area completion summary: label left, status pill hard right."""
    area_st = ParagraphStyle("a", fontName=F_REG, fontSize=8.6, leading=11,
                             textColor=colors.HexColor("#334155"))
    tag_w = 76.0
    data = []
    style = [("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
             ("LEFTPADDING", (0, 0), (-1, -1), 8),
             ("RIGHTPADDING", (0, 0), (-1, -1), 6),
             ("TOPPADDING", (0, 0), (-1, -1), 3.0),
             ("BOTTOMPADDING", (0, 0), (-1, -1), 3.2),
             ("ALIGN", (1, 0), (1, 0), "RIGHT"),
             ("BOX", (0, 0), (-1, -1), 0.5, LINE),
             ("LINEBELOW", (0, 0), (0, -2), 0.4, LINE)]
    for i, (label, done) in enumerate(rows):
        if done:
            badge = pill("COMPLETE", WHITE, GREEN, pad=5.0, size=6.8)
        else:
            badge = pill("TO BUILD", WHITE, AMBER, pad=5.0, size=6.8)
        data.append([Paragraph(T(label), area_st), badge])
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i),
                          colors.HexColor("#FAFBFC")))
    t = left(Table(data, colWidths=[CW - tag_w, tag_w]))
    t.setStyle(TableStyle(style))
    return t


def note_strip(accent, bg, text, tag, tag_w=124.0, pad=9.0):
    """Full-width closing strip: body copy left, tag hard right."""
    body = left(Table([[Paragraph(T(text), S_FOOT)]], colWidths=[CW - tag_w - 2 * pad]))
    body.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    tag_st = ParagraphStyle("tg", fontName=F_BOLD, fontSize=7.4, leading=9.4,
                            textColor=accent, alignment=2)
    tag_p = left(Table([[Paragraph(T(tag), tag_st)]],
                       colWidths=[tag_w - 2 * pad]))
    tag_p.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    t = left(Table([[body, tag_p]], colWidths=[CW - tag_w, tag_w]))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, 0), 2.6, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), pad),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    return t


# --------------------------------------------------------------------------- #
# Page 1
# --------------------------------------------------------------------------- #
def page_one():
    F = []
    F.append(Paragraph(T("KNZiN (كنزين) — Project Status & Completion Report"),
                       S_TITLE))
    F.append(Spacer(1, 3))
    F.append(Paragraph(T("Source of Truth: تفاصيل مشروع KNZiN   |   "
                         "Status: Core MVP Built (~40–45%)   |   "
                         "Date: September 2026   |   "
                         "For: Stakeholders & Investors"),
                       S_META))
    F.append(Spacer(1, 11))

    # ---- progress band -----------------------------------------------------
    pad = 9.0
    inner = CW - 2 * pad
    pct = 0.45
    bar = left(Table([["", ""]], colWidths=[inner * pct, inner - inner * pct],
                     rowHeights=[10.5]))
    bar.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), BLUE),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#FDE68A")),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    lbl = left(Table([[Paragraph(T("BUILT & VERIFIED  —  ~40–45%"), S_LBL),
                       Paragraph(T("REMAINING TO BUILD  —  ~55–60%"), S_LBL)]],
                     colWidths=[inner * 0.6, inner * 0.4]))
    lbl.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    band = left(Table([[[bar, lbl]]], colWidths=[CW]))
    band.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BLUE_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#BFDBFE")),
        ("LEFTPADDING", (0, 0), (-1, -1), pad),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    F.append(band)
    F.append(Spacer(1, 12))

    # ---- section 1 ---------------------------------------------------------
    F.append(section_heading("1", "Where We Stand — Built & Verified",
                             "100% COMPLETE", WHITE, GREEN))
    F.append(Spacer(1, 6))
    F.append(Paragraph(
        T("KNZiN (كنزين) is an Arabic-first vocational micro-learning platform "
          "that sells short, job-ready trade courses and attaches a free "
          "promotional sweepstakes ticket (تذكرة السحب) to every purchase. "
          "The revenue engine — catalog, pricing, checkout and legal "
          "classification — is complete, audited and enforced end to end; what "
          "remains is the marketing surface that sells the inventory and the "
          "back-office that operates the draws."),
        S_BODY))
    F.append(Spacer(1, 8))

    F.append(Paragraph(T("Architecture & Core Stack"), S_SUB))
    F.append(Spacer(1, 4))
    chips = [
        "Next.js 16 · App Router (TypeScript)",
        "TailwindCSS v4 — Mobile-first",
        "Laravel 11 — PHP REST API",
        "MySQL 8 — 16-table schema",
        "Redis Queues — Ticket generation",
        "Bilingual AR / EN — RTL & LTR",
    ]
    chw = (CW - 2 * GUT) / 3.0
    F.append(grid([chip(c, chw) for c in chips], 3, CW, equal_rows=True))
    F.append(Spacer(1, 8))

    feats = [
        ("Course Catalog & Vocational Seeders",
         "Eight fully seeded trades: Auto Detailing, Phone Repair, Solar "
         "Installation, Freelance Design, HVAC, CCTV, Barbering, Barista."),
        ("Modular Parts & Dual Pricing",
         "$2 per part (1 ticket) or $10 full bundle (15 tickets). "
         "IQD exchange rate frozen at 1.3100."),
        ("Frictionless Guest Checkout",
         "Email-only purchase — no password, no account wall. "
         "Dual-currency display in IQD and USD."),
        ("Canonical Legal Shield Checkbox",
         "Mandatory consent text enforced verbatim in both the Laravel API and "
         "the Next.js UI before payment — classifies every order as a course "
         "purchase with a zero-cost promotional gift."),
        ("Anti-Piracy Psychological Profiler",
         "Pre-checkout vocational survey (محرك التخصيص النفسي) plus a "
         "Personalization Stamp that commits content to the buyer's budget and "
         "trade — discourages piracy socially, not technically."),
        ("Lesson Player & Navigation HUD",
         "Video seek, syllabus tabs, sticky header HUD (محفظتي / تذاكري / "
         "كورساتي) with live wallet and ticket counters, and Ctrl+K search."),
    ]
    fw = (CW - GUT) / 2.0
    cards = [feature_card(t_, d_, CheckMark(9.0, GREEN, 13.0), fw)
             for (t_, d_) in feats]
    F.append(grid(cards, 2, CW, equal_rows=True))
    F.append(Spacer(1, 9))
    F.append(Paragraph(T("Coverage by Specification Area"), S_SUB))
    F.append(Spacer(1, 4))
    F.append(status_table([
        ("Course catalog, modular parts & dual pricing", True),
        ("Guest checkout, dual currency & legal shield", True),
        ("Lesson player, navigation HUD & search", True),
        ("Draw arena, Hall of Fame & social proof ticker", False),
        ("Affiliate / influencer engine & dashboard", False),
        ("Admin panel, payment gateways, notifications & KYC", False),
    ]))
    F.append(Spacer(1, 9))
    F.append(note_strip(
        GREEN, GREEN_BG,
        "How to read this: KNZiN can already take money safely — orders are "
        "legally classified as course purchases, wallet movements are written "
        "to an append-only ledger, and ticket issuance is decoupled from the "
        "browser. What is missing is the machinery that creates demand, "
        "distributes it, and settles it.",
        "Bridge to the remaining 55–60%  →  overleaf"))
    return F


# --------------------------------------------------------------------------- #
# Page 2
# --------------------------------------------------------------------------- #
def page_two():
    F = []
    F.append(section_heading("2", "What Remains to Build & Launch Roadmap",
                             "REMAINING ~55%", WHITE, AMBER))
    F.append(Spacer(1, 3))
    F.append(Paragraph(
        T("The remaining 55–60% splits into two workstreams: the front-of-house "
          "that turns browsing into urgency, and the back-office that runs the "
          "draws, the money and the winners."),
        S_BODY))
    F.append(Spacer(1, 9))

    box_w = (CW - GUT) / 2.0
    inner = box_w - 14

    catA = cat_box(
        "A · Marketing & Engagement UI",
        "FRONT-OF-HOUSE — surfaced on the public site",
        [
            "Live Social Proof Ticker (شريط الإشعارات الحية) — continuous "
            "scrolling purchase, bundle and countdown notifications.",
            "Active Draws Arena (ساحة السحوبات) — three live countdown cards: "
            "Factory Funding $100,000, Project of a Lifetime $50,000, Family "
            "Security $500,000 — plus a strip of draws completed today with the "
            "prizes already distributed.",
            "Hall of Fame (لوحة الفائزين) — winner cards with name, country, "
            "prize value and the verifiable draw seed.",
            "“How It Works” modal (كيف تعمل كنزين؟) — header pop-up: "
            "اختر الكورس ← استلم تذكرتك ← تابع السحب.",
            "The Hook (القصة) — home-page vision narrative: skill and capital "
            "must travel together.",
            "Floating WhatsApp support button — instant, site-wide customer care.",
        ],
        inner, BLUE, BLUE_BG, pad_x=7.0, pad_y=7.0)

    catB = cat_box(
        "B · Business & Back-Office Engines",
        "OPERATIONS — the systems that run the platform",
        [
            "Affiliate & Influencer Engine (نظام الإحالة الذكي) — 40% "
            "grand-prize co-share, smart referral links with embedded affiliate "
            "ID, and an Influencer Dashboard (earnings, per-link stats, payout "
            "history).",
            "Admin Management Panel (لوحة تحكم الإدارة) — course editing, draw "
            "counters, electronic RNG draw button, manual payout zeroing "
            "(تسديد الدفعة) with Western Union receipt upload, and a fraud ban "
            "system.",
            "Payment Gateways & Reconciliation — ZainCash / AsiaHawala "
            "server-to-server webhooks with idempotency keys, plus automatic "
            "settlement of payments lost to dropped connections.",
            "Automated Notifications (نظام الإشعارات) — abandoned-cart recovery "
            "by email and WhatsApp, winner alerts, new-course and new-prize "
            "broadcasts.",
            "Ticket Serials & Winner KYC — unique ticket codes (e.g. KNZ-A15) "
            "persisted per order, and mandatory identity verification before any "
            "prize is released.",
        ],
        inner, GOLD, AMBER_BG, pad_x=7.0, pad_y=7.0)

    F.append(grid([catA, catB], 2, CW, equal_rows=True))
    F.append(Spacer(1, 13))

    F.append(section_heading("3", "Strategic 3-Phase Roadmap to Launch",
                             "EXECUTION ORDER", WHITE, SLATE))
    F.append(Spacer(1, 6))

    pw_ = (CW - 2 * GUT) / 3.0
    p1 = phase_card(
        1, "Marketing HUD & Draws UI",
        "Category A — fast, low risk",
        ["Ticker, draw arena and Hall of Fame live.",
         "“How It Works” modal and The Hook copy.",
         "Draws-completed-today strip with distributed prizes.",
         "Floating WhatsApp support button.",
         "Outcome: existing course inventory becomes visible urgency."],
        BLUE, BLUE_BG, pw_, pad_y=8.5)
    p2 = phase_card(
        2, "Affiliate & Influencer Portal",
        "Referral engine — growth",
        ["Smart referral links with embedded affiliate ID.",
         "40% grand-prize co-share ledger.",
         "Influencer Dashboard: earnings, clicks, sales, payout history.",
         "Payout history archive with date and transfer method.",
         "Outcome: organic reach in WhatsApp and Facebook groups at zero ad "
         "spend."],
        GOLD, AMBER_BG, pw_, pad_y=8.5)
    p3 = phase_card(
        3, "Admin Panel, Payments & Launch",
        "Back office — go live",
        ["Admin panel, RNG draw button, payout zeroing, fraud bans.",
         "ZainCash / AsiaHawala webhooks + reconciliation engine.",
         "Notification engine and winner KYC.",
         "Anti-fraud ban system and marketing tracking pixels.",
         "Outcome: the platform can take real money and pay real winners."],
        GREEN, GREEN_BG, pw_, pad_y=8.5)
    F.append(grid([p1, p2, p3], 3, CW, equal_rows=True))
    F.append(Spacer(1, 12))

    F.append(note_strip(
        BLUE, CARD_BG,
        "Launch gate: the phases run front-to-back for a reason — Phase 1 makes "
        "the catalogue sell, Phase 2 makes it travel, and Phase 3 makes it "
        "payable. Nothing in Phase 1 or 2 can be monetised before the "
        "webhook-to-draw-to-KYC chain in Phase 3 is proven in test mode.",
        "Next milestone →  Phase 1 UI"))
    F.append(Spacer(1, 9))
    F.append(note_strip(
        GRAY, CARD_BG,
        "Deliberately deferred past launch (roadmap Phase 4 — production "
        "hardening and regional expansion): Cloudflare load distribution, the "
        "dark-mode decision, cross-country entity set-up, and payment providers "
        "beyond Iraq.",
        "Deferred →  Phase 4"))
    return F


# --------------------------------------------------------------------------- #
# Build
# --------------------------------------------------------------------------- #
def build(path):
    doc = BaseDocTemplate(
        path, pagesize=A4,
        leftMargin=M, rightMargin=M, topMargin=TOP, bottomMargin=BOT,
        title="KNZiN (كنزين) - Project Status & Completion Report",
        author="KNZiN Project", subject="Project status, remaining scope, "
                                       "and 3-phase launch roadmap",
        creator="KNZiN")
    frame = Frame(M, BOT, CW, FRAME_H, id="body",
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=on_page)])
    # The PageBreak is mandatory: without it, section 2's heading was stranded
    # at the bottom of page 1, far from the cards it introduces.
    doc.build(page_one() + [PageBreak()] + page_two())
    return path


# --------------------------------------------------------------------------- #
# Verification
# --------------------------------------------------------------------------- #
def verify(paths, margin=M, tol=1.5):
    """Assert 2 pages and that no text escapes the print margins."""
    import pymupdf
    from pypdf import PdfReader

    for p in paths:
        n = len(PdfReader(p).pages)
        assert n == 2, "PAGE OVERFLOW (%d pages, expected 2): %s" % (n, p)
        fdoc = pymupdf.open(p)
        for i, page in enumerate(fdoc, start=1):
            for b in page.get_text("dict")["blocks"]:
                for line in b.get("lines", []):
                    for span in line["spans"]:
                        x0, y0, x1, y1 = span["bbox"]
                        assert x0 >= margin - tol, (
                            "p%d LEFT overflow x0=%.1f %r" % (i, x0, span["text"]))
                        assert x1 <= PW - margin + tol, (
                            "p%d RIGHT overflow x1=%.1f %r" % (i, x1, span["text"]))
                        assert y0 >= margin - tol, (
                            "p%d TOP overflow y0=%.1f %r" % (i, y0, span["text"]))
                        assert y1 <= PH - margin + tol, (
                            "p%d BOTTOM overflow y1=%.1f %r" % (i, y1, span["text"]))
        fdoc.close()
        print("OK  %-58s pages=%d  margins clean" % (p, n))
    return True


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    for nm, flows in (("page 1", page_one()), ("page 2", page_two())):
        h = sum(f.wrap(CW, FRAME_H)[1] for f in flows)
        print("%s content height %6.1fpt / %.1fpt frame  (%.0f%% fill)"
              % (nm, h, FRAME_H, 100.0 * h / FRAME_H))
    build(OUT_NAMES[0])
    for attempt in range(10):
        try:
            shutil.copyfile(OUT_NAMES[0], OUT_NAMES[1])
            break
        except PermissionError:
            if attempt == 9:
                raise
            time.sleep(1.0)  # a viewer or indexer may hold the previous copy
    for p in OUT_NAMES:
        print("wrote %-58s bytes=%d" % (p, os.path.getsize(p)))
    verify(OUT_NAMES)
    print("OK")
