# Showroom Mode Implementation Summary

## Overview
This implementation adds a comprehensive "showroom mode" feature that allows admin users to apply an additional pricing multiplier across all proposal calculations, PDF generation, and order acceptance snapshots.

## Architecture

### Multiplier Chain
The system now supports a three-stage multiplier chain:
1. **Manufacturer Cost Multiplier** (applied first)
2. **User Group Multiplier** (applied second)
3. **Showroom Multiplier** (applied third, admin-only)

Final Price = Base Price × Manufacturer Multiplier × User Group Multiplier × Showroom Multiplier

### Components Added

#### 1. ShowroomModeToggle Component (`frontend/src/components/showroom/ShowroomModeToggle.jsx`)
- Admin-only toggle in the navigation sidebar
- Real-time on/off switch with status indicator
- Configuration modal for setting multiplier value
- Input validation (0.01 to 10.0 range)
- Persistent storage using localStorage
- Custom event system for cross-component communication

#### 2. Showroom Utilities (`frontend/src/utils/showroomUtils.js`)
- `getShowroomSettings()` - Get current mode and multiplier
- `isShowroomModeActive()` - Check if showroom mode is enabled
- `getShowroomMultiplier()` - Get current multiplier value
- `applyShowroomMultiplier()` - Apply multiplier to values
- `addShowroomSettingsListener()` - Event listener for settings changes
- `calculateShowroomAwarePricing()` - Enhanced pricing calculation

### Integration Points

#### 1. Navigation (`frontend/src/_nav.js`)
- Added ShowroomModeToggle component to admin-only navigation
- Appears discretely below dashboard for authorized users

#### 2. Pricing Engine (`frontend/src/utils/pricing.js`)
- Extended `applyMultiplierToItems()` to include showroom multiplier
- Updated `computeSummary()` to handle showroom pricing
- Maintains backward compatibility with existing two-stage system

#### 3. Main Pricing Components
**ItemSelectionContent.jsx (Create Proposal)**
- Added showroom mode state tracking
- Integrated showroom multiplier into all pricing calculations
- Updated assembly fee calculations to include showroom multiplier
- Enhanced style switching to respect showroom pricing

**ItemSelectionContentEdit.jsx (Edit Proposal)**
- Added showroom mode state and event listeners
- Updated multiplier application effects to include showroom multiplier
- Enhanced custom items and modifications calculations
- Updated dependency arrays for proper reactivity

#### 4. PDF Generation (`frontend/src/components/model/PrintProposalModal.jsx`)
- Added showroom pricing application to PDF output
- Updated price summary calculations
- Modified proposal items pricing to include showroom multiplier
- Ensures PDF reflects current showroom mode settings

#### 5. Order Acceptance Snapshots
- The existing order acceptance flow in `controllers/proposalsController.js` will automatically capture showroom pricing since it reads from the updated proposal data
- Snapshots preserve the exact pricing state at time of acceptance
- No additional backend changes needed due to existing robust snapshot architecture

### Key Features

#### Admin-Only Access
- Only users with `isAdmin()` permissions can see and use showroom mode
- Hidden from contractors and standard users
- Permission-based navigation integration

#### Real-Time Updates
- Changes to showroom settings immediately update all open proposal calculations
- Event-driven architecture ensures consistency across components
- No page refresh required

#### Persistent Storage
- Settings stored in localStorage for session persistence
- Survives page refreshes and navigation
- Configurable multiplier retained between sessions

#### Assembly Fee Integration
- Fixed assembly fees: affected by showroom multiplier
- Percentage assembly fees: calculated on showroom-adjusted prices
- Maintains existing assembly fee calculation order (after all multipliers)

#### PDF Consistency
- PDF output matches on-screen pricing exactly
- Showroom pricing applied to all line items and totals
- Professional presentation for customer-facing documents

### Data Flow

1. **Admin Configuration**: Admin sets showroom mode and multiplier via toggle/modal
2. **Storage**: Settings saved to localStorage with custom event emission
3. **Component Sync**: All pricing components listen for setting changes
4. **Calculation**: Pricing engine applies full multiplier chain
5. **Display**: UI shows showroom-adjusted pricing in real-time
6. **PDF Generation**: PDF reflects current showroom pricing
7. **Order Acceptance**: Snapshot captures showroom pricing state

### Testing Considerations

1. **Toggle Functionality**: Verify admin-only visibility and toggle operation
2. **Multiplier Application**: Test pricing calculations across create/edit flows
3. **PDF Generation**: Confirm PDF pricing matches on-screen values
4. **Order Snapshots**: Validate acceptance captures showroom pricing
5. **Permission Enforcement**: Ensure non-admin users cannot access feature
6. **Data Persistence**: Test settings retention across sessions
7. **Edge Cases**: Validate multiplier boundaries and error handling

### Benefits

- **Flexible Pricing**: Easy adjustment for showroom displays or special pricing
- **Admin Control**: Centralized control over pricing presentation
- **Consistency**: Unified pricing across all user touchpoints
- **Transparency**: Clear indication when showroom mode is active
- **Maintainability**: Clean separation of concerns with utility functions

### Backward Compatibility

- Existing proposals and calculations remain unchanged when showroom mode is off
- No database schema changes required
- Gradual adoption possible (can be enabled/disabled as needed)
- Legacy multiplier system fully preserved
