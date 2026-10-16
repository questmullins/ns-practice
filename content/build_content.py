"""Builds app/src/main/assets/content.json from the chapter files.

Run from the repo root:  python3 content/build_content.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from ch01_03 import CH1, CH2, CH3  # noqa: E402
from ch04_06 import CH4, CH5, CH6  # noqa: E402
from ch07_10 import CH7, CH8, CH9, CH10  # noqa: E402

GLOSSARY = [
    ("Internal ID", "Numeric primary key of a record or list value, unique per record type."),
    ("Script ID", "Text ID of a custom object, e.g. custbody_rush_order."),
    ("File Cabinet", "NetSuite's file system, where script files live (usually under SuiteScripts/)."),
    ("Sourcing", "Auto-filling fields from related records, like terms and address from the customer."),
    ("Transform", "Creating a record from another, e.g. Sales Order to Invoice (record.transform)."),
    ("Execution context", "What triggered a script: UI, CSV import, web services, scheduled, and so on."),
    ("OneWorld", "Multi-subsidiary edition of NetSuite."),
    ("SuiteApp", "A packaged customization installable in other accounts."),
    ("SuiteAnswers", "NetSuite's support knowledge base."),
    ("Body field", "A field on the record header, one value per record."),
    ("Sublist", "A table of lines on a record, like the item lines on a sales order."),
    ("Subrecord", "A record nested inside another record, like an address or inventory detail."),
    ("Main Line", "The header row of a transaction in searches. Set Main Line = true for one row per transaction."),
    ("Saved search", "NetSuite's reusable query builder (script IDs start with customsearch)."),
    ("SuiteQL", "Read-only SQL dialect over NetSuite's analytics data source."),
    ("SuiteScript", "NetSuite's JavaScript API. Write version 2.1."),
    ("Entry point", "A function NetSuite calls for a script type, like beforeSubmit or execute."),
    ("Script record", "The record that registers a script file with NetSuite."),
    ("Script deployment", "Where, when and for whom a script runs, with its status and log level."),
    ("Testing status", "Deployment status that runs the script only for its owner."),
    ("Released status", "Deployment status that runs the script for its audience."),
    ("Execution Log", "Where log.debug/audit/error entries appear, on the script deployment."),
    ("Governance", "Usage-unit budgets that limit what one script execution can do."),
    ("Usage unit", "The cost of an API call. Running out throws SSS_USAGE_LIMIT_EXCEEDED."),
    ("Map/Reduce", "Script type that processes large data sets in parallel stages and yields automatically."),
    ("Suitelet", "Script type that serves a custom page at its own URL."),
    ("RESTlet", "Script type that exposes your own HTTP endpoint."),
    ("User Event", "Script type that runs on the server when records are loaded or saved."),
    ("Client script", "Script type that runs in the browser on a form."),
    ("SuiteFlow", "NetSuite's visual workflow builder (a state machine on a record type)."),
    ("SuiteTalk", "NetSuite's web services: REST and the older SOAP API."),
    ("TBA", "Token-Based Authentication: OAuth 1.0a signed requests with consumer and token credentials."),
    ("Integration record", "Defines an external application and provides its consumer key and secret."),
    ("SDF", "SuiteCloud Development Framework: customizations as files you version and deploy."),
    ("ACP", "Account Customization Project, an SDF project for your own account."),
    ("Sandbox", "A refreshable copy of production for development and testing."),
    ("Release Preview", "Temporary account for testing against the next NetSuite release."),
    ("Script parameter", "A per-deployment setting on a script record (IDs start with custscript_)."),
    ("custpage_", "Prefix for fields added on the fly in Suitelets or beforeLoad; not stored."),
    ("XEDIT", "User Event type for inline edits and submitFields."),
    ("Dynamic mode", "Record mode that sources fields as you set them, like the UI."),
    ("Standard mode", "Default record mode; values can be set in any order and source on save."),
    ("Classification", "Subsidiary, department, class or location on a transaction."),
    ("Custom record type", "A table you define, with its own fields, forms and permissions (customrecord_)."),
    ("Custom list", "A simple set of dropdown values (customlist_)."),
]


def validate(chapters):
    problems = []
    for ch in chapters:
        for i, q in enumerate(ch["questions"]):
            if len(q["options"]) != 4:
                problems.append(f"ch{ch['id']} q{i}: expected 4 options")
            if len(set(q["options"])) != len(q["options"]):
                problems.append(f"ch{ch['id']} q{i}: duplicate options")
    if problems:
        raise SystemExit("\n".join(problems))


def main():
    chapters = [CH1, CH2, CH3, CH4, CH5, CH6, CH7, CH8, CH9, CH10]
    validate(chapters)
    data = {
        "version": 1,
        "chapters": chapters,
        "glossary": [{"term": t, "def": d} for t, d in sorted(GLOSSARY, key=lambda g: g[0].lower())],
    }
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(root, "app", "src", "main", "assets", "content.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    nq = sum(len(c["questions"]) for c in chapters)
    nf = sum(len(c["flashcards"]) for c in chapters)
    print(f"Wrote {out}: {len(chapters)} chapters, {nq} questions, {nf} flashcards, {len(GLOSSARY)} glossary terms")


if __name__ == "__main__":
    main()
