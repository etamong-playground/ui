import { useState } from "react";
import { Field, PasswordField, Select, TextField, useLocale, useT } from "@etamong-playground/ui";
import { FeatureTag } from "../FeatureTag";

export function FormsSection() {
  const t = useT();
  const [locale] = useLocale();
  const [name, setName] = useState("");
  const [region, setRegion] = useState("ko");
  const [invalid, setInvalid] = useState(false);
  const [saved, setSaved] = useState("");

  return (
    <div className="sc-section">
      <div className="sc-prose"><h2>{t("section.forms")}</h2></div>
      <div className="sc-card sc-form-card">
        <div className="sc-card-header"><span>{t("forms.example")}</span><FeatureTag id="form-controls" /></div>
        <form className="sc-form-example" noValidate onSubmit={(event) => {
          event.preventDefault();
          const empty = !name.trim();
          setInvalid(empty);
          setSaved(empty ? "" : t("forms.saved", { name: name.trim(), region }));
        }}>
          <TextField
            label={t("forms.name")}
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            description={t("forms.nameHelp")}
            error={invalid ? t("forms.nameError") : undefined}
            required
          />
          <PasswordField label={t("forms.password")} name="password" autoComplete="new-password" locale={locale} description={t("forms.passwordHelp")} />
          <Select label={t("forms.region")} name="region" value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="ko">{t("forms.korea")}</option>
            <option value="en">{t("forms.other")}</option>
          </Select>
          <Field label={t("forms.notes")} description={t("forms.notesHelp")}>
            {(control) => <textarea {...control} className="etu-input" rows={3} name="notes" />}
          </Field>
          <button type="submit" className="sc-btn">{t("forms.save")}</button>
          {saved && <output role="status">{saved}</output>}
        </form>
      </div>
      <div className="sc-card sc-form-card sc-form-example">
        <h3>{t("forms.states")}</h3>
        <TextField label={t("forms.readOnly")} defaultValue="Example account" readOnly />
        <TextField label={t("forms.disabled")} defaultValue="Example value" disabled />
        <TextField label={t("forms.email")} type="email" description={t("forms.emailHelp")} error={t("forms.emailError")} />
      </div>
    </div>
  );
}
