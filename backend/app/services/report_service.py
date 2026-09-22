"""
Servicio de generación de reportes PDF con ReportLab.
Genera comprobantes de venta (A4) y tickets de comanda (térmico 80mm).
Todo se genera en memoria (BytesIO) para máxima velocidad.
"""

import io
from datetime import datetime
from decimal import Decimal

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    HRFlowable,
)

# ============================================================
# Constantes del restaurante
# ============================================================
RESTAURANTE_NOMBRE = "Cevichería D'Peñas"
RESTAURANTE_DIRECCION = "Talara, Piura, Perú"
RESTAURANTE_TELEFONO = "(073) 123-456"
TICKET_WIDTH_MM = 80  # ancho de ticket térmico


# ============================================================
# Estilos de PDF
# ============================================================
def _get_styles() -> dict[str, ParagraphStyle]:
    """Retorna estilos reutilizables para el comprobante."""
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ReportTitle",
            parent=base["Heading1"],
            fontSize=18,
            spaceAfter=6,
            alignment=1,  # center
            textColor=colors.HexColor("#0369a1"),
        ),
        "subtitle": ParagraphStyle(
            "ReportSubtitle",
            parent=base["Normal"],
            fontSize=10,
            textColor=colors.gray,
            alignment=1,
            spaceAfter=4,
        ),
        "section": ParagraphStyle(
            "ReportSection",
            parent=base["Heading2"],
            fontSize=12,
            spaceAfter=4,
            spaceBefore=10,
            textColor=colors.HexColor("#0c4a6e"),
        ),
        "body": ParagraphStyle(
            "ReportBody",
            parent=base["Normal"],
            fontSize=10,
            leading=14,
        ),
        "small": ParagraphStyle(
            "ReportSmall",
            parent=base["Normal"],
            fontSize=8,
            textColor=colors.gray,
        ),
        "right": ParagraphStyle(
            "ReportRight",
            parent=base["Normal"],
            fontSize=10,
            alignment=2,  # right
        ),
        "center": ParagraphStyle(
            "ReportCenter",
            parent=base["Normal"],
            fontSize=10,
            alignment=1,
        ),
    }


