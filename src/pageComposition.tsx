import { useId, type AriaAttributes, type HTMLAttributes, type ReactNode } from "react";

export type PageMeasure = "narrow" | "regular" | "wide";
export type PageHeaderDensity = "compact" | "regular";
export type SettingsGroupTone = "default" | "danger";
export type SettingsGroupHeadingLevel = 2 | 3 | 4;

export interface PageContainerProps extends HTMLAttributes<HTMLElement> {
  measure?: PageMeasure;
  as?: "main" | "section" | "div";
}

export function PageContainer({
  measure = "regular",
  as: Element = "main",
  className,
  ...props
}: PageContainerProps) {
  return (
    <Element
      className={`etu-page-container etu-page-container--${measure}${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  kicker?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  density?: PageHeaderDensity;
  headingLevel?: 1 | 2;
}

export function PageHeader({
  title,
  kicker,
  description,
  actions,
  density = "regular",
  headingLevel = 1,
  className,
  ...props
}: PageHeaderProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <header
      className={`etu-page-header etu-page-header--${density}${className ? ` ${className}` : ""}`}
      {...props}
    >
      <div className="etu-page-header-copy">
        {kicker && <div className="etu-page-header-kicker">{kicker}</div>}
        <Heading className="etu-page-header-title">{title}</Heading>
        {description && <div className="etu-page-header-description">{description}</div>}
      </div>
      {actions && <div className="etu-page-header-actions">{actions}</div>}
    </header>
  );
}

export interface SettingsGroupProps extends HTMLAttributes<HTMLElement> {
  heading: string;
  headingLevel?: SettingsGroupHeadingLevel;
  description?: ReactNode;
  tone?: SettingsGroupTone;
}

export function SettingsGroup({
  heading,
  headingLevel = 2,
  description,
  tone = "default",
  className,
  children,
  ...props
}: SettingsGroupProps) {
  const headingId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  if (!heading.trim()) {
    throw new Error("SettingsGroup requires a non-empty heading.");
  }

  return (
    <section
      className={`etu-settings-group etu-settings-group--${tone}${className ? ` ${className}` : ""}`}
      aria-labelledby={headingId}
      {...props}
    >
      <header className="etu-settings-group-header">
        <Heading className="etu-settings-group-title" id={headingId}>{heading}</Heading>
        {description && <div className="etu-settings-group-description">{description}</div>}
      </header>
      <div className="etu-settings-list">{children}</div>
    </section>
  );
}

export interface SettingsRowProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  description?: ReactNode;
  action?: (props: SettingsRowActionProps) => ReactNode;
}

export type SettingsRowActionProps = Pick<
  AriaAttributes,
  "aria-labelledby" | "aria-describedby"
>;

export function SettingsRow({
  label,
  description,
  action,
  className,
  children,
  ...props
}: SettingsRowProps) {
  const rowId = useId();
  const labelId = `${rowId}-label`;
  const descriptionId = description ? `${rowId}-description` : undefined;
  const actionNode = action
    ? action({
        "aria-labelledby": labelId,
        "aria-describedby": descriptionId,
      })
    : action;

  return (
    <div className={`etu-settings-row${className ? ` ${className}` : ""}`} {...props}>
      <div className="etu-settings-row-copy">
        <div className="etu-settings-row-label" id={labelId}>{label}</div>
        {description && <div className="etu-settings-row-description" id={descriptionId}>{description}</div>}
        {children}
      </div>
      {actionNode && <div className="etu-settings-row-action">{actionNode}</div>}
    </div>
  );
}
