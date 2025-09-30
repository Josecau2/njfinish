# UI Guardrails

1) Chakra for components/behavior; Tailwind for layout/spacing/typography utilities.
2) Use theme tokens; avoid hard-coded px colors/sizes if tokens exist.
3) **All interactive elements >= 44×44 px** tap targets.
4) **Zero horizontal overflow** on all routes; wrap inner regions if needed.
5) Mobile-first breakpoints: sm 640, md 768, lg 1024, xl 1280, 2xl 1536.
6) All user-visible strings via i18n keys.
7) **Customization scope locked** to: brand colors & logos, PDF invoice styling, and colors on auth pages (Login, Password Reset, Request Access). Nothing else.
8) Respect dark mode; verify contrast.