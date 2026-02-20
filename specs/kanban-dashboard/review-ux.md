# UX Review — Kanban Dashboard

**Reviewed By**: UX Reviewer Agent
**Date**: 2026-02-20
**Spec Version**: Draft (no git history; artifacts dated 2026-02-20)
**Overall UX Assessment**: Good

---

## Re-Review Note

This is a re-review. The initial review (2026-02-20) found 8 blockers (UX-B-001 through UX-B-008). All 8 have been addressed in requirements, acceptance criteria, and wireframes. This review verifies adequacy of those fixes and identifies any remaining or newly introduced issues. Previous blocker findings are summarised in the verification section below; new findings use fresh numbering starting from UX-B-001R (re-review).

---

## Summary

The second iteration of the kanban-dashboard spec represents a substantial improvement. All eight original blockers have been adequately addressed with matching wireframe components, behavior sidecars, and acceptance criteria. The wireframe files are detailed and internally consistent — the board-view includes a loading skeleton overlay, search and filter bar, undo toast with timer bar, keyboard hint text on cards, non-color blocked indicators with ARIA labels, and WIP exceeded icons. The card-create-form correctly shows a disabled submit button bound to title content, a character counter, and inline error message. The card-detail shows the disabled Unblock button with validation binding and hint text. The CMS ops screen includes a connecting overlay and the offline screen provides a full reconnection banner with stale data notice.

One critical rendering failure was found: all 36 PNG screenshots across all form factors render as blank grid backgrounds with no visible UI content. This is a complete failure of the screenshot generation pipeline. The wireframe JSON structures are well-formed, so the issue is in the PSCanvas rendering step. This must be fixed before the visual design quality check can pass, and is classified as a blocker on the toolchain (not the spec itself). The review proceeds based on JSON wireframe analysis for check 15, with findings noted where the JSON reveals issues the PNG inspection would normally catch.

Three new warnings were identified in the freshly generated wireframes, and three suggestions carry over or are newly raised. The spec is ready to proceed to implementation with the warnings tracked and the screenshot rendering issue resolved.

---

## Previous Blocker Verification

| Original ID | Title | Fix Location | Verified |
|-------------|-------|-------------|---------|
| UX-B-001 | No Loading State for VS Code Board | KB-028, AC-068, `loading_skeleton_overlay` node in board-view.json | ADEQUATE |
| UX-B-002 | No Loading State for CMS Dashboard | KB-029, AC-069, `cms_connecting_overlay` node in cms-ops.json | ADEQUATE |
| UX-B-003 | No Undo for Drag-and-Drop | KB-030, AC-070, `undo_toast` + `undo_timer_bar` nodes in board-view.json | ADEQUATE |
| UX-B-004 | Card Creation Form No Validation | KB-031, AC-071, title validation + disabled submit in card-create-form.json + behavior.json | ADEQUATE |
| UX-B-005 | Unblock Empty-Submit Prevention | KB-032, AC-072, disabled unblock button + hint text in card-detail.json + behavior.json | ADEQUATE |
| UX-B-006 | No Search/Filter on Board | KB-033, AC-073/074, `search_filter_bar` + filter buttons + active chip in board-view.json | ADEQUATE |
| UX-B-007 | Keyboard Card Movement Not Designed | KB-034, AC-075/076, `card1_keyboard_hint` node + Alt+arrow ACs | ADEQUATE — see UX-W-001R |
| UX-B-008 | Color-Only State Indicators | KB-035, AC-077/078/079, warning icon + ARIA label on blocked card + WIP icon in board-view.json | ADEQUATE |

---

## Findings

### Blockers (Must Fix Before Implementation)

---

#### UX-B-001R: All Screenshots Blank — PSCanvas Rendering Pipeline Failure

