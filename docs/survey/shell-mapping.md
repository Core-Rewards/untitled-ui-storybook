# Surveys: shell mapping and build plan (step 0)

Branch `Survey` · Nov 20, 2026 · for Mike's review before any screens are built

Sources: `survey-feature-handoff/README.md`, `docs/ux-plan.md`, the wireframe PNGs, this Storybook, and the AdminUI project (admin shell and BASF Advisor Advantage portal).

## 1. Decisions so far

| Topic | Decision |
| --- | --- |
| This pass | This mapping, then the shared question components and the full participant flow. Admin builder, French editor, results and emails come in a later pass. |
| Branch | `Survey`, cut from an up-to-date `main`. The uncommitted Arcade work is stashed (`stash@{0}`, "arcade: music + header/backdrop/plinko WIP"). |
| Storybook | New top-level **Survey** group. Shared, non-survey pieces go under **Base**. |
| Theme | Brand-neutral Untitled UI tokens by default, plus a BASF Advisor Advantage toggle using AdminUI's `theme-basf.css`. |
| Admin shell | Not needed this pass. For the admin pass we'll port AdminUI's dashboard layout (see section 6). |

## 2. What this repo can and can't do

This is a front-end component library. It has no back end, auth, points ledger or email sending, so for this pass:

- Every component is driven by props and typed data. The types mirror the README's proposed data model (`Survey`, `SurveyQuestion`, `QuestionOption`, `SurveyResponse`, `ResponseAnswer`, `SurveyCompletion`), so the platform team can wire them to the real API.
- Autosave, resume, submit and reward payout are **simulated in stories** by a small mock controller (`useMockSurveySession`) held in local state. It exposes the same callbacks the real app will need (`onAnswer`, `onSaveAndExit`, `onSubmit`), so idempotent payout and server-side resume stay the platform's job.
- Out of scope here: data model, API, permissions, feature flags, emails (P1), the 24-hour grace period and sign-in redirects. I'll note where each one touches the UI.

## 3. Storybook structure

```
Survey/
  Overview                     (MDX: what the feature is, links to the stories below)
  Questions/
    Multiple choice            (single, multi, min/max, "Other" with text)
    Dropdown
    Yes / No
    Rating
    Opinion scale
    NPS
    Ranking
    Matrix
    Short text / Long text
    Number / Date
    File upload
    Statement
    All types                  (one gallery story, phone and desktop)
  Participant/
    Dashboard card             (new, in progress, completed, not open yet, closed)
    Intro                      (anonymous and identified, with and without image)
    Question screen            (the full screen chrome around a question)
    Thank-you                  (points, sweepstakes entries, arcade spins)
    Edge states                (not open, closed, already completed)
    Flow                       (end-to-end click-through, phone and desktop)
Base/
  ActionCard                   (generic dashboard action card; the survey card is one use)
  ProgressBar                  (thin top progress bar, if not covered by an existing one)
```

Every Survey story gets a phone (390×844) and a desktop (1440×900) viewport, and an EN/FR switch using sample French copy.

## 4. Participant screens mapped onto our shells

| ID | Wireframe | Where it lives | Built from |
| --- | --- | --- | --- |
| P2 / D1 | Dashboard card | Inside the existing participant `AppShell` content area. Only the card is new. | New `Base/ActionCard` + `Badge`, `Button` |
| P3 / D2 | Intro | `SurveyTakeover` layout (see below) | `Badge` (reward), tag chips (time, count, "Saves as you go"), privacy note, `Button` |
| P4 / D4 | Multiple choice | `SurveyTakeover` | New choice row (letter key, check icon when selected) |
| P5 / D3 | NPS | `SurveyTakeover` | New scale buttons: two rows (0–5, 6–10) on phone, one row on desktop |
| P6 | Text | `SurveyTakeover` | Existing `Input` / `TextArea` with a character counter |
| P7 / D5 | Thank-you | `SurveyTakeover` | Celebration icon, reward panel, `Button`; reuses `points-gain` / `use-count-up` from AppShell for the count |

**The focused takeover.** Our `AppShell` has no "chrome hidden" variant, so I'll build `SurveyTakeover` as its own full-page layout that renders outside the shell:

- Phone: thin progress bar, back arrow, "3 of 5", close (×). Next button pinned to the bottom on non-auto-advance types.
- Desktop: progress bar, program logo + survey name, "4 of 5", **Save and exit**, up/down arrows bottom-right, keyboard hints.
- The program logo comes from the active theme (placeholder when neutral, Advisor Advantage when BASF is on).

