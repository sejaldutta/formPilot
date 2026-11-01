from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


FieldType = Literal[
    "text",
    "email",
    "tel",
    "number",
    "date",
    "select",
    "radio",
    "checkbox",
    "textarea",
    "file",
    "password",
    "unknown",
]


class FormFieldMetadata(BaseModel):
    label: str = Field(min_length=1, max_length=300)
    type: FieldType = "unknown"
    required: bool = False
    options: list[str] = Field(default_factory=list, max_length=100)


class FormIdentificationRequest(BaseModel):
    pageTitle: str = Field(default="", max_length=500)
    pageUrl: str = Field(max_length=2000)
    formTitle: str = Field(default="", max_length=500)
    fields: list[FormFieldMetadata] = Field(min_length=1, max_length=150)


class FormIdentificationResponse(BaseModel):
    formName: str
    purpose: str
    category: str
    confidence: float = Field(ge=0, le=1)


class FormExplanationRequest(BaseModel):
    formName: str = Field(min_length=1, max_length=300)
    purpose: str = Field(default="", max_length=1000)
    fields: list[FormFieldMetadata] = Field(min_length=1, max_length=150)


class FieldExplanation(BaseModel):
    label: str
    explanation: str
    examples: list[str] = Field(default_factory=list)


class FormExplanationResponse(BaseModel):
    overview: str
    instructions: list[str]
    fieldExplanations: list[FieldExplanation]
    disclaimer: str
