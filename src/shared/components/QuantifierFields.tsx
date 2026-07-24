import { Component, Zap } from "lucide-react";
import { AppData, QuantifierSelections, orderedQuantifierDefinitions } from "../../domain";

export function QuantifierFields({ data, value, onChange }: { data: AppData; value: QuantifierSelections; onChange: (value: QuantifierSelections) => void }) {
  const definitions = orderedQuantifierDefinitions(data);
  if (!definitions.length) return null;
  return <div className="quantifier-fields">
    {definitions.map((definition) => {
      const Icon = definition.icon === "zap" ? Zap : Component;
      const selectedOption = definition.options.find((option) => option.id === value[definition.id]);
      return <label className="form-row" key={definition.id}>
        <span className="quantifier-field__label"><Icon aria-hidden="true" />{definition.name}</span>
        <select className="field" value={value[definition.id] ?? ""} style={selectedOption?.color ? { color: selectedOption.color } : undefined} onChange={(event) => {
          const next = { ...value };
          if (event.target.value) next[definition.id] = event.target.value;
          else delete next[definition.id];
          onChange(next);
        }}>
          <option value="">Not set</option>
          {[...definition.options].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)).map((option) => <option key={option.id} value={option.id} style={option.color ? { color: option.color } : undefined}>{option.name}</option>)}
        </select>
      </label>;
    })}
  </div>;
}
