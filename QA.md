# QA Matrix

## Devices Tested
- [ ] iPhone SE (375x667)
- [ ] iPhone 13/14/15 (390x844)
- [ ] iPad (768x1024)
- [ ] Laptop (1366x768)
- [ ] Desktop (1920x1080)

## Color Modes
- [ ] Light mode
- [ ] Dark mode

## Routes (from manifest)
- [ ] All routes listed in `AUDIT/manifest.json` tested
- [ ] No horizontal scroll on any route
- [ ] Sticky header works on all pages
- [ ] Sidebar drawer works on mobile
- [ ] Grid reflows correctly
- [ ] All tap targets >= 44x44
- [ ] Toasts readable
- [ ] Icons properly sized

## Modals
- [ ] All modals full-screen on mobile
- [ ] Scroll inside modal (not body)
- [ ] No overlapping modals

## Customization
- [ ] Brand colors apply correctly
- [ ] Logos show light/dark versions
- [ ] Auth pages use customization colors
- [ ] PDF uses customization colors/logo
- [ ] No other customization supported

## Accessibility
- [ ] All tests pass
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader friendly
- [ ] Reduced motion respected

## Performance
- [ ] Bundle size under threshold
- [ ] Loading skeletons show
- [ ] No layout shifts

## i18n
- [ ] No hardcoded strings detected
- [ ] All user-facing text uses keys