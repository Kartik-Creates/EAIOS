import re
from typing import Any, Dict, List

from app.schemas.workflow import WorkflowParameter
from app.workflows.enums import ParameterType
from app.workflows.plan import FieldValidationError, ValidationSummary


class ParameterValidator:
    """
    Reusable parameter validation engine.
    Validates input dictionary against a WorkflowParameter schema list.
    """

    @staticmethod
    def validate(
        schema: List[WorkflowParameter],
        inputs: Dict[str, Any],
    ) -> ValidationSummary:
        errors: List[FieldValidationError] = []

        for param in schema:
            value = inputs.get(param.id)

            # 1. Required Check
            if param.required and (value is None or value == ""):
                errors.append(
                    FieldValidationError(
                        field_id=param.id,
                        field_label=param.label,
                        message=f"'{param.label}' is required.",
                    )
                )
                continue

            # Skip type & rule checks if optional field is omitted
            if value is None or value == "":
                continue

            rules = param.validation_rules

            # 2. Type Validation
            if param.type == ParameterType.NUMBER:
                if not isinstance(value, (int, float)):
                    try:
                        num_val = float(value)
                        value = num_val
                    except (ValueError, TypeError):
                        errors.append(
                            FieldValidationError(
                                field_id=param.id,
                                field_label=param.label,
                                message=f"'{param.label}' must be a number.",
                            )
                        )
                        continue

                # Range check
                if rules:
                    if rules.min_value is not None and value < rules.min_value:
                        errors.append(
                            FieldValidationError(
                                field_id=param.id,
                                field_label=param.label,
                                message=f"'{param.label}' must be at least {rules.min_value}.",
                            )
                        )
                    if rules.max_value is not None and value > rules.max_value:
                        errors.append(
                            FieldValidationError(
                                field_id=param.id,
                                field_label=param.label,
                                message=f"'{param.label}' must not exceed {rules.max_value}.",
                            )
                        )

            elif param.type in (ParameterType.STRING, ParameterType.TEXTAREA):
                val_str = str(value)
                if rules:
                    if rules.min_length is not None and len(val_str) < rules.min_length:
                        errors.append(
                            FieldValidationError(
                                field_id=param.id,
                                field_label=param.label,
                                message=f"'{param.label}' must be at least {rules.min_length} characters.",
                            )
                        )
                    if rules.max_length is not None and len(val_str) > rules.max_length:
                        errors.append(
                            FieldValidationError(
                                field_id=param.id,
                                field_label=param.label,
                                message=f"'{param.label}' must not exceed {rules.max_length} characters.",
                            )
                        )
                    if rules.regex_pattern:
                        if not re.search(rules.regex_pattern, val_str):
                            errors.append(
                                FieldValidationError(
                                    field_id=param.id,
                                    field_label=param.label,
                                    message=f"'{param.label}' format is invalid.",
                                )
                            )

            elif param.type == ParameterType.SELECT:
                if rules and rules.options:
                    if value not in rules.options:
                        errors.append(
                            FieldValidationError(
                                field_id=param.id,
                                field_label=param.label,
                                message=f"'{param.label}' must be one of: {', '.join(rules.options)}.",
                            )
                        )

            elif param.type == ParameterType.BOOLEAN:
                if not isinstance(value, bool):
                    if str(value).lower() not in ("true", "false", "1", "0"):
                        errors.append(
                            FieldValidationError(
                                field_id=param.id,
                                field_label=param.label,
                                message=f"'{param.label}' must be a boolean.",
                            )
                        )

        return ValidationSummary(
            is_valid=len(errors) == 0,
            errors=errors,
        )