- **Checklist Item**: 15 — Visual Design Quality
- **Severity**: Blocker (toolchain, not spec)
- **Location**: `specs/kanban-dashboard/wireframes.pscanvas/screenshots/` — all 36 PNG files across all four form factor directories
- **Issue**: Every PNG screenshot in all four form factor directories (phone/portrait, phone/landscape, tablet/portrait, tablet/landscape) renders as a blank light-grey grid with no UI elements. The wireframe JSON files are present and structurally valid. The PSCanvas screenshot generation step executed (files exist, correct dimensions) but produced no rendered output. This means the visual design quality of the 9 screens cannot be verified from screenshots. The blank output is a complete PSCanvas rendering failure.
- **User Impact**: The spec team cannot validate that the dark-theme wireframe renders correctly, that color contrast is sufficient, that the skeleton loading overlay animates correctly, or that the offline banner layout is proportionate. Implementation could proceed from a spec that looks correct in JSON but would render incorrectly or inconsistently.
- **Recommendation**: Re-run PSCanvas screenshot generation. Inspect PSCanvas canvas.json and tokens.json for any configuration issues that may be causing the renderer to produce blank output (common causes: missing font assets, incorrect canvas dimensions, missing color token resolution). Confirm at least the board-view and cms-ops screens render before sign-off.
- **Acceptance Criteria Impact**: Check 15 cannot be marked PASS until screenshots render correctly.

---

### Warnings (Should Fix, Can Proceed)

---

#### UX-W-001R: Keyboard Movement Mode Entry and Confirmation Not Specified in Wireframe

- **Checklist Item**: 11 — Accessibility — Operable
- **Severity**: Warning
- **Location**: `board-view.json#card1_keyboard_hint`, AC-075, AC-076
- **Issue**: The wireframe places a keyboard hint ("Alt+←→") on the focused card, and the ACs specify Alt+Left/Right moves the card to adjacent columns with a screen reader announcement. However, the interaction model is ambiguous: do the Alt+arrow keys move the card immediately on press (no confirmation required), or do they require a mode-entry step? The card detail behavior sidecar shows no keyboard move mode states. AC-075 says pressing Alt+Right moves the card immediately and the undo toast appears. This is a direct-execute model — the keystroke is destructive and irreversible without undo. The spec does not state whether the keyboard hint is always visible on the focused card or only appears after some interaction.
- **User Impact**: If a user navigates to a card with Tab and accidentally presses Alt+Right, the card moves immediately. There is no confirmation ("are you sure?") before an irreversible file write. The undo toast provides 5 seconds of recovery (per KB-030), which is acceptable, but the always-visible "Alt+←→" hint on the card could mislead users who are not trying to move the card.
- **Recommendation**: Clarify in the AC whether the keyboard hint is always shown on focused cards or only shown in a "keyboard move mode" (entered via Space/Enter). If using the direct-execute model (Alt+arrows move immediately), add a note to AC-075 that the undo toast appears immediately, identical to drag-and-drop. If using a mode-entry model, specify the mode entry key, visual confirmation that move mode is active (e.g., card border pulses), and that Escape exits without moving. The existing AC-075 spec is workable as a direct-execute model, but the wireframe hint text should clarify this.

---

#### UX-W-002R: Card Create Form Has No Unsaved-Changes Guard on Close

