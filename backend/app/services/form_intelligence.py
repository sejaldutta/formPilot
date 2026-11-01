import json
from openai import AsyncOpenAI

from app.config import settings
from app.models import (
    FormIdentificationRequest,
    FormIdentificationResponse,
    FormExplanationRequest,
    FormExplanationResponse,
)


class ModelConfigurationError(Exception):
    pass


class FormIntelligenceService:
    def __init__(self) -> None:
        if not settings.model_api_key:
            self.client = None
        else:
            client_options = {
                "api_key": settings.model_api_key,
                "timeout": settings.model_timeout_seconds,
            }

            if settings.model_base_url:
                client_options["base_url"] = settings.model_base_url

            self.client = AsyncOpenAI(**client_options)

    async def _generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        if self.client is None:
            raise ModelConfigurationError(
                "The model API key is not configured."
            )

        response = await self.client.chat.completions.create(
            model=settings.model_name,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("The model returned an empty response.")

        return json.loads(content)

    async def identify_form(
        self,
        request: FormIdentificationRequest,
    ) -> FormIdentificationResponse:
        system_prompt = """
You are FormPilot AI, an assistant that helps users understand
Indian government and public-service forms.

Use only the supplied form metadata. Do not invent official status,
eligibility requirements, deadlines, or legal obligations.

Return valid JSON with:
- formName
- purpose
- category
- confidence (0 to 1)

If the form cannot be identified reliably, say so and use a low confidence.
"""

        user_prompt = json.dumps(
            request.model_dump(),
            ensure_ascii=False,
        )

        result = await self._generate_json(
            system_prompt,
            user_prompt,
        )

        return FormIdentificationResponse.model_validate(result)

    async def explain_form(
        self,
        request: FormExplanationRequest,
    ) -> FormExplanationResponse:
        system_prompt = """
You explain government form fields in plain, accessible language.

Return valid JSON with:
- overview: short explanation of the form
- instructions: list of general completion instructions
- fieldExplanations: list of objects with label, explanation, examples
- disclaimer: short note that users should verify requirements with
  the official issuing authority

Important:
- Do not claim to provide legal advice.
- Do not invent eligibility rules or official requirements.
- If a field's meaning is ambiguous, explicitly say that it is unclear.
- Do not request or infer personal data.
"""

        user_prompt = json.dumps(
            request.model_dump(),
            ensure_ascii=False,
        )

        result = await self._generate_json(
            system_prompt,
            user_prompt,
        )

        return FormExplanationResponse.model_validate(result)


form_intelligence = FormIntelligenceService()
