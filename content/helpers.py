"""Tiny helpers so chapter files read like notes instead of JSON.

Inline markup supported by the app: **bold** and `code`.
Questions are authored with the correct option FIRST; the app shuffles them.
"""


def P(text):
    return {"t": "p", "text": text}


def B(*items):
    return {"t": "bullets", "items": list(items)}


def N(*items):
    return {"t": "steps", "items": list(items)}


def C(text):
    return {"t": "code", "text": text.strip("\n")}


def T(*rows):
    return {"t": "table", "rows": [list(r) for r in rows]}


def TIP(text):
    return {"t": "tip", "text": text}


def WARN(text):
    return {"t": "warn", "text": text}


def S(title, *blocks):
    return {"title": title, "blocks": list(blocks)}


def Q(q, correct, wrong, explain, code=None):
    d = {"q": q, "options": [correct] + list(wrong), "answer": 0, "explain": explain}
    if code:
        d["code"] = code.strip("\n")
    return d


def F(front, back):
    return {"front": front, "back": back}


def chapter(id, title, subtitle, week, sections, takeaways, lab, flashcards, questions):
    return {
        "id": id,
        "title": title,
        "subtitle": subtitle,
        "week": week,
        "sections": sections,
        "takeaways": takeaways,
        "lab": lab,
        "flashcards": flashcards,
        "questions": questions,
    }


def LAB(title, goal, *steps):
    return {"title": title, "goal": goal, "steps": list(steps)}