**Behaviour carried over from the plan**

- Auto-advance after a short pause (about 400 ms) for single choice, yes/no, rating, opinion scale and NPS. Multi-select, text, ranking and matrix use Next / OK.
- Keyboard on desktop: A–Z to pick options, number keys for NPS and scales, Enter to continue, up/down arrows to move between questions.
- Required questions show an inline message under the answers, never an alert.
- Selection is shown with a check icon and border, not colour alone. Touch targets are at least 48 px on phone.
- Thank-you shows "+500 points added to your account" and **no new-balance line**.

## 5. Deviations and calls for you to review

1. **D1 header.** The wireframe draws a top-nav participant header. Our participant `AppShell` uses a sidebar plus utility header, so the card sits in that shell instead. The "Your points" and placeholder cards on D1 are not built; only the survey card is new.
2. **Takeover outside the shell.** As above. If you'd prefer to keep the shell header and use a slim in-content bar instead (the README's fallback), say so.
3. **Dashboard card is generic.** It becomes `Base/ActionCard` with eyebrow, title, description, meta line, badge, primary action and state (new, in progress, completed, not open, closed), so promotions, arcade and training can reuse it. The survey story passes survey content into it. Per Mike's review it is **full width**, like Quiz and ConciergeCta, rather than one column of three as on D1: copy on the left and the button on the right when there's room, stacked with a full-width button on phones.
4. **Choice rows on phone.** The phone wireframe swaps the letter key for a checkbox once selected; desktop keeps the letter and adds a check on the right. I'll use the desktop pattern on both (letter key, filled when selected, check on the right) so the two match. Shout if you want the phone checkbox.
5. **Typing "10" on NPS.** Pressing 1 would immediately pick 1. I'll wait briefly after a 1 to see if a 0 follows before selecting.
6. **Matrix on phone** shows one row at a time. I'll treat the whole matrix as one question in the "3 of 5" count, with its own row stepper inside.
7. **Existing Quiz component.** `Base/Quiz` has its own option UI tied to right/wrong answers. I won't build surveys on top of it; the new question components could replace its options later.
8. **Colours and type.** Wireframe blues, hex values and Inter sizing are ignored in favour of theme tokens, per the README.
9. **Celebration animation.** A short check + count-up, skipped when the viewer prefers reduced motion.

## 6. Admin screens (later pass, for reference)

AdminUI already has most of what the admin wireframes need. Plan for that pass:

| Need | Source |
| --- | --- |
| Admin sidebar with **Surveys** added, program switcher, account menu | Port AdminUI `DashboardLayout` + `sidebar-simple` as `Base/AdminShell` |
| Collapsed sidebar on builder routes | AdminUI `sidebar-slim` |
| Page header: breadcrumb, title + status badge, action slot | New, unless AdminUI has one I've missed |
| Step indicator (Questions · Settings · Reward · Schedule and publish) | New `Base/ProgressSteps` (neither repo has one) |
| Tabs, modal (New survey), slideout (response drawer), dropdown (row ··· menu), empty state, charts | AdminUI `tabs`, `modal`, `slideout-menu`, `dropdown`, `empty-state`, `charts-base` |
| Tables | This repo's `Base/Tables` |
| Undo toast | New (neither repo has one) |

Results charts can be plain bars like the wireframes, so `recharts` should not be needed.

### Phase 1 as built (admin shell, survey list, New survey)

