"""Notification service for sending agent run notifications."""

from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Notification, UserSettings, Run, Agent, User
from app.services.email import email_service


class NotificationService:
    """Handle sending notifications and managing notification queue."""

    async def send_run_notification(
        self,
        run_id: str,
        agent_id: str,
        user_id: str,
        run_status: str,
        session: AsyncSession,
    ) -> None:
        """
        Queue a notification for an agent run completion.

        Args:
            run_id: ID of the run that completed
            agent_id: ID of the agent
            user_id: ID of the user who should be notified
            run_status: Status of the run (completed, failed)
            session: Database session
        """
        # Get user settings
        user_settings_result = await session.execute(
            select(UserSettings).where(UserSettings.user_id == user_id)
        )
        user_settings = user_settings_result.scalars().first()

        # Check if notifications are enabled and email is configured
        if not user_settings or not user_settings.notifications_enabled:
            return
        if not user_settings.notification_email:
            return

        # Check if user wants notifications for this status
        if run_status == "completed" and not user_settings.notify_on_success:
            return
        if run_status == "failed" and not user_settings.notify_on_failure:
            return

        # Get run, agent, and user info for email content
        run_result = await session.execute(select(Run).where(Run.id == run_id))
        run = run_result.scalars().first()

        agent_result = await session.execute(select(Agent).where(Agent.id == agent_id))
        agent = agent_result.scalars().first()

        user_result = await session.execute(select(User).where(User.id == user_id))
        user = user_result.scalars().first()

        if not run or not agent or not user:
            return

        # Create notification record
        notification = Notification(
            user_id=user_id,
            run_id=run_id,
            agent_id=agent_id,
            recipient_email=user_settings.notification_email,
            subject=self._generate_subject(agent.name, run_status),
            status="pending",
        )
        session.add(notification)
        await session.flush()

        # Send email asynchronously in background
        # For now, we'll send it immediately but it could be queued
        await self._send_notification_email(
            notification_id=notification.id,
            to_email=user_settings.notification_email,
            agent_name=agent.name,
            run_status=run_status,
            run_id=run_id,
            user_name=user.name,
            session=session,
        )

    async def _send_notification_email(
        self,
        notification_id: str,
        to_email: str,
        agent_name: str,
        run_status: str,
        run_id: str,
        user_name: str,
        session: AsyncSession,
    ) -> None:
        """Send the actual notification email."""
        # Generate email content
        subject = self._generate_subject(agent_name, run_status)
        html_body = self._generate_html_body(
            agent_name, run_status, run_id, user_name
        )
        text_body = self._generate_text_body(
            agent_name, run_status, run_id, user_name
        )

        # Send email
        result = await email_service.send_email(to_email, subject, html_body, text_body)

        # Update notification record
        notification_result = await session.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notification = notification_result.scalars().first()

        if notification:
            if result["success"]:
                notification.status = "sent"
                notification.sent_at = datetime.utcnow().isoformat()
            else:
                notification.status = "failed"
                notification.error_message = result.get("error", "Unknown error")

            await session.commit()

    def _generate_subject(self, agent_name: str, run_status: str) -> str:
        """Generate email subject line."""
        if run_status == "completed":
            return f"✅ Agent '{agent_name}' completed successfully"
        elif run_status == "failed":
            return f"❌ Agent '{agent_name}' run failed"
        else:
            return f"Agent '{agent_name}' run update"

    def _generate_html_body(
        self,
        agent_name: str,
        run_status: str,
        run_id: str,
        user_name: str,
    ) -> str:
        """Generate HTML email body."""
        status_icon = "✅" if run_status == "completed" else "❌"
        status_text = "completed successfully" if run_status == "completed" else "failed"

        return f"""
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2>{status_icon} Agent Run {status_text.title()}</h2>
    <p>Hi {user_name},</p>
    <p>The agent <strong>{agent_name}</strong> has {status_text}.</p>
    <p><strong>Run ID:</strong> <code>{run_id}</code></p>
    <p>Log in to Agent Studio to view details and results.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #666; font-size: 12px;">
      This is an automated notification from Agent Studio.
      You can manage notification preferences in your settings.
    </p>
  </body>
</html>
"""

    def _generate_text_body(
        self,
        agent_name: str,
        run_status: str,
        run_id: str,
        user_name: str,
    ) -> str:
        """Generate plain text email body."""
        status_text = "completed successfully" if run_status == "completed" else "failed"

        return f"""
Agent Run {status_text.upper()}

Hi {user_name},

The agent {agent_name} has {status_text}.

Run ID: {run_id}

Log in to Agent Studio to view details and results.

---
This is an automated notification from Agent Studio.
You can manage notification preferences in your settings.
"""


notification_service = NotificationService()
