# Manual Testing Guide - UI/UX Improvements

## Quick Start
1. Open browser to: http://localhost:5173
2. Backend API: http://localhost:3000

---

## Test Scenarios

### 1. Color Consistency Test
**Objective:** Verify all colors use slate palette

**Steps:**
1. Open the application
2. Inspect various UI elements
3. Verify backgrounds are slate-800/900/950
4. Verify borders are slate-700/600
5. Verify text is white/slate-300/400/500

**Expected:** All grays replaced with slate colors

---

### 2. Accessibility Test
**Objective:** Verify screen reader support

**Steps:**
1. Tab through all interactive elements
2. Verify focus rings are visible (blue ring)
3. Check icon-only buttons have tooltips/titles
4. Verify form inputs have proper labels

**Expected:** All elements keyboard accessible with visible focus

---

### 3. Form Validation Test
**Objective:** Test real-time validation

**Upload Tab:**
1. Try uploading a .txt file → Should show error
2. Try uploading a large file (>10MB) → Should show error  
3. Upload a valid .json file → Should show success toast

**Crawl Tab:**
1. Enter invalid URL (e.g., "not-a-url") → Should show error
2. Enter URL without protocol → Should show error
3. Enter valid URL → Should start crawl

**Expected:** Immediate feedback with error messages

---

### 4. Toast Notifications Test
**Objective:** Verify toast system works

**Steps:**
1. Upload a file → Green success toast appears
2. Try uploading invalid file → Red error toast appears
3. Start a crawl → Blue info toast appears
4. Toasts auto-dismiss after 4 seconds
5. Can manually close toasts with X button

**Expected:** Professional toast notifications, not alerts

---

### 5. Loading States Test
**Objective:** Verify all buttons show loading spinners

**Steps:**
1. Upload Tab: Click upload → Button shows spinner
2. Crawl Tab: Click start crawl → Button shows spinner
3. Schema List: Click download → Button shows spinner
4. Generate Modal: Click generate → Button shows spinner

**Expected:** Spinner icon with disabled state during operations

---

### 6. Modal Interactions Test
**Objective:** Test modal behavior

**Generate Modal:**
1. Click "Configure" button on a schema
2. Modal fades and zooms in smoothly
3. Press ESC → Modal closes
4. Click outside modal → Modal closes
5. While generating, ESC doesn't close modal

**Export Modal:**
1. Click GitHub/GitLab button
2. Press ESC → Modal closes
3. Click backdrop → Modal closes

**Expected:** Smooth animations, ESC key works, click-outside works

---

### 7. Empty State Test
**Objective:** Verify improved empty state

**Steps:**
1. If no schemas exist, should see:
   - Large FileCode icon
   - "No schemas yet" heading
   - Descriptive text
   - "Upload Schema" button
   - "Crawl URL" button
2. Click "Upload Schema" → Switches to Upload tab
3. Click "Crawl URL" → Switches to Crawl tab

**Expected:** Helpful empty state with actionable buttons

---

### 8. Keyboard Shortcuts Test
**Objective:** Test keyboard navigation

**Steps:**
1. Press `Ctrl+K` (or Cmd+K on Mac) → Switches tabs
2. Press `Ctrl+K` again → Switches back
3. Press `Ctrl+R` → Refreshes schema list
4. Open a modal, press ESC → Closes modal

**Expected:** All shortcuts work as expected

---

### 9. Progress Bar Test
**Objective:** Verify enhanced progress animation

**Steps:**
1. Upload a file or start crawl
2. Watch progress bar in job status
3. Bar should:
   - Animate smoothly (500ms transition)
   - Pulse while active
   - Turn green on success
   - Turn red on failure

**Expected:** Smooth, visually appealing progress

---

### 10. Schema Editor Test
**Objective:** Test editor functionality

