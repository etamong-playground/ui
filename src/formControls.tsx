import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type AriaAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  required: boolean;
  disabled: boolean;
}

interface FieldCopy {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  fieldClassName?: string;
}

export interface FieldProps extends FieldCopy, Pick<AriaAttributes, "aria-describedby" | "aria-invalid"> {
  id?: string;
  required?: boolean;
  disabled?: boolean;
  children: (control: FieldControlProps) => ReactNode;
}

function hasContent(value: ReactNode): boolean {
  return value !== undefined && value !== null && value !== false && value !== "";
}

export function Field({
  id,
  label,
  description,
  error,
  required = false,
  disabled = false,
  fieldClassName,
  children,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = hasContent(description) ? `${controlId}-description` : undefined;
  const errorId = hasContent(error) ? `${controlId}-error` : undefined;
  const descriptionIds = [describedBy, descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`etu-field${fieldClassName ? ` ${fieldClassName}` : ""}`}>
      <label className="etu-field-label" htmlFor={controlId}>
        {label}{required && <span className="etu-field-required" aria-hidden="true"> *</span>}
      </label>
      {children({
        id: controlId,
        "aria-describedby": descriptionIds,
        "aria-invalid": errorId ? true : invalid,
        required,
        disabled,
      })}
      {descriptionId && <div className="etu-field-description" id={descriptionId}>{description}</div>}
      {errorId && <div className="etu-field-error" id={errorId} role="alert">{error}</div>}
    </div>
  );
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "children" | "type">, FieldCopy {
  type?: "text" | "email" | "search" | "tel" | "url" | "number";
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({
  label, description, error, fieldClassName, className, id, required, disabled,
  "aria-describedby": describedBy, "aria-invalid": invalid, type = "text", ...props
}, ref) {
  return (
    <Field
      {...{ id, label, description, error, required, disabled, fieldClassName }}
      aria-describedby={describedBy}
      aria-invalid={invalid}
    >
      {(control) => <input {...props} {...control} type={type} ref={ref} className={`etu-input${className ? ` ${className}` : ""}`} />}
    </Field>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldCopy {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({
  label, description, error, fieldClassName, className, id, required, disabled, children,
  "aria-describedby": describedBy, "aria-invalid": invalid, ...props
}, ref) {
  return (
    <Field
      {...{ id, label, description, error, required, disabled, fieldClassName }}
      aria-describedby={describedBy}
      aria-invalid={invalid}
    >
      {(control) => <select {...props} {...control} ref={ref} className={`etu-select${className ? ` ${className}` : ""}`}>{children}</select>}
    </Field>
  );
});

export interface PasswordFieldProps extends Omit<TextFieldProps, "type"> {
  locale?: "ko" | "en";
  labels?: { show?: string; hide?: string };
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField({
  label, description, error, fieldClassName, className, id, required, disabled, labels, locale,
  "aria-describedby": describedBy, "aria-invalid": invalid, ...props
}, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<{ start: number; end: number; direction: "forward" | "backward" | "none" } | null>(null);
  const [visible, setVisible] = useState(false);
  const [documentLocale, setDocumentLocale] = useState<"ko" | "en">("en");
  useImperativeHandle(ref, () => inputRef.current!, []);
  useEffect(() => {
    if (locale === undefined) setDocumentLocale(document.documentElement.lang.toLowerCase().startsWith("ko") ? "ko" : "en");
  }, [locale]);
  const korean = (locale ?? documentLocale) === "ko";
  const toggleLabel = visible
    ? labels?.hide ?? (korean ? "비밀번호 숨기기" : "Hide password")
    : labels?.show ?? (korean ? "비밀번호 보기" : "Show password");

  useEffect(() => {
    const selection = selectionRef.current;
    const input = inputRef.current;
    if (!selection || !input) return;
    let cancelled = false;
    const cancelRestoration = () => { cancelled = true; };
    const onSelect = () => {
      if (input.selectionStart !== selection.start || input.selectionEnd !== selection.end) cancelRestoration();
    };
    const interactionEvents = ["pointerdown", "keydown", "beforeinput", "input", "blur"];
    for (const event of interactionEvents) input.addEventListener(event, cancelRestoration);
    input.addEventListener("select", onSelect);
    const restoreSelection = () => {
      if (!cancelled && input.selectionStart === 0 && input.selectionEnd === 0) {
        input.setSelectionRange(selection.start, selection.end, selection.direction);
      }
    };
    restoreSelection();
    // Browsers can clear selection after a password type change commits.
    const frame = requestAnimationFrame(restoreSelection);
    return () => {
      cancelRestoration();
      cancelAnimationFrame(frame);
      for (const event of interactionEvents) input.removeEventListener(event, cancelRestoration);
      input.removeEventListener("select", onSelect);
    };
  }, [visible]);

  return (
    <Field
      {...{ id, label, description, error, required, disabled, fieldClassName }}
      aria-describedby={describedBy}
      aria-invalid={invalid}
    >
      {(control) => (
        <div className="etu-password">
          <input {...props} {...control} type={visible ? "text" : "password"} ref={inputRef} className={`etu-input${className ? ` ${className}` : ""}`} />
          <button
            type="button"
            className="etu-password-toggle"
            disabled={disabled}
            aria-controls={control.id}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              const input = inputRef.current;
              selectionRef.current = input && input.selectionStart !== null && input.selectionEnd !== null
                ? { start: input.selectionStart, end: input.selectionEnd, direction: input.selectionDirection ?? "none" }
                : null;
              setVisible((value) => !value);
            }}
          >
            {toggleLabel}
          </button>
        </div>
      )}
    </Field>
  );
});