# ============================================================
# Comprobante de Venta — PDF A4
# ============================================================
def generar_comprobante_venta(venta) -> bytes:
    """
    Genera un comprobante de venta en formato A4 con ReportLab.

    Args:
        venta: objeto Venta con detalles (lista de VentaDetalle).

    Returns:
        bytes del PDF generado en memoria.
    """
    buffer = io.BytesIO()
    styles = _get_styles()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=25 * mm,
        bottomMargin=20 * mm,
    )

    elements: list = []

    # --- Encabezado ---
    elements.append(Paragraph(RESTAURANTE_NOMBRE, styles["title"]))
    elements.append(
        Paragraph(
            f"{RESTAURANTE_DIRECCION} · Tel: {RESTAURANTE_TELEFONO}",
            styles["subtitle"],
        )
    )
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0ea5e9")))
    elements.append(Spacer(1, 8))

    # --- Datos del comprobante ---
    fecha_str = (
        venta.fecha.strftime("%d/%m/%Y %H:%M")
        if isinstance(venta.fecha, datetime)
        else str(venta.fecha)
    )
    doc_info = [
        ["Comprobante N.°:", str(venta.numero)],
        ["Fecha:", fecha_str],
        ["Estado:", venta.estado.upper()],
    ]
    if venta.cliente_nombre:
        doc_info.append(["Cliente:", venta.cliente_nombre])
    if venta.cliente_documento:
        doc_info.append(["Documento:", venta.cliente_documento])

    info_table = Table(doc_info, colWidths=[120, 350])
    info_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(info_table)
    elements.append(Spacer(1, 12))

    # --- Tabla de ítems ---
    elements.append(Paragraph("Detalle de Venta", styles["section"]))
    header_row = ["#", "Platillo", "Cant.", "P.U. (S/)", "Subtotal (S/)"]
    data_rows = [header_row]

    for i, det in enumerate(venta.detalles, start=1):
        data_rows.append(
            [
                str(i),
                det.platillo_nombre,
                str(det.cantidad),
                f"{Decimal(det.precio_unitario):.2f}",
                f"{Decimal(det.subtotal):.2f}",
            ]
        )

    col_widths = [30, 220, 50, 80, 90]
    item_table = Table(data_rows, colWidths=col_widths, repeatRows=1)
    item_table.setStyle(
        TableStyle(
            [
                # Encabezado
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0369a1")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                # Contenido
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                ("ALIGN", (2, 1), (-1, -1), "CENTER"),
                ("ALIGN", (3, 1), (4, -1), "RIGHT"),
                # Bordes
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f9ff")]),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(item_table)
    elements.append(Spacer(1, 12))

    # --- Totales ---
    igv_pct = Decimal(venta.igv) / Decimal(venta.subtotal) * 100 if Decimal(venta.subtotal) > 0 else 0
    totals_data = [
        ["", "Subtotal (S/):", f"{Decimal(venta.subtotal):.2f}"],
        ["", f"IGV {igv_pct:.0f}% (S/):", f"{Decimal(venta.igv):.2f}"],
        ["", "TOTAL (S/):", f"{Decimal(venta.total):.2f}"],
    ]
    totals_table = Table(totals_data, colWidths=[300, 120, 80])
    totals_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("FONTNAME", (1, -1), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (1, -1), (-1, -1), 12),
                ("TEXTCOLOR", (1, -1), (-1, -1), colors.HexColor("#0369a1")),
                ("LINEABOVE", (1, -1), (-1, -1), 1.5, colors.HexColor("#0369a1")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(totals_table)

    # --- Pie de página ---
    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    elements.append(Spacer(1, 6))
    elements.append(
        Paragraph(
            "Gracias por su compra. Cevichería D'Peñas — Talara, Piura",
            styles["center"],
        )
    )

    doc.build(elements)
    return buffer.getvalue()


# ============================================================
# Ticket de Comanda — Térmico 80mm
# ============================================================
def generar_ticket_comanda(venta) -> bytes:
    """
    Genera un ticket de comanda en formato térmico (80mm) con ReportLab.

    Args:
        venta: objeto Venta con detalles.

    Returns:
        bytes del PDF generado en memoria.
    """
    buffer = io.BytesIO()
    page_width = TICKET_WIDTH_MM * mm

    doc = SimpleDocTemplate(
        buffer,
        pagesize=(page_width, 200 * mm),
        rightMargin=5 * mm,
        leftMargin=5 * mm,
        topMargin=5 * mm,
        bottomMargin=5 * mm,
    )

    ticket_style = ParagraphStyle(
        "Ticket",
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        alignment=1,
    )
    ticket_bold = ParagraphStyle(
        "TicketBold",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        alignment=1,
    )
    ticket_small = ParagraphStyle(
        "TicketSmall",
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        alignment=1,
    )
    ticket_right = ParagraphStyle(
        "TicketRight",
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        alignment=2,
    )

    elements: list = []

    # --- Encabezado ---
    elements.append(Paragraph(RESTAURANTE_NOMBRE.upper(), ticket_bold))
    elements.append(Paragraph(RESTAURANTE_DIRECCION, ticket_small))
    elements.append(Paragraph(f"Tel: {RESTAURANTE_TELEFONO}", ticket_small))
    elements.append(Spacer(1, 4))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
    elements.append(Spacer(1, 4))

    # --- Datos de venta ---
    fecha_str = (
        venta.fecha.strftime("%d/%m/%Y %H:%M")
        if isinstance(venta.fecha, datetime)
        else str(venta.fecha)
    )
    elements.append(Paragraph(f"Comprobante: {venta.numero}", ticket_style))
    elements.append(Paragraph(f"Fecha: {fecha_str}", ticket_small))
    if venta.cliente_nombre:
        elements.append(Paragraph(f"Cliente: {venta.cliente_nombre}", ticket_small))
    elements.append(Spacer(1, 4))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
    elements.append(Spacer(1, 4))

    # --- Ítems (formato compacto) ---
    for i, det in enumerate(venta.detalles, start=1):
        qty_str = f"x{det.cantidad}"
        price_str = f"S/{Decimal(det.subtotal):.2f}"
        row_data = [
            [
                Paragraph(f"{qty_str} {det.platillo_nombre}", ticket_style),
                Paragraph(price_str, ticket_right),
            ]
        ]
        row_table = Table(row_data, colWidths=[page_width * 0.65, page_width * 0.3])
        row_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
        elements.append(row_table)
        if det.cantidad > 1:
            unit_price = Decimal(det.precio_unitario)
            elements.append(
                Paragraph(
                    f"  ({det.cantidad} x S/{unit_price:.2f} c/u)",
                    ticket_small,
                )
            )
        elements.append(Spacer(1, 2))

    # --- Totales ---
    elements.append(Spacer(1, 4))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
    elements.append(Spacer(1, 4))
    elements.append(
        Paragraph(
            f"Subtotal: S/{Decimal(venta.subtotal):.2f}", ticket_right
        )
    )
    elements.append(
        Paragraph(
            f"IGV:      S/{Decimal(venta.igv):.2f}", ticket_right
        )
    )
    total_bold = ParagraphStyle(
        "TicketTotal",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        alignment=2,
    )
    elements.append(
        Paragraph(f"TOTAL:    S/{Decimal(venta.total):.2f}", total_bold)
    )

    # --- Pie ---
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("¡Gracias por su compra!", ticket_bold))

    doc.build(elements)
    return buffer.getvalue()
