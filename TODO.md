# Quiz Exit Flow Implementation Plan

## Task: Implement proper exit flow with explanations for each exit type

### Changes Required:

1. [ ] Update handleLeaveRoom to redirect to /play/${gamePin}/submitted instead of "/"
2. [ ] Update timer expiry redirect to /play/${gamePin}/submitted
3. [ ] Add "Go Home" button to warning modal
4. [ ] Update second tab switch redirect to /play/${gamePin}/submitted?reason=TAB_SWITCH_LIMIT

### Files to Edit:
- app/play/[gamePin]/page.tsx

### Testing:
- Manual submit should show submission page
- Timer expiry should show submission page
- First tab switch should show warning with "Go Home" button
- Second tab switch should show submission page
