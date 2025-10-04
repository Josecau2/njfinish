# Resources Page - ACTUAL Issues From Screenshot Analysis
**Date:** 2025-10-04
**Source:** User-provided screenshot of http://localhost:3000/resources

---

## CRITICAL ISSUES FOUND IN SCREENSHOT

### 1. CATEGORY TILE HEADER - SEVERE OVERLAPPING

**Screenshot Evidence:**
- All tiles show small icons (edit/add/trash) in top-right corner
- These icons are OVERLAPPING with:
  - The folder icon circle
  - The category title text
  - The "Pinned" badge

**Actual Issue:**
Looking at the code (lines 1177-1224), the admin IconButtons are set to `display={{ base: 'none', sm: 'flex' }}`, but in the screenshot they ARE visible and causing overlap.

**The icons are visible but TINY** - they appear as small edit/folder-plus/trash icons squeezed into the top-right corner, overlapping with the main content.

**Code Issue:**
```jsx
<HStack justify="space-between" align="start">
  <HStack align="start" flex={1} minW={0}>
    <Box w={8} h={8} rounded="full"> {/* Folder icon */}
      <Folder color={color} size={ICON_SIZE_MD} />
    </Box>
    <VStack align="start" spacing={0} flex={1} minW={0}>
      <Text fontWeight="bold" fontSize="sm" noOfLines={1}> {/* Title */}
        {category.name}
      </Text>
      {category.isPinned && <Badge>Pinned</Badge>}
    </VStack>
  </HStack>

  {/* THESE ICONS ARE VISIBLE AND OVERLAPPING */}
  {isAdmin && (
    <HStack spacing={1} display={{ base: 'none', sm: 'flex' }}>
      <IconButton /> {/* Edit */}
      <IconButton /> {/* Add */}
      <IconButton /> {/* Trash */}
    </HStack>
  )}
</HStack>
```

**Problem:**
The screenshot is likely at `sm` breakpoint or wider, so icons ARE showing. They're taking up space and causing the folder icon + title area to be squeezed.

---

### 2. FOLDER ICON AND TITLE ALIGNMENT ISSUE

**Screenshot Evidence:**
- In "VIDEOS" tile: Folder icon, "VIDEOS" text, edit icon, folder-add icon are all crammed in one line
- The edit pencil icon appears INSIDE or overlapping the folder circle
- Title "VIDEOS" is positioned right next to folder, but gets cut off by the icons

**Actual Layout:**
```
[Folder Icon] [VIDEOS ✏️📁] [🗑️]
              ^overlapping^
```

**Root Cause:**
- `justify="space-between"` on parent HStack
- Folder icon (32px) + title + 3 IconButtons (36-44px each = 108-132px) = TOO MUCH for small screens
- Even on `sm` (640px), when card is ~280-300px wide, this is 140-164px just for icons + title gets squeezed

---

### 3. PREVIEW SECTION ICONS OVERLAPPING TEXT

**Screenshot Evidence:**
Looking at "VIDEOS" tile preview section:
- "PDFG" has a download icon
- "WELCOME" has a link icon
- These icons appear to be RIGHT next to or overlapping the text

**Code (lines 1307-1336):**
```jsx
<HStack p={2} rounded="md" spacing={2}>
  <Icon as={IconComponent} boxSize={3} flexShrink={0} />
  <Text fontSize="0.8rem" fontWeight="medium" noOfLines={1} flex={1}>
    {label}
  </Text>
</HStack>
```

**Issue:**
- `boxSize={3}` = 12px icon
- `spacing={2}` = 8px between icon and text
- `fontSize="0.8rem"` ≈ 12.8px
- Text is truncated with `noOfLines={1}` but still appears cramped

---

### 4. DESCRIPTION TEXT TRUNCATION

**Screenshot Evidence:**
- "Installati..." card shows "Step-by-step instructions and reference documents." with ellipsis
- "Catalogues" card shows "Latest manufacturer catalogues and product..." with ellipsis
- "Video..." card shows "Recorded walkthroughs and feature highlights." (fits)
- "Referenc..." card shows "Policies, templates, and other key documentation."

**Code (lines 1228-1242):**
```jsx
{category.description && (
  <Text
    fontSize="sm"
    color={textSecondary}
    noOfLines={2}
    mb={3}
    lineHeight="1.3"
    maxH="2.6rem"
    overflow="hidden"
    title={category.description}
  >
    {category.description}
  </Text>
)}
```

**Current State:**
- `noOfLines={2}` IS STILL IN THE CODE
- This is causing the ellipsis truncation visible in screenshot
- User explicitly said "do not truncate" but code still has it

---

### 5. CATEGORY TITLE TRUNCATION

**Screenshot Evidence:**
- "Installati..." is truncated (should be "Installation" or similar)
- "Video..." is truncated
- "Audi..." is truncated
- "Referenc..." is truncated
- "Getti..." is truncated (in the 4th tile)

