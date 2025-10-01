# AUTH PAGES - VISUAL VERIFICATION CHECKLIST

## WHAT TO TEST (Manual Browser Verification Required)

### LoginPage `/login`
- [ ] Logo centered on mobile AND desktop
- [ ] Title "Sign In" centered
- [ ] Subtitle centered
- [ ] Form labels LEFT-aligned (not centered!)
- [ ] Input fields full width, properly aligned
- [ ] Password toggle icon aligned inside input on right
- [ ] Checkbox and "Forgot Password" link on same line, space-between
- [ ] "Sign In" button full width, centered text
- [ ] Footer text centered
- [ ] No horizontal scroll on mobile
- [ ] No text overflow anywhere
- [ ] 50/50 split works on desktop ≥1024px
- [ ] Left panel hidden on mobile <1024px

### ForgotPasswordPage `/forgot-password`
- [ ] Logo centered
- [ ] Title centered
- [ ] Subtitle centered
- [ ] Form label LEFT-aligned
- [ ] Input field full width
- [ ] Submit button full width
- [ ] Footer text centered with link
- [ ] Responsive layout works

### RequestAccessPage `/request-access`
- [ ] Logo centered
- [ ] Title centered
- [ ] Subtitle centered
- [ ] Benefits box displays properly with gray background
- [ ] Benefits list items aligned with checkmark icons
- [ ] All form labels LEFT-aligned
- [ ] Name fields in 2-column grid on desktop, stack on mobile
- [ ] City/State/Zip in 3-column grid on desktop, stack on mobile
- [ ] All inputs same height (48px on desktop)
- [ ] Textarea proper size
- [ ] Character counter displays under textarea
- [ ] Submit button full width
- [ ] Footer centered

### ResetPasswordPage `/reset-password/:token`
- [ ] Logo centered
- [ ] Title centered
- [ ] Subtitle centered
- [ ] Form label LEFT-aligned
- [ ] Input field full width
- [ ] Submit button full width
- [ ] Footer text centered

## MOBILE SPECIFIC (<1024px)
- [ ] All pages: Left panel completely hidden
- [ ] All pages: Right panel takes full width
- [ ] All pages: Logo visible and centered
- [ ] All pages: Titles/subtitles properly sized
- [ ] All pages: Form elements properly sized for touch
- [ ] All pages: No horizontal scrolling
- [ ] All pages: Proper padding (not touching edges)

## DESKTOP SPECIFIC (≥1024px)
- [ ] All pages: 50/50 split visible
- [ ] All pages: Left panel shows branding
- [ ] All pages: Right panel shows form
- [ ] All pages: Content max-width enforced (448px)
- [ ] All pages: Proper vertical centering
- [ ] All pages: Consistent padding

## FORMS
- [ ] All labels are LEFT-aligned (NOT centered!)
- [ ] All inputs are full-width within container
- [ ] All inputs have proper focus states (blue border)
- [ ] All required fields show asterisk
- [ ] All buttons are properly styled
- [ ] All touch targets ≥44px (mobile) / 48px (desktop)

## CRITICAL ALIGNMENT ISSUE I LIKELY MISSED:
**Form labels and inputs should be LEFT-aligned even though titles are centered!**

This is standard form UX - titles can be centered, but form fields should ALWAYS be left-aligned for readability.
