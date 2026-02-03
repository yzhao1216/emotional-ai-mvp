/**
 * App header: assistant name + purpose.
 */

import { assistantName, assistantPurpose } from "../../core/identity";

export function Header() {
  return (
    <header className="header">
      <h1 className="header__title">{assistantName}</h1>
      <p className="header__purpose">{assistantPurpose}</p>
    </header>
  );
}
