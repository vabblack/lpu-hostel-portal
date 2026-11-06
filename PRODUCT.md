# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary User:** Undergraduate and postgraduate university students residing or planning to reside on campus at Lovely Professional University (LPU). They are in the critical transition period before or during an academic session, making high-stakes decisions about their living environment, annual budget, and roommates.
- **Secondary Users:**
  - **Hostel Wardens:** Resident faculty/staff overseeing specific complexes (e.g. BH-1, GH-1), handling room inspections, verifying student eligibility, and signing off on delegated bed allocations.
  - **University Administrators & Registrar:** Institutional authorities managing intake cycles, campus-wide bed capacity, disciplinary records, and electrical overage reconciliation.

## Product Purpose

Provide an authoritative, transparent, and seamless student-centric living portal that eliminates the ambiguity, manual paperwork, and roommate friction of university accommodation. Success means a student can explore all 14 residential complexes, evaluate exact fees and metered electrical allowances, find an aligned roommate via verified lifestyle dimensions, submit up to 3 prioritized room choices, and track their allocation with total confidence.

## Positioning

Unlike generic off-the-shelf hostel or hotel booking systems, this platform is deeply specialized for university residential life:
1. **Algorithmic Lifestyle Compatibility:** 7-factor deterministic roommate matching (sleep schedule 22%, cleanliness 17%, study habits 17%, noise tolerance 11%, dietary 11%, social 11%, AC temperature 11%) with strictly zero smoking references, enforcing same-gender safety and mutual room choice alignment.
2. **Transparent Academic Session Economics:** Full visibility into 10-month session fee tiers, Early Decision Benefit (EDB) savings of ₹10,000, and individualized kilowatt-hour (kWh) electricity quotas with equitable roommate overage splitting.
3. **Institutional Integrity:** Authoritative verification against official LPU Student Registry records, strict gender isolation (Boys Hostels BH-1 to BH-8, Girls Hostels GH-1 to GH-6), and multi-choice prioritized intake cycles.

## Operating Context

- **Academic Cycles:** Intake periods synchronized with university semesters (e.g. Fall 2026 / Academic Year 2026–27).
- **Physical Environment:** 14 multi-storey residential complexes housing ~1,850+ beds across diverse configurations (1 to 8-seater standard rooms, studio apartments with pantries, and dormitories).
- **Dining & Auxiliary Ecosystem:** Pro Bricks mess halls offering 6 regional Indian cuisines (North Indian, South Indian, Rajasthani, Haryanvi, Gujarati, Eastern) and customizable meal plans (2, 3, 4 meals or à la carte).
- **Regulatory Environment:** Campus safety protocols enforcing strict contraband restrictions (immersion heating rods and induction cooktops strictly banned; laptops, electric kettles, and clothes irons allowed).

## Capabilities and Constraints

- **Hostel Inventory Hierarchy:** Campus $\rightarrow$ Hostel Complex $\rightarrow$ Block $\rightarrow$ Floor $\rightarrow$ Room Unit $\rightarrow$ Individual Bed (A, B, C...).
- **Room Configurations:**
  - Capacities: 1, 2, 3, 4, 5, 6, 7, and 8-seaters.
  - Categories: Standard Room, Studio Apartment (pantry + attached washroom), Dormitory (common washroom).
  - Cooling: Air-Conditioned (AC) vs Air-Cooled.
  - Electricity Quotas: 250 kWh to 1,000 kWh per 10-month session based on room seater and cooling type.
- **Application Engine:** Up to 3 prioritized choices per student per intake cycle. Immutable audit trail on all status transitions (Draft $\rightarrow$ Submitted $\rightarrow$ Under Review $\rightarrow$ Approved $\rightarrow$ Allocated / Waitlisted).
- **Roommate Matching Engine:** Direct student ID search and algorithmic discovery feed; mutual request handshake required before atomic group locking; groups bounded by target room capacity (2–4 beds).
- **Security & Authorization:** Session-based authentication with dual-identity login (institutional email or Student ID), CSRF protection, and strict Role-Based Access Control (Student, Warden, Admin).

## Brand Commitments

- **Institutional Identity:** Official residential portal of Lovely Professional University (LPU).
- **Visual Tone:** Academic, authoritative, crisp, and welcoming. Primary palette rooted in Academic Navy (`#1e3a8a`) and Royal Blue (`#2563eb`), supported by clean slate neutrals and distinct status indicators.
- **Copy Voice:** Direct, respectful, empowering, and unambiguous. Educational terms match official university handbooks without administrative jargon.

## Evidence on Hand

- **Campus Inventory Data:** 14 active residential towers (BH-1 to BH-8, GH-1 to GH-6), 476 rooms, and 1,858 beds seeded in database.
- **Official Fee Schedule:** Verified 10-month session fee matrix including Early Decision Benefits and kilowatt-hour electricity allowances.
- **Authoritative Student Registry:** Pre-configured student records across departments (Computer Science, Mechanical, Electronics, Civil, Biotechnology).

## Product Principles

1. **Student Clarity Over Administrative Friction:** Present fees, rules, quotas, and bed vacancies plainly upfront so students never encounter surprise charges or opaque decisions.
2. **Deterministic, Respectful Compatibility:** Pair students based on scientifically weighted lifestyle harmony rather than superficial filters, preserving personal dignity and quiet comfort.
3. **Integrity at Every Transaction Boundary:** Guarantee concurrency safety and atomicity—no bed can ever be double-allocated, and room alignment must be mutual.
4. **Lean, Zero-Slop Execution:** Prioritize fast rendering, accessible navigation, and semantic HTML/CSS tokens over bloated dependencies or unnecessary visual fluff.

## Accessibility & Inclusion

- Adhere to WCAG 2.1 AA standards for contrast ratios (minimum 4.5:1 for body copy).
- Provide explicit keyboard focus indicators, screen-reader friendly form controls, and aria-expanded state attributes.
- Ensure all color-coded badges (e.g. Vacant vs Full, AC vs Cooler) include accompanying readable text labels.