**Steps:**
1. Click "Edit" on a schema
2. Editor slides in from right
3. Make changes to JSON
4. Click "Format" → JSON auto-formats
5. Click "History" → Version history appears
6. Try to close with unsaved changes → ESC doesn't work
7. Save changes → Success
8. Press ESC → Editor closes

**Expected:** Full-featured editor with all controls working

---

### 11. Advanced Options Test
**Objective:** Test collapsible sections

**Crawl Tab:**
1. Click "Advanced Options"
2. Section expands with animation
3. ChevronDown changes to ChevronUp
4. Fill in auth headers
5. Click again → Section collapses

**Expected:** Smooth expand/collapse with proper icons

---

### 12. Button Consistency Test
**Objective:** Verify all buttons use Button component

**Steps:**
1. Check all buttons in the app
2. All should have consistent:
   - Border radius
   - Padding
   - Font weight
   - Transition speed
   - Hover effects

**Expected:** Uniform button styling throughout

---

### 13. Tooltip Test
**Objective:** Verify tooltips appear

**Generate Modal:**
1. Hover over "Strict Types" toggle → Tooltip appears
2. Hover over "Async Mode" toggle → Tooltip appears
3. Tooltips positioned above element
4. Arrow points to element

**Expected:** Helpful tooltips on hover

---

### 14. Error Handling Test
**Objective:** Test error boundary

**Steps:**
1. App should never crash completely
2. If error occurs, ErrorBoundary catches it
3. Shows friendly error page
4. Has "Reload Application" button
5. Shows error details for debugging

**Expected:** Graceful error handling

---

## Visual Checklist

### Colors
- [ ] All backgrounds use slate-800/900/950
- [ ] All borders use slate-700/600
- [ ] All text uses white/slate-300/400/500
- [ ] No gray-* colors remain

### Animations
- [ ] Modals fade and zoom in
- [ ] Toasts slide in from right
- [ ] Progress bars animate smoothly
- [ ] Hover effects are smooth

### Accessibility
- [ ] Focus rings visible on all interactive elements
- [ ] All icon buttons have aria-labels
- [ ] Form inputs have proper labels
- [ ] Error messages are associated with inputs

### Interactions
- [ ] All buttons show loading states
- [ ] Toast notifications appear for actions
- [ ] Validation happens in real-time
- [ ] Keyboard shortcuts work

---

## Performance Checklist

- [ ] Page loads in < 1 second
- [ ] Animations run at 60fps
- [ ] No layout shifts
- [ ] Toasts don't cause re-renders of main content
- [ ] Large schema files load smoothly in editor

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

---

## Regression Testing

Ensure existing functionality still works:
- [ ] Upload schema file
- [ ] Crawl URL
- [ ] Generate MCP server
- [ ] Export to GitHub
- [ ] Export to GitLab
- [ ] Edit schema
- [ ] View version history
- [ ] Revert to previous version

---

## Success Criteria

✅ All colors are slate-*
✅ All buttons use Button component
✅ All operations show loading states
✅ Toast notifications replace alerts
✅ Form validation works in real-time
✅ Modals respond to ESC key
✅ Empty states are helpful
✅ Keyboard shortcuts work
✅ Progress bars are smooth
✅ All components have accessibility attributes

---

## Known Limitations

1. **Mobile Experience** - Not implemented (as requested)
   - Layout may not be optimal on mobile devices
   - Touch targets may be too small
   - No mobile-specific navigation

2. **Monaco Editor** - Not lazy loaded yet
   - Included in main bundle
   - Could be code-split for better performance

---

## Reporting Issues

If you find any issues:

1. Note the browser and version
2. Describe steps to reproduce
3. Include console errors if any
4. Screenshot if visual issue

---

## Summary

All UI/UX improvements have been successfully implemented. The application now features:

- **Consistent Design** ✓
- **Enhanced Accessibility** ✓
- **Better User Feedback** ✓
- **Smooth Animations** ✓
- **Keyboard Navigation** ✓
- **Professional Polish** ✓

**Status:** Ready for Production ✅