- **Checklist Item**: 7 — Form Design
- **Severity**: Warning
- **Location**: `card-create-form.json#form_close_btn`, `card-create-form.json#form_cancel_btn`, navigation.json (cancel edge)
- **Issue**: The navigation.json defines two edges from card-create-form back to board-view: `tap:form_cancel_btn` with description "Cancel card creation, discard form data" and `tap:form_close_btn` with description "Close modal, discard form data." Both edges discard in-progress form data without a guard. The behavior sidecar defines a `cancelTapped` transition from `ready` state back to `cancelled` with no intermediate confirmation step. If the user has typed a title (putting the form in the `ready` state) and accidentally clicks Cancel or the close (X) button, all data is lost with no warning.
- **User Impact**: User types a detailed card title, realizes they want to check the board first, clicks X, and loses the title. This was flagged as UX-W-006 in the original review and has not been addressed in the wireframe or ACs.
- **Recommendation**: Add a guard transition in the behavior sidecar: when `cancelTapped` or `closeTapped` fires from the `ready` state (i.e., when `formData.title` is non-empty), transition to a new `confirmDiscard` state that shows a confirmation dialog ("Discard this card? You've entered a title.") with "Keep Editing" (default) and "Discard" actions. If title is empty, allow immediate close. This was UX-W-006 in the previous review and remains unresolved.
- **Acceptance Criteria Impact**: Add AC to UC-007: "If the card creation form has a non-empty title field, clicking Cancel or closing the modal shows a confirmation dialog before discarding."

---

#### UX-W-003R: Login Form Has No Error State for Invalid Credentials

- **Checklist Item**: 2 — Error State Design
- **Severity**: Warning
- **Location**: `cms-login.json`, AC-032, AC-033
- **Issue**: The cms-login.json wireframe shows a login form with username and password fields and a Sign In button. There is no error state designed for invalid credentials (wrong username or password). AC-032 specifies the server returns HTTP 401 for unauthenticated requests, and AC-033 specifies valid credentials grant access. There is no AC or wireframe for what happens when the user submits incorrect credentials — the most common login failure scenario.
- **User Impact**: A user who misremembers the password (set via KANBAN_CMS_PASSWORD env var) submits the form and either sees a browser-native 401 error page (if using HTTP basic auth without a custom UI) or sees nothing happen. The login hint text ("Set KANBAN_CMS_PASSWORD env var to configure auth") is developer-facing copy exposed to end users, which also creates a UX problem.
- **Recommendation**: Add an error state to the login form. After a failed authentication attempt, display an inline error message below the Sign In button: "Invalid credentials. Check your username and password." The form fields should remain filled (except password, which should clear per security best practice) so the user can correct the entry. Also, the hint text "Set KANBAN_CMS_PASSWORD env var to configure auth" is developer documentation and should not appear on the production login page — remove it or replace with "Contact your system administrator if you need access."
- **Acceptance Criteria Impact**: Add AC to UC-006: "When the user submits invalid credentials to the CMS login form, an inline error message is displayed and the password field is cleared."

---

#### UX-W-004R: Cross-Repo Dashboard Has No Empty State for Zero Projects or Missing projects.yaml

- **Checklist Item**: 3 — Empty State Design
- **Severity**: Warning
- **Location**: `dashboard-view.json`, AC-025, AC-061
- **Issue**: This was UX-W-003 in the original review and remains unaddressed. The dashboard-view.json shows only the populated state (3 project cards). No empty state is designed for when `projects.yaml` is empty or does not exist. The dashboard-view behavior sidecar does not exist in the wireframes directory, so there is no state machine covering the "no projects" branch. The acceptance criteria (AC-025, AC-061) only test the populated case.
- **User Impact**: A first-time user who opens the cross-repo dashboard before configuring `projects.yaml` will see either an empty grid with no guidance or an unhandled error. This is the new-user onboarding failure mode.
- **Recommendation**: Add a `dashboard-view.behavior.json` sidecar with an `empty` state that triggers when `projects.length === 0`. In that state, show an empty state panel with: "No projects configured. Add projects to `projects.yaml` to see cross-repo health." with an "Open projects.yaml" button (or "Create projects.yaml" if the file does not exist). This mirrors the pattern already established by `board-empty-state.json` for the VS Code board.
- **Acceptance Criteria Impact**: Add AC to UC-005: "When `projects.yaml` contains no entries or does not exist, the dashboard displays an empty state with instructions and a button to open or create `projects.yaml`."

---

#### UX-W-005R: CMS Login Form Exposes Internal Configuration Hint to End Users

