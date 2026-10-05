"""Seed database with mockup data.

This script populates the database with the 7 agents, 6 knowledge bases,
and sample documents from the design mockup for Phase 0 testing.

Run with: python seed.py
"""

import asyncio
import sys

from app.core.config import settings
from app.core.db import init_engine


async def main():
    """Seed the database."""
    print("Seeding Agent Studio database...")
    print(f"Database: {settings.database_url}")

    try:
        await init_engine()
        print("✓ Database initialized")

        # Phase 0: Just create tables, no actual seeding yet
        print("✓ Ready for Phase 1 data seeding")

    except Exception as e:
        print(f"✗ Seeding failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
