import { Menu } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { AnchoredOverlay } from "../../core/dialogs/AnchoredOverlay";

export interface CardActionMenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

export function CardActionMenu({ label, actions }: { label: string; actions: CardActionMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return <div className="card-action-menu card-action-menu--mobile">
    <button ref={triggerRef} type="button" className={`icon-button button ghost card-action-menu__trigger ${open ? "selected" : ""}`} aria-label={label} aria-haspopup="menu" aria-expanded={open} title="Actions" onClick={() => setOpen((current) => !current)}><Menu aria-hidden="true" /></button>
    {open && <AnchoredOverlay anchorRef={triggerRef} className="card-action-menu__panel" placement="left" onClose={() => setOpen(false)}>
      <div className="card-action-menu__items" role="menu" aria-label={label}>
        {actions.map((action) => <button key={action.id} type="button" role="menuitem" className={`card-action-menu__item button ghost ${action.danger ? "danger" : ""}`} onClick={() => { setOpen(false); action.onSelect(); }}>{action.icon}<span>{action.label}</span></button>)}
      </div>
    </AnchoredOverlay>}
  </div>;
}