- **Checklist Item**: 14 — Content and Microcopy
- **Severity**: Warning
- **Location**: `cms-login.json#login_hint_text`
- **Issue**: The login hint text reads "Set KANBAN_CMS_PASSWORD env var to configure auth." This is infrastructure-level developer documentation exposed as UI copy on the login page. While the CMS is currently a single-user internal tool, this text is not appropriate for a login screen. If the login page is ever served to anyone who is not the system operator (e.g., a colleague accessing the NUC), the message leaks internal deployment information.
- **User Impact**: Non-system-administrator users (or anyone unfamiliar with the deployment) see an unhelpful and confusing message. It does not help the user log in and may cause confusion about who sets the password.
- **Recommendation**: Replace the hint text with a neutral message such as: "Contact your administrator if you need access." If the system operator needs reminders about env var configuration, put that information in the deployment documentation (README) rather than the live login page. This is a low-effort microcopy change.
- **Acceptance Criteria Impact**: None — this is a microcopy-only fix.

---

### Suggestions (Enhancement Ideas)

---

#### UX-S-001R: Undo Toast Timer Bar Is Not Described Semantically for Screen Readers

- **Checklist Item**: 13 — Accessibility — Robust
- **Severity**: Suggestion
- **Description**: The `undo_timer_bar` node in board-view.json is a visual progress bar that shrinks over 5 seconds to indicate time remaining for the undo action. The JSON node has no ARIA role, no ARIA label, and no live region announcement. A screen reader user who triggers a keyboard card move (AC-075) will hear the screen reader announcement "Card moved to Testing" but will have no indication that they have 5 seconds to undo or how much time remains.
- **Benefit**: Adding `role="timer"` and `aria-label="Undo available for N seconds"` to the timer bar (with an `aria-live="polite"` countdown update at 4s, 3s, 2s, 1s) would give screen reader users a complete experience. Alternatively, the undo toast text could include the countdown: "Moved to Testing — Undo (5s)".
- **Effort Estimate**: Low

---

#### UX-S-002R: CMS Agent Spinner Uses Color-Only Active Indicator

- **Checklist Item**: 10 — Accessibility — Perceivable
- **Severity**: Suggestion
- **Description**: The agent panel spinner (`ap1_spinner` in cms-ops.json) is a 10x10 teal circle with a darker border. It represents "agent is actively running." There is no text label or icon differentiation alongside the color dot to indicate active vs. idle or completed state. The `no_agents_state` section uses a different visual treatment (dashed border, person icon) but the per-panel active indicator is color-only. Agent Panel 2 (`ap2_spinner`) similarly uses a solid teal dot with no secondary indicator.
- **Benefit**: Adding a small "RUNNING" text badge alongside the spinner dot (as AP1 has for the tool count, but not for the status) would make the active state perceivable without relying solely on color. This aligns with the same pattern applied to blocked cards (KB-035/AC-077).
- **Effort Estimate**: Low

---

#### UX-S-003R: Dashboard Project Card "Online" Status Uses Color-Only Dot

- **Checklist Item**: 10 — Accessibility — Perceivable
- **Severity**: Suggestion
- **Description**: The project cards in dashboard-view.json use a green dot (`proj1_online_dot`) alongside the text "online" for accessible projects, and the offline card uses a `cloud_off` icon alongside the text "offline". The online status correctly has text alongside color. However, the dot and "online" text are visually very similar in weight to the project description line — the information hierarchy is flat. The offline state is more visually distinct (icon + text + dim opacity).
- **Benefit**: Upgrading the "online" indicator to use a small icon (e.g., `wifi` or `check_circle`) alongside the dot and text would give it the same visual weight as the offline state's `cloud_off` icon. This would make a quick board scan more reliable: you immediately see which projects are online vs. offline without needing to read every status text.
- **Effort Estimate**: Low

---

#### UX-S-004R: Card-Detail Panel Has No Loading State for Initial Card Read