**Code (line 1166):**
```jsx
<Text fontWeight="bold" fontSize="sm" noOfLines={1} title={category.name}>
  {category.name}
</Text>
```

**Current State:**
- `noOfLines={1}` IS STILL IN THE CODE
- This is causing all the title truncation in the screenshot
- User said "i need to see the entire text inside the button. not truncated"

---

### 6. BADGE STATISTICS LAYOUT

**Screenshot Evidence:**
Looking at badge statistics in each tile:
- VIDEOS: `0` `0` `2` (badges for announcements/links/files)
- Announcements: `0` `0` `0`
- Installati...: `0` `1` `0`
- They appear to be in a single row, no wrapping visible

**Code (line 1245):**
```jsx
<HStack spacing={2} mb={3} flexWrap="wrap">
```

**Status:**
- `flexWrap="wrap"` is added (✓ GOOD)
- In screenshot, badges are not wrapping because numbers are small
- This would work correctly if needed

---

### 7. "PINNED" BADGE OVERLAP WITH TITLE

**Screenshot Evidence:**
- "Announcements" tile: Yellow "Pinned" badge appears below "Announcements" text
- "Installati..." tile: Yellow "Pinned" badge appears below truncated title
- "Getti..." tile (4th tile): Yellow "Pinned" badge below title

**Visual Issue:**
The "Pinned" badge is in the correct position (below title), but because the title is on the same line as the folder icon AND the admin icons are overlapping, the entire header section is cramped.

**Layout:**
```
Current (cramped):
[📁] [Title...      ] [✏️ 📁+ 🗑️]  <- All squished
     [Pinned]

Needed (spacious):
[📁] [Title...      ]              <- Full width for title
     [Pinned]
[Actions on hover or separate row]
```

---

### 8. PREVIEW SECTION "No content available"

**Screenshot Evidence:**
- "Announcements" tile: Shows "No content available" with folder icon
- "Getti..." tile: Shows "No content available" with folder icon

**Code (lines 1350-1370):**
```jsx
<Box
  flex={1}
  minH="100px"
  display="flex"
  flexDirection="column"
  justifyContent="center"
  alignItems="center"
  py={3}
>
  <Icon as={Folder} boxSize={6} opacity={0.5} color={textMuted} mb={2} />
  <Text fontSize="0.75rem" color={textMuted}>
    {t('resources.messages.noContent', 'No content available')}
  </Text>
</Box>
```

**Status:** ✓ APPEARS CORRECT in screenshot

---

## SUMMARY OF ACTUAL BUGS FROM SCREENSHOT

### Critical (Breaking Layout):
1. ❌ **Admin IconButtons visible and overlapping** - Icons show at `sm` breakpoint, causing severe header cramping
2. ❌ **Category title truncated** - `noOfLines={1}` still in code (line 1166)
3. ❌ **Description truncated** - `noOfLines={2}` still in code (line 1230)

### High Priority:
4. ⚠️ **Preview items cramped** - Icon + text spacing too tight
5. ⚠️ **Overall header section too dense** - Folder icon + title + badges + admin buttons all fighting for space

### Code vs Reality Mismatch:
- **User said:** "do not truncate"
- **Code has:** `noOfLines={1}` on titles, `noOfLines={2}` on descriptions
- **Screenshot shows:** Truncation with "..." ellipsis everywhere

---

## ROOT CAUSE ANALYSIS

The main issue is **HEADER DENSITY**:

```
Available width in card header: ~250-280px (on typical screen)
Occupied by:
- Folder icon: 32px (w={8})
- Title area: ~100-150px (flex={1})
- Admin icons: 3 × 36px = 108px (at sm breakpoint)
- Spacing: ~16-24px
TOTAL: 256-314px

Result: OVERFLOW and cramping at sm and md breakpoints
```

---

## REQUIRED FIXES

### Fix 1: Remove ALL noOfLines truncation
**Lines to change:**
- Line 1166: Remove `noOfLines={1}` from category title
- Line 1230: Remove `noOfLines={2}` from description
- Any other instances

### Fix 2: Admin IconButtons layout
**Options:**
A. Hide on sm, only show on md+ (current approach doesn't work)
B. Move to CardFooter as separate action row
C. Show on hover only with absolute positioning
D. Reduce to single "..." menu button on mobile

### Fix 3: Increase spacing in preview items
**Line 1320:**
```jsx
<HStack spacing={2}>  // Change to spacing={3}
  <Icon boxSize={3} /> // Change to boxSize={4} for better visibility
```

### Fix 4: Optimize header layout
Consider:
```jsx
<CardHeader>
  <VStack align="stretch" spacing={2}>
    <HStack justify="space-between">
      <HStack>
        <Icon />
        <VStack align="start">
          <Text>{title}</Text>  {/* NO noOfLines */}
          {isPinned && <Badge />}
        </VStack>
      </HStack>
      {/* Admin actions - show/hide based on actual space */}
    </HStack>
  </VStack>
</CardHeader>
```

---

**End of Actual Issues Audit**
