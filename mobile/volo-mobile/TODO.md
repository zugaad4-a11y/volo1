# VOLO Mobile App Map Integration Swap Plan & Checklist

This file tracks the outstanding integrations for the maps API and lists the screens that currently rely on the simulator placeholder component.

## 🗺️ Screen Checklist
Before submitting the app to the iOS App Store or Google Play Store, the `MapPlaceholder` must be replaced with a live `react-native-maps` implementation across the following screens:

- [ ] **Customer Booking Details / Tracking Screen**
  - Path: `mobile/volo-mobile/app/(customer)/bookings/[id].tsx`
  - Current Behavior: Renders simulated HUD radar, ETA, and coordinates log.
  - Action Required: Initialize `MapView`, place markers for Customer Home and Worker Vehicle location, and render direction polyline.

- [ ] **Worker Active Job Details / Navigation Screen**
  - Path: `mobile/volo-mobile/app/(worker)/jobs/[id].tsx`
  - Current Behavior: Renders simulated radar and mock coordinate overlays.
  - Action Required: Integrate native routing from the worker's current location to the customer's coordinates.

---

## 🔒 Checklist Gate
> [!CAUTION]
> **DO NOT SUBMIT APP TO STORES WITH THE PLACEHOLDER ACTIVE.**
> 
> Production builds (release schema) MUST be configured with valid Google Maps SDK keys (Android) and Apple Maps / Google Maps credentials (iOS).
