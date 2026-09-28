# Salary and Job Offer Planner

A private, browser-only tool that helps you understand a job offer in Saudi riyals (SAR), plan your monthly budget, and compare two offers.

## What it does

- **Level 1 — Salary estimate:** calculates gross pay, estimated deductions, take-home pay, retention rate, and a compensation breakdown from basic salary, housing, transport, and a deduction rate.
- **Interactive simulator:** move the basic-salary slider to see the estimated change in take-home pay.
- **Level 2 — Savings planner:** enter monthly bills and a savings target to see money remaining, your savings capacity as a share of take-home pay, and the estimated number of months to reach the goal.
- **Level 3 — Offer comparison:** compare Offer A and Offer B, including their estimated monthly and annual take-home difference.

## Who it is for

Anyone comparing a monthly job offer or planning a simple monthly budget. It is an estimate, not payroll, tax, or legal advice.

## Privacy

Your entries never leave your browser. The app uses `localStorage` only to restore your values on this device and browser. It does not use a server, database, analytics, APIs, or external dependencies.

## How to run it

1. Open this project folder.
2. Double-click `index.html`.
3. The planner opens in your default web browser — no installation, build step, or web server is needed.

## Try it with the sample data

The page starts with fictional built-in sample values from `sample-data/data.js`. Select **Load example** at any time to restore them. This replaces the values saved in the browser after confirmation.

## Calculation assumptions

All values are monthly and use Saudi riyals (SAR).

- **Deduction base** = basic salary + housing allowance
- **Estimated deductions** = deduction base × deduction percentage
- **Gross salary** = basic salary + housing allowance + transport allowance
- **Estimated take-home** = gross salary − estimated deductions
- **Savings timeline** = savings goal ÷ money left after bills, rounded up to full months
- **Savings capacity** = money left after bills ÷ estimated take-home pay. The meter shows 0–100%; if bills exceed income, the app reports the SAR shortfall instead of displaying a negative meter.

The app uses a playful cream, coral, purple, and yellow design with visible focus states, responsive layouts, reduced-motion support, and a forced-colors fallback. Confirm actual deductions, benefits, payroll rules, and offer terms with the employer.

Built with Claude Code during the KKU Claude Code hackathon
Started on 2026-09-28