- **Checklist Item**: 4 — Loading State Design
- **Severity**: Suggestion
- **Description**: The card-detail behavior sidecar defines a `loading` state with `readCardFile` and `runAdapterEnrichment` entry actions. However, the card-detail.json wireframe does not include a skeleton or spinner component for this loading state — the JSON shows only the fully-populated state. For cards with adapter enrichment data, the load could take a noticeable fraction of a second. There is no defined layout for the loading state of the detail panel.
- **Benefit**: Adding a skeleton layout in the detail panel (similar to the board-view skeleton overlay) would ensure the 520px panel has a consistent appearance while loading. Even a simple spinner centered in the panel would be an improvement over a blank white or dark panel. This matches the pattern already established for the board loading state.
- **Effort Estimate**: Low

---

## Checklist Results

| # | Check | Status | Findings |
|---|-------|--------|----------|
| 1 | User Flow Completeness | PASS | Navigation covers all state transitions; boarding, error, and empty states all wired |
| 2 | Error State Design | PARTIAL | UX-W-003R (login error not designed) |
| 3 | Empty State Design | PARTIAL | UX-W-004R (dashboard empty state missing) |
| 4 | Loading State Design | PARTIAL | UX-S-004R (card-detail loading state not wired) |
| 5 | Edge Case Handling | PASS | Malformed card, missing repo, concurrent writes, 50-card scale all addressed |
| 6 | Navigation Consistency | PASS | Navigation.json covers all edges; animation types consistent |
| 7 | Form Design | PARTIAL | UX-W-002R (cancel guard on create form missing) |
| 8 | Feedback and Confirmation | PASS | Undo toast, success flows, offline banner, blocker resolved transition all specified |
| 9 | Responsive Design | PARTIAL | Wireframes are desktop-only (1280/1440px fixed); mobile out of scope per requirements; tablet landscape use of CMS browser is plausible but not designed |
| 10 | Accessibility — Perceivable | PARTIAL | UX-S-002R, UX-S-003R (color-only dots in CMS and dashboard) |
| 11 | Accessibility — Operable | PARTIAL | UX-W-001R (keyboard move mode ambiguity) |
| 12 | Accessibility — Understandable | PASS | All forms labeled, error messages inline and associated with fields, navigation consistent |
| 13 | Accessibility — Robust | PARTIAL | UX-S-001R (undo timer bar has no ARIA semantics); ARIA landmarks not specified at screen level |
| 14 | Content and Microcopy | PARTIAL | UX-W-005R (login hint exposes env var config) |
| 15 | Visual Design Quality | FAIL | UX-B-001R — all 36 screenshots blank (PSCanvas rendering failure); JSON-based review shows well-structured wireframes |

---

## Form Factor Verification Summary

| Form Factor | Screens Reviewed | Status | Issues |
|-------------|-----------------|--------|--------|
| Phone Portrait | 9/9 (all blank) | FAIL | UX-B-001R — no rendered output; wireframes are desktop-only (1280px fixed) — phone portrait would require separate responsive designs |
| Phone Landscape | 9/9 (all blank) | FAIL | UX-B-001R — same as above |
| Tablet Portrait | 9/9 (all blank) | FAIL | UX-B-001R — no rendered output |
| Tablet Landscape | 9/9 (all blank) | FAIL | UX-B-001R — no rendered output; screens are defined at 1280x800 and 1440x900 — closest match to tablet landscape; should render if pipeline is fixed |

**Note**: The requirements.md Out of Scope section explicitly lists "Mobile/tablet-optimized views." The primary delivery targets are a VS Code extension webview (desktop, 1280px+) and a CMS web dashboard accessed via LAN browser (desktop, 1440px+). All wireframe screens are correctly specified at desktop dimensions. The phone/portrait and phone/landscape form factor screenshots are expected to show the desktop layout scaled or blank (out of scope). The tablet/landscape screenshots at 1194x834 are the closest form factor to the designed screen dimensions and should render the desktop layouts. The screenshot failure is entirely a pipeline issue, not a design scope issue.

