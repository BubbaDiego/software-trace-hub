"""SWDD .docx importer — parses SW Detailed Design documents.

Extracts:
  - Software Items (ASDD domains) from H2 headings
  - Software Units from H4 headings under "Software Units" H3 sections
  - Full heading hierarchy for navigation
  - Section content (descriptions, interfaces, risks, test areas)
"""
from __future__ import annotations

import re
from pathlib import Path

from core.shared.database import SharedDatabase


def import_swdd_docx(
    file_path: str,
    db: SharedDatabase | None = None,
) -> dict:
    """Import a SW Detailed Design .docx file.

    Returns dict with import stats.
    """
    try:
        import docx
    except ImportError:
        raise ImportError("python-docx is required: pip install python-docx")

    db = db or SharedDatabase.get_instance()
    file_path = str(Path(file_path).resolve())
    doc = docx.Document(file_path)

    # Clear existing SWDD data
    db.execute("DELETE FROM swdd_units")
    db.execute("DELETE FROM swdd_items")
    db.execute("DELETE FROM swdd_sections")
    db.commit()

    # Parse all headings with their content
    headings = []
    current_content = []

    for p in doc.paragraphs:
        if p.style.name.startswith('Heading'):
            # Save previous heading's content
            if headings:
                headings[-1]["content"] = " ".join(current_content).strip()
                headings[-1]["word_count"] = len(current_content)
                current_content = []

            level_str = p.style.name.replace('Heading ', '')
            level = int(level_str) if level_str.isdigit() else 1
            text = p.text.strip()

            # Extract ASDD reference
            asdd_match = re.search(r'\[ASDD-(\w+)\]', text)
            asdd_ref = asdd_match.group(1) if asdd_match else ""

            headings.append({
                "level": level,
                "text": text,
                "asdd_ref": asdd_ref,
                "content": "",
                "word_count": 0,
            })
        else:
            txt = p.text.strip()
            if txt:
                current_content.append(txt)

    # Finalize last heading
    if headings and current_content:
        headings[-1]["content"] = " ".join(current_content).strip()
        headings[-1]["word_count"] = len(current_content)

    # Build heading paths and insert sections
    path_stack = []  # [(level, text)]
    section_count = 0

    for h in headings:
        # Pop stack to current level
        while path_stack and path_stack[-1][0] >= h["level"]:
            path_stack.pop()
        path_stack.append((h["level"], h["text"]))

        heading_path = " > ".join(t for _, t in path_stack)
        parent_path = " > ".join(t for _, t in path_stack[:-1]) if len(path_stack) > 1 else ""
        h["heading_path"] = heading_path
        h["parent_path"] = parent_path

        # Classify section type
        text_lower = h["text"].lower()
        section_type = ""
        if "external interface" in text_lower:
            section_type = "interface"
        elif "software units" in text_lower and h["level"] == 3:
            section_type = "units_container"
        elif "assumptions" in text_lower or "constraints" in text_lower:
            section_type = "assumptions"
        elif "risk" in text_lower:
            section_type = "risks"
        elif "test area" in text_lower or "major test" in text_lower:
            section_type = "test_areas"
        elif "design consideration" in text_lower:
            section_type = "design_considerations"
        elif "decomposition" in text_lower:
            section_type = "decomposition"
        elif h["asdd_ref"] and h["level"] == 2:
            section_type = "software_item"
        elif h["level"] == 2:
            section_type = "design_overview"
        h["section_type"] = section_type

        db.execute(
            "INSERT INTO swdd_sections (heading_level, heading_text, heading_path, "
            "parent_path, asdd_ref, section_type, content_preview, word_count) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                h["level"],
                h["text"][:500],
                heading_path[:1000],
                parent_path[:1000],
                h["asdd_ref"],
                section_type,
                h["content"][:500],
                h["word_count"],
            ),
        )
        section_count += 1

    db.commit()

    # Extract Software Items (H2 with ASDD refs or in DETAILED DESIGN section)
    in_detailed = False
    current_item = None
    current_h3 = ""
    items = []
    units = []

    for h in headings:
        if h["level"] == 1:
            if "DETAILED DESIGN" in h["text"] and "OTS" not in h["text"]:
                in_detailed = True
            elif in_detailed:
                in_detailed = False

        if h["level"] == 2:
            # Save previous item
            if current_item:
                items.append(current_item)

            # Extract name from title
            title = h["text"]
            asdd = h["asdd_ref"]
            # Clean name: remove ASDD ref and domain suffix
            name = re.sub(r'\s*\[ASDD-\w+\]', '', title).strip()
            # Remove " Domain" suffix
            name = re.sub(r'\s+Domain$', '', name).strip()

            parent = "DETAILED DESIGN" if in_detailed else "DESIGN OVERVIEWS"
            section_type = "software_item" if asdd else "design_overview"

            current_item = {
                "asdd_ref": asdd,
                "name": name,
                "full_title": title[:300],
                "section_type": section_type,
                "parent_section": parent,
                "description": "",
                "external_interface": "",
                "assumptions": "",
                "risks": "",
                "test_areas": "",
                "heading_path": h["heading_path"],
                "units": [],
            }
            current_h3 = ""

        elif h["level"] == 3 and current_item:
            current_h3 = h["text"].strip()
            text_lower = current_h3.lower()
            content = h["content"][:1000]

            if "software item description" in text_lower or "overview" in text_lower:
                if not current_item["description"]:
                    current_item["description"] = content
            elif "external interface" in text_lower:
                current_item["external_interface"] = content
            elif "assumptions" in text_lower or "constraints" in text_lower:
                current_item["assumptions"] = content
            elif "risk" in text_lower:
                current_item["risks"] = content
            elif "test area" in text_lower or "major test" in text_lower:
                current_item["test_areas"] = content

        elif h["level"] == 4 and current_item and "software units" in current_h3.lower():
            unit_name = h["text"].strip()
            if unit_name and len(unit_name) < 200:
                current_item["units"].append({
                    "name": unit_name,
                    "asdd_ref": current_item["asdd_ref"],
                    "description": h["content"][:500],
                    "heading_path": h["heading_path"],
                })

    # Don't forget the last item
    if current_item:
        items.append(current_item)

    # Insert items and units
    item_count = 0
    unit_count = 0

    for item in items:
        db.execute(
            "INSERT INTO swdd_items (asdd_ref, name, full_title, section_type, parent_section, "
            "description, external_interface, assumptions, risks, test_areas, unit_count, "
            "heading_level, heading_path) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                item["asdd_ref"],
                item["name"][:200],
                item["full_title"],
                item["section_type"],
                item["parent_section"],
                item["description"],
                item["external_interface"],
                item["assumptions"],
                item["risks"],
                item["test_areas"],
                len(item["units"]),
                2,
                item["heading_path"][:1000],
            ),
        )
        item_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        item_count += 1

        for unit in item["units"]:
            db.execute(
                "INSERT INTO swdd_units (item_id, asdd_ref, name, description, heading_path) "
                "VALUES (?, ?, ?, ?, ?)",
                (
                    item_id,
                    unit["asdd_ref"],
                    unit["name"][:200],
                    unit["description"],
                    unit["heading_path"][:1000],
                ),
            )
            unit_count += 1

    db.commit()

    return {
        "status": "success",
        "items_imported": item_count,
        "units_imported": unit_count,
        "sections_imported": section_count,
        "total_headings": len(headings),
    }
