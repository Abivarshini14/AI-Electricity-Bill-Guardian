"""
SMTP email service. Safe no-op if SMTP is not configured or fails.
"""
import smtplib
from email.mime.text import MIMEText

from app.core.config import settings


def send_email(to_email: str, subject: str, body: str) -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME or not settings.SMTP_FROM_EMAIL:
        return False
    try:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
        return True
    except Exception:
        return False
