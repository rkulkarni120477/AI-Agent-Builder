"""Email service for sending notifications."""

import httpx
from app.core.config import settings


class EmailService:
    """Send emails via SendGrid or Mailgun."""

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str | None = None,
    ) -> dict[str, bool | str]:
        """Send an email via configured provider.

        Returns dict with 'success' (bool) and 'error' (str if failed).
        """
        if settings.email_provider == "sendgrid":
            return await self._send_via_sendgrid(to_email, subject, html_body, text_body)
        elif settings.email_provider == "mailgun":
            return await self._send_via_mailgun(to_email, subject, html_body, text_body)
        else:
            return {"success": False, "error": "Unknown email provider"}

    async def _send_via_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str | None = None,
    ) -> dict[str, bool | str]:
        """Send email via SendGrid API."""
        if not settings.sendgrid_api_key:
            return {"success": False, "error": "SendGrid API key not configured"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    json={
                        "personalizations": [{"to": [{"email": to_email}]}],
                        "from": {
                            "email": settings.from_email,
                            "name": settings.from_name,
                        },
                        "subject": subject,
                        "content": [
                            {"type": "text/plain", "value": text_body or ""}
                            if text_body
                            else {},
                            {"type": "text/html", "value": html_body},
                        ],
                    },
                    headers={
                        "Authorization": f"Bearer {settings.sendgrid_api_key}",
                        "Content-Type": "application/json",
                    },
                )

                if response.status_code in (200, 201, 202):
                    return {"success": True}
                else:
                    return {
                        "success": False,
                        "error": f"SendGrid error: {response.status_code}",
                    }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _send_via_mailgun(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str | None = None,
    ) -> dict[str, bool | str]:
        """Send email via Mailgun API."""
        if not settings.mailgun_api_key or not settings.mailgun_domain:
            return {
                "success": False,
                "error": "Mailgun API key or domain not configured",
            }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://api.mailgun.net/v3/{settings.mailgun_domain}/messages",
                    auth=("api", settings.mailgun_api_key),
                    data={
                        "from": f"{settings.from_name} <{settings.from_email}>",
                        "to": to_email,
                        "subject": subject,
                        "text": text_body or "",
                        "html": html_body,
                    },
                )

                if response.status_code in (200, 201):
                    return {"success": True}
                else:
                    return {
                        "success": False,
                        "error": f"Mailgun error: {response.status_code}",
                    }
        except Exception as e:
            return {"success": False, "error": str(e)}


email_service = EmailService()
