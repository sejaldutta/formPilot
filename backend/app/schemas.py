from typing import Any, Literal
from pydantic import BaseModel, Field, ConfigDict

class FormField(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(min_length=1, max_length=200)
    label: str = Field(min_length=1, max_length=500)
    field_type: str = Field(default="text", max_length=100)
    required: bool = False
    options: list[str] = Field(default_factory=list, max_length=100)
    current_value: str | None = Field(default=None, max_length=5000)

class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    form_title: str = Field(default="Form", max_length=500)
    page_url: str | None = Field(default=None, max_length=2000)
    page_context: str | None = Field(default=None, max_length=12000)
    fields: list[FormField] = Field(min_length=1, max_length=150)
    user_context: str | None = Field(default=None, max_length=12000)
    task: Literal["suggest", "explain", "review"] = "suggest"

class FieldSuggestion(BaseModel):
    field_id: str
    value: str | None = None
    rationale: str | None = None
    confidence: float = Field(default=0.0, ge=0, le=1)
    needs_user_input: bool = False

class AnalyzeResponse(BaseModel):
    suggestions: list[FieldSuggestion]
    summary: str = ""
    warnings: list[str] = Field(default_factory=list)
    model: str
