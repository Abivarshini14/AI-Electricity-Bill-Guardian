import os
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from app.core.config import settings

BILLS_DIR = os.path.join(settings.UPLOAD_DIR, "bills")
RECEIPTS_DIR = os.path.join(settings.UPLOAD_DIR, "receipts")
REPORTS_DIR = os.path.join(settings.UPLOAD_DIR, "reports")
for d in (BILLS_DIR, RECEIPTS_DIR, REPORTS_DIR):
    os.makedirs(d, exist_ok=True)


def generate_bill_pdf(bill, prop, user) -> str:
    path = os.path.join(BILLS_DIR, f"bill_{bill.id}.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph("AI ELECTRICITY BILL GUARDIAN", styles["Title"]),
        Paragraph("Simulated / Estimated Bill - Not an official electricity board document", styles["Italic"]),
        Spacer(1, 12),
        Paragraph(f"Customer: {user.name} ({user.email})", styles["Normal"]),
        Paragraph(f"Property: {prop.name} - {prop.formatted_address}", styles["Normal"]),
        Paragraph(f"Consumer Number: {prop.consumer_number or 'N/A'} | Meter Number: {prop.meter_number or 'N/A'}", styles["Normal"]),
        Paragraph(f"Electricity Board: {prop.electricity_board or 'N/A'}", styles["Normal"]),
        Spacer(1, 12),
    ]

    data = [
        ["Billing Cycle", f"{bill.cycle_start} to {bill.cycle_end}"],
        ["Units Consumed", f"{bill.units_consumed} kWh"],
        ["Energy Charge", f"Rs. {bill.energy_charge}"],
        ["Fixed Charge", f"Rs. {bill.fixed_charge}"],
        ["Additional Charge", f"Rs. {bill.additional_charge}"],
        ["Tax", f"Rs. {bill.tax_amount}"],
        ["Total Amount", f"Rs. {bill.total_amount}"],
        ["Due Date", str(bill.due_date)],
        ["Status", bill.status.value if hasattr(bill.status, "value") else str(bill.status)],
    ]
    table = Table(data, colWidths=[80 * mm, 80 * mm])
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (0, -1), colors.whitesmoke),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC", styles["Normal"]))
    doc.build(elements)
    return path


def generate_receipt_pdf(payment, bill, prop, user) -> str:
    path = os.path.join(RECEIPTS_DIR, f"receipt_{payment.id}.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph("PAYMENT RECEIPT (Simulated)", styles["Title"]),
        Paragraph("This is a simulated academic payment - not a real financial transaction.", styles["Italic"]),
        Spacer(1, 12),
        Paragraph(f"Customer: {user.name}", styles["Normal"]),
        Paragraph(f"Property: {prop.name}", styles["Normal"]),
        Paragraph(f"Bill ID: {bill.id}", styles["Normal"]),
        Paragraph(f"Amount Paid: Rs. {payment.amount}", styles["Normal"]),
        Paragraph(f"Payment Method: {payment.method}", styles["Normal"]),
        Paragraph(f"Reference ID: {payment.reference_id}", styles["Normal"]),
        Paragraph(f"Status: {payment.status.value if hasattr(payment.status,'value') else payment.status}", styles["Normal"]),
        Paragraph(f"Paid At: {payment.paid_at}", styles["Normal"]),
    ]
    doc.build(elements)
    return path


def generate_energy_report_pdf(report_data: dict, filename_suffix: str) -> str:
    path = os.path.join(REPORTS_DIR, f"report_{filename_suffix}.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph("AI TWO-MONTH ENERGY REPORT", styles["Title"]),
        Spacer(1, 10),
    ]
    for section, content in report_data.items():
        elements.append(Paragraph(str(section), styles["Heading3"]))
        elements.append(Paragraph(str(content), styles["Normal"]))
        elements.append(Spacer(1, 8))
    doc.build(elements)
    return path
