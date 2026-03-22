---
name: business-research-gas-deploy
description: Deploy Business Research dashboard changes to the fixed production GAS project using clasp with fixed scriptId/deploymentId. Use after editing plugins/business-research/scripts/dashboard.html or setup_dashboard.gs.
---

# Business Research GAS Deploy

## Scope

- Use only for this repository: `/Users/naotohamada/programs/business-research`
- Target GAS project is fixed:
  - `scriptId`: `1GvUMaEF5o5hq0nCn_iG0FxJ2q-OpEpukAjEPwS0ysr7BeIYG_Y0OHNov`
  - `deploymentId`: `AKfycbyDivGNXvt1zfljpx1E1Lt-6Vgy-m-0V16Pi47ddCn7B_THcATjnTh90cwanAqLZKgy`
  - Web app URL: `https://script.google.com/macros/s/AKfycbyDivGNXvt1zfljpx1E1Lt-6Vgy-m-0V16Pi47ddCn7B_THcATjnTh90cwanAqLZKgy/exec`

## Trigger

- User asks to deploy dashboard/GAS changes after UI/code edits.

## Workflow

1. Ensure source files are up to date in this repo:
   - `plugins/business-research/scripts/dashboard.html`
   - `plugins/business-research/scripts/setup_dashboard.gs`
2. Run:
   - `plugins/business-research/scripts/deploy_business_research_gas.sh "<deploy message>"`
3. Report:
   - `clasp push` result
   - created version number
   - deployment ID
   - confirmation that deployment ID points to the new version

## Guardrails

- Do not ask for IDs; always use the fixed IDs above.
- Do not deploy to `@HEAD`.
- If `clasp` network errors occur, rerun with escalated permissions.
- If clone/pull fails, stop and report exact error instead of guessing another project.
