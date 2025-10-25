# Routing and Theme Fixes - Summary

## Issues Fixed

### 1. **Org-Switcher Not Changing Routes** ✅

**Problem**: When selecting a firm from the org-switcher, the URL didn't update and the page didn't navigate.

**Root Cause**: Using `router.push()` followed by `router.refresh()` doesn't trigger a full page reload, which is needed to update server-side context for firm switching.

**Solution**: Changed to `window.location.href` for full page navigation.

```typescript
// Before (didn't work):
router.push(`${basePath}/dashboard/overview`);
router.refresh();

// After (works):
window.location.href = `${basePath}/dashboard/overview`;
```

**File Changed**: `src/components/org-switcher.tsx`

---

### 2. **Theme Colors Not Applying** ✅

**Problem**: Firm theme colors weren't being applied when switching firms.

**Root Cause**: The CSS variable `--primary` was being set as a hex value, but Tailwind CSS expects HSL format in space-separated format (e.g., `220 90% 50%`).

**Solution**: Added hex-to-HSL conversion in the ThemeContext to properly format colors for Tailwind.

```typescript
// Before (didn't work):
document.documentElement.style.setProperty('--primary', '#3b82f6');

// After (works):
// Converts #3b82f6 to HSL
document.documentElement.style.setProperty('--primary', '217 91% 60%');
```

**File Changed**: `src/contexts/theme-context.tsx`

---

### 3. **Firm Selection Page Navigation** ✅

**Problem**: Similar routing issue on the firm selection page.

**Solution**: Updated to use `window.location.href` instead of `router.push()`.

**File Changed**: `src/components/firm-selection-client.tsx`

---

## How It Works Now

### Firm Switching Flow

1. **User clicks on firm** in OrgSwitcher or Firm Selection page
2. **Theme color is set** via `setThemeColor()` hook
   - Hex color is converted to HSL format
   - CSS variable `--primary` is updated on `<html>` element
   - Cookie is set for persistence
3. **Firm ID is stored** in cookie (`selected_firm_id`)
4. **Full page navigation** occurs via `window.location.href`
5. **Server re-renders** with new firm context
6. **Theme persists** from cookie on page load

### Theme Color Format

Tailwind CSS uses HSL format for CSS variables:

```css
/* In globals.css */
--primary: 217 91% 60%; /* H S% L% format */
```

The ThemeContext automatically converts hex colors (e.g., `#3b82f6`) to this format.

---

## Files Modified

1. `src/components/org-switcher.tsx`
   - Removed `useRouter` import
   - Changed navigation to `window.location.href`
   - Kept theme color application

2. `src/contexts/theme-context.tsx`
   - Added hex-to-HSL conversion algorithm
   - Applies color in Tailwind-compatible format
   - Handles null colors (removes CSS variable)

3. `src/components/firm-selection-client.tsx`
   - Removed `useRouter` import
   - Changed navigation to `window.location.href`
   - Kept theme color application

---

## Testing Checklist

- [x] Switching firms updates the URL correctly
- [x] Theme colors apply when switching firms
- [x] Theme colors persist on page reload
- [x] Admin mode navigation works
- [x] Firm-specific navigation works
- [x] Cookie storage works correctly

---

## Technical Details

### Hex to HSL Conversion Algorithm

```typescript
const hex = '#3b82f6';
const r = parseInt(hex.substring(1, 3), 16) / 255;
const g = parseInt(hex.substring(3, 5), 16) / 255;
const b = parseInt(hex.substring(5, 7), 16) / 255;

const max = Math.max(r, g, b);
const min = Math.min(r, g, b);
let h = 0, s = 0, l = (max + min) / 2;

if (max !== min) {
  const d = max - min;
  s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
}

h = Math.round(h * 360);
s = Math.round(s * 100);
l = Math.round(l * 100);

// Result: "217 91% 60%"
```

### Cookie Format

```javascript
// Firm ID cookie
selected_firm_id=clxxx123; path=/; max-age=31536000; SameSite=Lax

// Theme color cookie (hex format for storage)
firm_theme_color=#3b82f6; path=/; max-age=31536000; SameSite=Lax
```

---

## Why window.location vs router.push?

**window.location.href**:
- ✅ Full page reload
- ✅ Server context updates
- ✅ All cookies re-read
- ✅ Fresh data fetch
- ❌ Slower (full reload)
- ❌ No transition animation

**router.push()**:
- ✅ Faster (client-side)
- ✅ Smooth transitions
- ❌ Server context not updated
- ❌ Cookies not re-read immediately
- ❌ Can cause stale state

For firm switching, we need the full context update, so `window.location.href` is the right choice.

---

## Next Steps

Now that routing and theming are fixed, you can proceed with:

1. Module system implementation
2. Dynamic routing for modules
3. Sidebar navigation generation
4. HR module pages

See `MODULE_SYSTEM_GUIDE.md` for module implementation details.
