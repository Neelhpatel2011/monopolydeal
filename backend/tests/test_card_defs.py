import json

from backend.app.schemas.card_defs import RawCard, raw_to_carddef


def test_property_group_populates_colors():
    raw = RawCard.model_validate(
        json.load(open("backend/cards/base/States Avenue.json", "r", encoding="utf-8"))
    )
    cd = raw_to_carddef(raw)
    assert cd is not None
    assert cd.kind == "property"
    assert cd.colors == ["pink"]
    assert cd.meta.get("property_group") == "pink"