- **Admin shell:** `Base/AdminShell` reuses this repo's `AppSidebar` instead of porting AdminUI's sidebar. AdminUI's account card needs the `react-aria` package, and the two sidebars were already near-identical. In admin, the account card is the **program switcher** (current program, others in its menu), which covers the wireframe's "Switch program".
- **AI assistant:** AdminUI's AI drawer is ported as-is (`application/ai-chat-sidebar.tsx`), with configurable starter prompts. No new packages were needed.
- **Navigation:** AdminUI's links with **Surveys** added after Arcade Controls.
- **Ported from AdminUI:** tabs, modal, dropdown menu, avatar, checkbox (`base/checkbox`) and radio buttons. AdminUI's empty state was not ported (it pulls in about 4,000 lines of illustrations); the survey empty state uses `FeaturedIcon` instead.
- **Table:** the list uses this repo's `DataTable` (search and sorting built in) with the ported tabs for status.
- **Deviation (Mike's call):** New survey (A2) is a **page**, not the modal the plan describes, and it **merges the template library**. It offers Start blank, the Core template library (search, category filter, starters first, question preview) and "Copy a survey you've run", with a sticky panel for the name and base language. The list's separate Template library button is gone.
- **Deviation:** the wireframe's "Ask AI" and "Account" links at the bottom of the sidebar are replaced by the AI sparkles button (top-right) and the account card's menu, as in AdminUI.


## 7. Build order for this pass

1. Theme toggle in Storybook's toolbar (Neutral / BASF), porting `theme-basf.css`.
2. Survey types + mock data (the 2026 Program Satisfaction survey from the wireframes, EN and FR).
3. Question components, wireframed types first (opinion scale, NPS, multiple choice, long text), then the rest.
4. `SurveyTakeover` layout, intro and thank-you.
5. `Base/ActionCard` and the dashboard card stories.
6. Edge states and the end-to-end Flow story with the mock session (autosave, resume at next unanswered, submit once).
7. a11y addon pass and keyboard-only run-through against the acceptance criteria.

## 8. Housekeeping

- `survey-feature-handoff/` is untracked and won't be committed. I can add it to `.gitignore` if you like.
- To get the Arcade work back: `git checkout arcade && git stash pop`.

### Phase 2 as built (builder, Questions step)

- **Layout:** the admin shell's sidebar collapses to a 64px icon rail on builder pages (`sidebarMode="rail"`); its menu button opens the full sidebar, with the program switcher, as a drawer. The builder's top bar sits inside the content area as a page header (breadcrumb, title, status, save state, Undo, EN/FR, Preview, Next), with `Base/ProgressSteps` under it.
- **Canvas:** the participant `SurveyQuestion` gained an editor mode, so what admins edit is exactly what participants see. Title, description and choice options are edited in place.
- **Deviation:** scale end labels, matrix rows and columns, and other type settings are edited in the right panel rather than on the canvas.
- **Logic:** rules support "is any of" / "is none of" (the wireframe's chips), "is less/more than" for numbers, and "is answered / skipped" for optional questions. Targets are later questions or the end, so the builder can't create loops; the check still flags them.
- **New shared pieces:** `Base/ProgressSteps`, `Base/Toast` (with Undo), and a 12-question bank with French included.

### Phase 3 as built (French, Settings, Reward, Schedule and publish)

- **French (A5):** EN | FR in the builder header switches to the side-by-side view. Strings come from one list (`extractStrings`), so new questions grow the counter automatically. "Draft missing with AI" calls `onDraftTranslations`; drafts are marked Review until edited or approved, and unreviewed drafts are a checklist warning, not a blocker.
- **Settings (A6), Reward (A7):** form steps with a live "What participants see" panel built from the real participant components (dashboard card, intro, thank-you). Reward types not enabled for the program show disabled.
- **Schedule and publish (A8):** dates and times in the survey's timezone, invite and reminder emails, and the review checklist (`buildChecklist`). Errors block Publish and link to the step that fixes them; a future open date turns Publish into "Schedule for …". The confirmation lists what happens next. Publishing clears Undo history.
- **Step indicator:** visited steps show done, or "needs attention" when a blocking checklist item belongs to them.
- **Known gap:** editing English text after French exists doesn't yet flag that French as possibly out of date.

### Phase 4 as built (Results)

- **Summary (A9) and Responses (A10)** in the admin shell, calculated from raw responses (`results-aggregate.ts`), so filters (dates, language, completed or partial, and region for identified surveys) recompute every number.
- **Privacy:** anonymous surveys show no identity anywhere, including exports, and any filter leaving fewer than 5 responses hides the results with an explanation.
- **Responses:** paginated table; each response opens in the ported AdminUI slideout drawer, with Newer / Older.
- **Export:** CSV is generated in the browser (raw or summary, with or without partials; EN and FR answers share columns plus a language column). Excel is left to the platform (`onExport`).
- **Deviation:** results don't update live in Storybook; the platform would refresh the responses.
- The Survey list story now wires the whole admin journey: list → New survey → builder, Edit → builder, View results → Results.

### Languages are per survey

Not every survey is translated. A survey is written in one base language and can optionally be offered in the other (`enabledLocales`):

- **New survey page:** "Also offer it in French" (on by default when the template or copied survey already has French).
- **Settings:** a Languages card turns the second language on or off. Translations are kept when it's off, so switching back restores them.
- **Builder header:** the EN | FR switch and counter only appear for bilingual surveys; otherwise a "+ French" button adds it.
- **Publish checklist:** only requires a translation when the second language is on.
- **Results and export:** the language filter and the shared-columns note only appear for bilingual surveys.
- **French-base surveys:** labels follow the base language, so an English translation works the same way.

### Participant: Surveys & quizzes page and dashboard (branch `survey-participant-hub`)

Decisions (Mike, Nov 23): quizzes are a **kind** of survey chosen at creation, quiz rewards are set per quiz (on completion, on passing, or tiered by score), **no retakes**, and the weekly `Base/Quiz` merges into this. Quiz mode in the builder comes next; this step only displays quizzes.

- **Model:** `Survey.kind` (`survey` | `quiz`) and `Survey.quiz` (pass mark, reward rule, tiers); responses can carry `score` and `rewardEarned`.
- **Page:** a "Surveys & quizzes" nav item with a count opens Available (started first, then closing soonest, then bigger reward), Upcoming and Completed (reward earned, quiz score). Items that closed before the participant took part aren't shown. All / Surveys / Quizzes filters appear when there are quizzes.
- **Dashboard:** one featured card, up to two compact rows ("More to do"), and View all. With nothing open, a just-finished item (3 days) or the next upcoming one takes the card.
- **Compact dashboard** (`variant="compact"`): one row instead of cards, e.g. "1 survey and 2 quizzes available", with how many are started, when the next closes, the points on offer, and View all. With nothing open it says when the next one opens; with nothing at all it renders nothing.
- **Reward wording:** "Earn 300 points" (completion), "Pass to earn 250 points" (pass), "Earn up to 500 points" (tiered). A quiz that wasn't passed shows neutral, not green.
- **New shared piece:** `ActionRow`, the compact list version of `ActionCard`. Card and row share one description helper (`describeActivity`) so they always agree.


### Quiz mode (branch `quiz-mode`)

Quizzes are surveys with right answers. They use the same types, player, builder and results; `Survey.kind === "quiz"` switches the extras on. The weekly `Base/Quiz` (single question, streaks) is untouched for now.

**Rules** (`quiz-logic.ts`, the single source for the player, builder, results and the platform's own grading):

- Only **multiple choice** (single or multi), **dropdown** and **yes / no** can be scored. A question is scored when it has `correct` (option ids, or `"yes"` / `"no"`); `correct: []` means scored but not set yet, which blocks publishing. Other types are allowed in a quiz and are collected, not scored.
- Multi-select is **all or nothing**: every correct option and no others. "Other" never counts as correct.
- The total is the scored questions on the participant's path, so a question skipped by jump logic doesn't count against them. A scored question left blank is wrong.
- Passing is `correct / total × 100 ≥ passMark`, unrounded. Displayed percents round down, so a fail never shows as the pass mark.
- Rewards: **completion** (always), **pass** (only on a pass) or **tiered** (the highest tier reached; `reward.amount` is the top tier).
- Quizzes are always **identified**: the score decides the reward and shows in the participant's history and in results.

**When answers are shown** (`quiz.reveal`, set per quiz):

| Setting | Participant sees |
| --- | --- |
| `each_question` | A **Check answer** step on each scored question: Correct / Not quite, the right answer and the explanation. Back is off, since a revealed answer can't change. |
| `at_end` (default) | Everything on the results screen after submitting. Back works as in surveys. |
| `never` | Only the score. For quizzes whose questions run again. |

**Builder:** in a quiz, the add-question picker marks each type Scored or Not scored, and searching "scored" lists only the types that can be. Types added from the list start scored. Bank questions ask for opinions, so they're added unscored; Score this question turns scoring on.

**Participant:** the intro shows the rule-aware reward ("Pass to earn 250 points"), pass mark and "One try". The results screen replaces the thank-you: score, passed or not (a fail is neutral, not red), the reward actually earned or what it would have taken, then a review of each scored answer. Opening a finished quiz says it's already been taken, with the score. Right and wrong are always shown with icons and words, not colour alone, and the feedback panel is announced.

**Admin results:** quiz KPIs (responses, average score, pass rate, rewards actually paid), a score distribution with the pass mark marked, "% answered correctly" and the right option highlighted on each scored question, Score and Result columns, a drawer that marks each answer, and score columns in the CSV. Partial responses aren't scored.

**For the platform team:**

- Grade on submit with the same rules and return `{ score, reward }` from `onSubmit`. The player shows the platform's score when it's returned; its own grading is only a fallback for stories and Preview.
- Don't send `correct` or `explanation` to the browser before they're needed. For `at_end`, leave them off the survey and return them as `answerKey` from `onSubmit`; the review fills them in. For `never`, don't send them at all. For `each_question` they're needed per question, so a determined participant could read them; use `at_end` when that matters.
- No retakes: a completed quiz response is final.
