"""Format agent results as TipTap blocks."""

from typing import Optional, Any
import json


class BlockFormatter:
    """Convert agent output to TipTap block structure."""

    @staticmethod
    def create_paragraph(content: str) -> dict:
        """Create a paragraph block."""
        return {
            "type": "paragraph",
            "content": [{"type": "text", "text": content}],
        }

    @staticmethod
    def create_heading(content: str, level: int = 1) -> dict:
        """Create a heading block (1-3)."""
        return {
            "type": "heading",
            "attrs": {"level": min(3, max(1, level))},
            "content": [{"type": "text", "text": content}],
        }

    @staticmethod
    def create_code_block(code: str, language: str = "text") -> dict:
        """Create a code block."""
        return {
            "type": "codeBlock",
            "attrs": {"language": language},
            "content": [{"type": "text", "text": code}],
        }

    @staticmethod
    def create_bullet_list(items: list[str]) -> dict:
        """Create a bullet list."""
        return {
            "type": "bulletList",
            "content": [
                {
                    "type": "listItem",
                    "content": [{"type": "paragraph", "content": [{"type": "text", "text": item}]}],
                }
                for item in items
            ],
        }

    @staticmethod
    def create_ordered_list(items: list[str]) -> dict:
        """Create an ordered list."""
        return {
            "type": "orderedList",
            "content": [
                {
                    "type": "listItem",
                    "content": [{"type": "paragraph", "content": [{"type": "text", "text": item}]}],
                }
                for item in items
            ],
        }

    @staticmethod
    def create_block_quote(content: str) -> dict:
        """Create a block quote."""
        return {
            "type": "blockquote",
            "content": [{"type": "paragraph", "content": [{"type": "text", "text": content}]}],
        }

    @staticmethod
    def create_horizontal_rule() -> dict:
        """Create a horizontal rule."""
        return {"type": "horizontalRule"}

    @staticmethod
    def format_output(
        agent_output: str,
        agent_name: str = "Agent",
        agent_type: str = "Unknown",
    ) -> dict:
        """
        Format agent output as a document with header and content.

        Returns a TipTap document structure.
        """
        blocks = [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": f"Result from ", "marks": []},
                    {
                        "type": "text",
                        "text": agent_name,
                        "marks": [{"type": "bold"}],
                    },
                    {"type": "text", "text": f" ({agent_type})"},
                ],
            },
            BlockFormatter.create_horizontal_rule(),
            BlockFormatter.create_paragraph(agent_output),
        ]

        return {
            "type": "doc",
            "content": blocks,
        }

    @staticmethod
    def format_structured_output(
        data: dict[str, Any],
        agent_name: str = "Agent",
    ) -> dict:
        """
        Format structured output (JSON) as formatted blocks.

        Attempts to intelligently display JSON data.
        """
        blocks = [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": f"Structured Result from {agent_name}"},
                ],
            },
            BlockFormatter.create_horizontal_rule(),
        ]

        # Format each key-value pair
        for key, value in data.items():
            # Add key as heading
            blocks.append(BlockFormatter.create_heading(key, level=2))

            # Format value
            if isinstance(value, list):
                blocks.append(BlockFormatter.create_bullet_list([str(v) for v in value]))
            elif isinstance(value, dict):
                blocks.append(
                    BlockFormatter.create_code_block(
                        json.dumps(value, indent=2), "json"
                    )
                )
            elif isinstance(value, str) and len(value) > 100:
                blocks.append(BlockFormatter.create_paragraph(value))
            else:
                blocks.append(BlockFormatter.create_paragraph(str(value)))

        return {
            "type": "doc",
            "content": blocks,
        }

    @staticmethod
    def merge_blocks(existing_doc: dict, new_blocks: list[dict]) -> dict:
        """
        Merge new blocks into existing document.

        Adds blocks at the end, before the final closing.
        """
        if not existing_doc.get("content"):
            existing_doc["content"] = []

        # Add separator before new content
        existing_doc["content"].append(BlockFormatter.create_horizontal_rule())

        # Add new blocks
        existing_doc["content"].extend(new_blocks)

        return existing_doc