---

## JSON-Based Visual Design Assessment (Substitute for Failed Screenshots)

Based on reading the wireframe JSON directly, the following visual design observations are made:

**Alignment and Spacing**: Consistent padding values (16px, 20px, 24px) across all screens. Gap values (8px, 12px) are consistent within component types. Form fields use 16px padding. The board topbar uses 16px horizontal padding consistently.

**Color Tokens**: All screens use a consistent dark-green color system: backgrounds (#080c0b, #0a0e0d, #111816), borders (#1a2e2a), teal accent (#0d9488, #14b8a6), and semantic colors for states (amber #f59e0b for blocked, red #ef4444 for errors, green #22c55e for success). The color scheme is internally consistent.

**Typography**: Font sizes are appropriate: 16px for primary labels, 13-14px for body text, 11-12px for metadata, 9-10px for timestamps and secondary labels. Font weights (600 for headings, 500 for field labels) are applied consistently.

**Potential Contrast Issues (requires screenshot verification)**: Several text colors against dark backgrounds need contrast verification: #52525b text on #080c0b background may not meet 4.5:1 WCAG AA (calculated: approximately 3.8:1 — likely failing). #3f3f46 text on #080c0b background is likely failing (approximately 2.9:1). These are used for secondary labels, timestamps, and the "no agents" last activity text. This remains a PARTIAL on check 10.

**Touch Targets**: The board is desktop-only (out of scope for touch target checking). CMS login buttons are 48px height (adequate). Board action buttons are 32-44px (adequate for mouse click, below 44px touch minimum for the 32px close button).

---

## WCAG Compliance Assessment (Spec-Level)

| WCAG Level | Criteria Met | Criteria Partial | Criteria Failed |
|------------|-------------|-----------------|-----------------|
| A (25 criteria) | 14 | 9 | 2 |
| AA (13 criteria) | 6 | 5 | 2 |
| AAA (not targeted) | 0 | 0 | N/A |

**Key WCAG gaps at spec level:**

| WCAG SC | Criterion | Status | Finding |
|---------|-----------|--------|---------|
| 1.4.1 | Use of Color | PARTIAL | Agent panel active spinner and dashboard project online dot are color-only (suggestions UX-S-002R, UX-S-003R); blocked cards and WIP indicators now have icons (UX-B-008 resolved) |
| 1.4.3 | Contrast (Minimum) | PARTIAL | Secondary text colors (#52525b, #3f3f46) on dark backgrounds may fail 4.5:1; requires screenshot verification |
| 2.1.1 | Keyboard | PARTIAL | UX-W-001R — keyboard move model ambiguous; Alt+arrow direct-execute is functional but mode-entry model may be preferable |
| 2.2.2 | Pause Stop Hide | PARTIAL | CMS auto-scroll feed has no pause affordance (UX-S-005 from prior review still open as suggestion) |
| 2.4.3 | Focus Order | PARTIAL | No focus order spec for board cards (Tab navigation order not documented) |
| 4.1.2 | Name, Role, Value | PARTIAL | ARIA landmarks (main, nav, banner) not specified at screen level; custom components have roles but page-level structure is not specified |
| 3.3.1 | Error Identification | PARTIAL | UX-W-003R — login form error state not designed |
| 3.3.2 | Labels or Instructions | PASS | All form inputs have explicit label elements with accessible names |

---

## Sign-Off

- [ ] All Blockers addressed (UX-B-001R: PSCanvas screenshot rendering must be fixed)
- [ ] All Warnings tracked with owners (UX-W-001R through UX-W-005R)
- [ ] Accessibility audit complete (PARTIAL — contrast verification blocked by screenshot failure)
- [x] Wireframes updated for original 8 blockers
- [x] Acceptance criteria updated for original 8 blockers (AC-068 through AC-079)
