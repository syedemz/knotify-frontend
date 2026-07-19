phase: 6
title: Residence (B5, pages 15-17)
last_updated: 2026-07-19

context_summary: |
  Phase 6 captures residence country + dial code (page 15), residence city (page 16), and Kashmir district + family residence address (page 17). Introduces the country-picker component using `src/config/countries.ts` and a flag-rendering library (§17.25).

stories:
  - id: 6.1
    title: Page 15 - Current residence country (name + dial code + flag picker)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page15CountryScreen` renders a searchable list from `src/config/countries.ts`; each row shows the flag (via `react-native-country-flag`), country name, and dial code.
      - Tapping a row atomically writes both `current_residence_country` and `resident_country_code` to the draft and auto-advances to `Page16ResidenceCityScreen`.
      - A feature-local `CountryPicker` component under `src/features/onboarding/components/` encapsulates the row rendering with theme-token props.
      - Screen wiring test covers row rendering, atomic dual-field write, and auto-advance.
    notes: "Flag library confirmed at scaffold per §17.25."

  - id: 6.2
    title: Page 16 - Current residence city
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page16ResidenceCityScreen` renders a single `TextInput` with `maxLength=40` and letters/spaces/hyphens/apostrophes validation.
      - Continue is disabled until the field validates; on tap writes `current_residence_city` and advances to `Page17KashmirDistrictScreen`.
      - Screen wiring test covers validation and advance.
    notes: ""

  - id: 6.3
    title: Page 17 - Kashmir district + family residence address
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page17KashmirDistrictScreen` renders a pick-one from `options.kashmirDistricts` (22 entries; default preselected `"Srinagar"`) plus a multiline `TextInput` for `family_residence_address` (max 70 chars).
      - Continue is disabled until both fields validate; on tap writes both to the draft and advances to `Page18ParentsScreen`.
      - Screen wiring test covers default preselect, address validation, and advance.
    notes: ""
