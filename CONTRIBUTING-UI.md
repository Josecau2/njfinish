# UI Guardrails

1) Chakra for components/behavior; Tailwind for layout/spacing/typography utilities.
2) Use theme tokens; avoid hard-coded px colors/sizes if tokens exist.
3) **All interactive elements >= 44×44 px** tap targets.
4) **Zero horizontal overflow** on all routes; wrap inner regions if needed.
5) Mobile-first breakpoints: sm 640, md 768, lg 1024, xl 1280, 2xl 1536.
6) All user-visible strings via i18n keys (no hardcoded English).
7) **Customization scope locked** to: brand colors & logos, PDF invoice styling, and colors on auth pages (Login, Password Reset, Request Access). Nothing else.
8) Respect dark mode; verify contrast.
9) Respect prefers-reduced-motion for users sensitive to animations.
10) All async routes must have loading skeletons.
11) Tables must be responsive (cards on mobile, horizontal scroll on desktop).
12) All interactive elements must have visible focus indicators for keyboard navigation.