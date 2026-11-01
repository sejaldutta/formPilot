import type { DetectedField, FieldKind } from '../../lib/formTypes';

const KIND_LABELS: Record<FieldKind, string> = {
  text: 'Text',
  email: 'Email',
  tel: 'Phone number',
  number: 'Number',
  date: 'Date',
  textarea: 'Long text',
  select: 'Dropdown',
  multiselect: 'Multi-select',
  radio: 'Single choice',
  checkbox: 'Checkbox',
  checkboxGroup: 'Multiple choice',
  file: 'File upload',
};

interface Props {
  field: DetectedField;
  onSelect: (fieldId: string) => void;
}

export default function FieldRow({ field, onSelect }: Props) {
  const optionCount = field.options?.length;
  const kindText =
    optionCount !== undefined
      ? `${KIND_LABELS[field.kind]}, ${optionCount} ${optionCount === 1 ? 'option' : 'options'}`
      : KIND_LABELS[field.kind];

  return (
    <li>
      <button
        type="button"
        className="field"
        onClick={() => onSelect(field.id)}
        title="Show this field on the page"
      >
        <span className="field__label">{field.label || 'Unlabelled field'}</span>
        <span className="field__meta">
          <span>{kindText}</span>
          {field.required && <span className="field__required">Required</span>}
        </span>
        {/* Temporary: shows which heuristic found the label, to help tune the detector. */}
        <span className="field__debug">Label found via {field.labelSource}</span>
      </button>
    </li>
  );
}
