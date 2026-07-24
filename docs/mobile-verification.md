# Mobile Verification Checklist

Use this for physical-phone LAN testing. Start the app from the project root:

```powershell
npm.cmd run dev -- --host 0.0.0.0 --port 5173
```

Open `http://<computer-lan-ip>:5173/` on a phone connected to the same network and sign in with the Supabase owner account.

## Automatically And Browser-Emulated Checks

- Inspect 320 x 720, 390 x 844, 768 x 1024 and one desktop width in browser automation or responsive tools.
- Confirm a fresh mobile load begins on Today, shows the `Today` title and starts on the primary dock page.
- Confirm primary dock order: Today, Inbox, Tasks, Lists, Projects, Upcoming.
- Confirm secondary dock order: Areas, Overdue, Someday, Trash, Bakery, Settings.
- Confirm every page title has its destination Lucide icon, shares one vertically centred row with the right-aligned controls, uses the same top inset as the horizontal inset, and that menus remain wholly on screen.
- On a Task or Project view, confirm controls start collapsed, the Filter icon immediately left of the hamburger reveals/hides them, and Show/Hide stays left while More stays right on one row.
- Confirm Task, Project, Area and List cards show one vertically centred hamburger; its labelled actions open to the left and close after selection, outside tap or Escape.
- On Tasks, confirm Deferred begins collapsed, its full-width heading has a leading ChevronDown, and tapping anywhere on that row expands or collapses ordinary unhighlighted Task cards.
- Confirm long Area descriptions wrap without moving the action hamburger or reorder handle away from vertical centre.
- Confirm List card action menus contain Edit, Archive and Move to Trash, and expanded cards keep their reorder handles vertically centred.
- Confirm Trash shows its Deleted/Archived toggle immediately left of the hamburger and all four entity tabs in one row.
- In Settings > Priorities and Statuses, confirm each card uses one left-opening hamburger menu for its move, edit and delete actions.
- In Settings > Quantifiers, open an Option colour control: confirm a centred four-column palette modal, a first Pipette/none swatch, selected-state treatment, and that a chosen colour appears on the option in selectors and inline Task, Project and List context.
- Confirm card and configuration reorder handles sit closer to the left edge and remain vertically centred.
- Open a modal field that summons the keyboard and confirm the modal centres in the visible upper region; dismiss the keyboard and confirm the modal returns to screen centre rather than the bottom.
- Confirm Export is absent from mobile UI and cannot receive focus while hidden.
- Confirm the Add button sits above the dock, the Add menu opens upward, and outside tap, Escape and navigation close it.
- In Bakery > Donuts, confirm the final scroll position ends with one empty donut-row height rather than a large footer gap.
- Confirm representative modals fit the viewport, trap focus, close with Escape when idle and restore focus.

## Physical Phone Checks Still Required

- Swipe horizontally on the dock and confirm only the dock page changes; the active destination does not change.
- Make mostly vertical gestures over the dock and confirm the dock page does not change.
- Tap each dock item and confirm taps are not misread as swipes.
- Select a destination on the secondary page, swipe back to primary, then swipe forward and confirm the selected state is retained.
- Check safe-area spacing on the phone browser, including notches/home indicator areas where applicable.
- Scroll to the final card in Tasks, Lists and Projects and confirm it remains reachable near the usable lower edge above the dock, with only one card gap plus roughly half a compact card available for pop-out actions.
- Confirm the first card in Today, Inbox, Tasks, Lists, Projects, Areas, Upcoming, Overdue and Someday begins after the same ordinary gap below the title row; Trash and Settings retain their deliberate interface-specific spacing.
- Open and close the Add menu at the end of a card list and confirm the list's scroll extent does not change.
- Open the Add menu and confirm every item remains visible and tappable.
- Open the mobile keyboard in a modal or auth form and confirm the active field and actions remain usable where practical.
- Rotate the phone and confirm the dock, Add button, page title and modals remain usable.
- Use browser Back and confirm the app does not unexpectedly change dock pages or expose hidden destinations.
- Refresh on mobile and confirm Today remains the initial destination and the dock starts on the primary page.

Record physical-device results separately. Do not treat browser emulation as physical-device verification.
