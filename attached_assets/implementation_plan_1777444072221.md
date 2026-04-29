# Ad Management, Language Selection, Settings Sidebar & Location-Based Listings

Complete overhaul of the sell/ad creation flow, post-login language selection, settings sidebar navigation, and location-based search infrastructure across both frontend (React Native/Expo) and backend (Django REST).

---

## User Review Required

> [!IMPORTANT]
> **Map Provider**: For the "Select from Map" feature (drag-pin on map), we need a map SDK. Options:
> - **`react-native-maps`** (Google Maps / Apple Maps) — most mature, but requires Google Cloud API key
> - **`expo-location`** (already installed) for reverse geocoding + a static map screenshot approach
>
> Which approach do you prefer? For now, the plan assumes `react-native-maps` for the interactive map pin-drag + `expo-location` for reverse geocoding.

> [!IMPORTANT]
> **Confetti Animation**: For the celebration poppers on publish, we'll use `react-native-confetti-cannon` (lightweight, no native deps). Is this acceptable or do you prefer another library?

> [!WARNING]
> **Django GeoDjango vs django-location-field**: For lat/lon storage + proximity search:
> - **GeoDjango + PostGIS**: Most powerful (ST_DWithin, distance ordering), but requires PostGIS extension on your Postgres server
> - **Simple lat/lon fields + Haversine formula**: No PostGIS needed, works with any Postgres, slightly less performant for huge datasets
>
> The plan uses **simple lat/lon fields + raw SQL Haversine** to avoid PostGIS dependency. If you have PostGIS available, we can switch to GeoDjango.

> [!IMPORTANT]
> **Ad Pricing**: You mentioned "Ad Price amount saved in dashboard and global settings." We'll add `ad_price` to the existing `PlatformFee` model (singleton). Default 100 PKR. First 2 ads free, then wallet deducted.

## Open Questions

> [!IMPORTANT]
> 1. **Language Options**: What languages should be available? Assuming **English** and **Urdu (اردو)**. Should we also include regional like Sindhi, Pashto, Punjabi?
> 2. **Scheduled Publish**: "Schedule for later" — should the user pick a date/time? Should we use Celery beat to auto-publish at that time?
> 3. **Map API Key**: Do you have a Google Maps API key for the interactive map with pin drag? Or should we use OpenStreetMap (free but less feature-rich)?
> 4. **Draft Auto-Save**: Should drafts auto-save as user progresses through steps, or only when they explicitly click "Save as Draft"?
> 5. **Cover Image Default**: If user doesn't explicitly set a cover image, should the first uploaded media become the cover by default?

---

## Proposed Changes

### Phase 1 — Backend Changes (`D:\Originl Qurbani\qurbani-backend`)

---

#### 1.1 User Model — Language Preference

#### [MODIFY] [models.py](file:///D:/Originl%20Qurbani/qurbani-backend/apps/identity/models.py)

Add `preferred_language` field to User model:
```python
LANGUAGE_CHOICES = (
    ("en", "English"),
    ("ur", "Urdu"),
)
preferred_language = models.CharField(
    max_length=5, choices=LANGUAGE_CHOICES, default="en"
)
```

#### [MODIFY] [serializers.py](file:///D:/Originl%20Qurbani/qurbani-backend/apps/identity/serializers.py)

- Add `preferred_language` to `UserSerializer` fields
- Add `preferred_language` to `allowed_fields` in `UserDetailView.patch`

#### [MODIFY] [views.py](file:///D:/Originl%20Qurbani/qurbani-backend/apps/identity/views.py)

- Add `preferred_language` to allowed PATCH fields for regular users

---

#### 1.2 AnimalListing Model — Overhaul for Ads System

#### [MODIFY] [models.py](file:///D:/Originl%20Qurbani/qurbani-backend/apps/animals/models.py)

Major additions to `AnimalListing`:
```python
# Status & Publishing
STATUS_CHOICES = (
    ("draft", "Draft"),
    ("published", "Published"),
    ("inactive", "Inactive"),
    ("scheduled", "Scheduled"),
)
status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="draft", db_index=True)
scheduled_at = models.DateTimeField(blank=True, null=True)
published_at = models.DateTimeField(blank=True, null=True)

# Location (lat/lon for proximity search)
latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
province = models.CharField(max_length=80, blank=True, db_index=True)
district = models.CharField(max_length=80, blank=True, db_index=True)
street_address = models.TextField(blank=True)

# Media
cover_image_index = models.PositiveSmallIntegerField(default=0)

# Keywords (for hashtag search)
keywords = models.JSONField(default=list, blank=True)

# Ad fee tracking
ad_fee_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
```

#### [MODIFY] [serializers.py](file:///D:/Originl%20Qurbani/qurbani-backend/apps/animals/serializers.py)

- Add new fields to both `AnimalListingSerializer` and `AnimalCreateSerializer`
- Create `AnimalUpdateSerializer` for edit operations
- Create `MyAdsSerializer` with status info

#### [MODIFY] [views.py](file:///D:/Originl%20Qurbani/qurbani-backend/apps/animals/views.py)

Add new endpoints:
- `GET /api/animals/my-ads/` — list user's own ads (all statuses)
- `PATCH /api/animals/{id}/` — update ad (only owner)
- `DELETE /api/animals/{id}/` — soft-delete ad (set inactive)
- `POST /api/animals/{id}/publish/` — publish a draft
- `POST /api/animals/{id}/toggle-status/` — activate/deactivate
- Proximity search: `GET /api/animals/?lat=X&lon=Y&radius=50` (Haversine distance)
- Keyword search: `GET /api/animals/?keywords=motabakra`

#### [MODIFY] [urls.py](file:///D:/Originl%20Qurbani/qurbani-backend/apps/animals/urls.py)

Register new action routes on the ViewSet.

---

#### 1.3 Platform Settings — Ad Price

#### [MODIFY] [models.py](file:///D:/Originl%20Qurbani/qurbani-backend/apps/wallet/models.py)

Add `ad_price` to `PlatformFee`:
```python
ad_price = models.DecimalField(
    max_digits=10, decimal_places=2, default=100,
    help_text="Price per ad after first 2 free (PKR)"
)
free_ad_limit = models.PositiveSmallIntegerField(
    default=2, help_text="Number of free ads per user"
)
```

#### [MODIFY] [admin.py](file:///D:/Originl%20Qurbani/qurbani-backend/apps/wallet/admin.py)

Add `ad_price` and `free_ad_limit` to admin form.

#### [NEW] [views_settings.py](file:///D:/Originl%20Qurbani/qurbani-backend/apps/wallet/views_settings.py)

New public endpoint `GET /api/settings/platform/` returning ad_price, free_ad_limit, buyer_percentage, seller_percentage.

---

#### 1.4 Migration

#### [NEW] migration file (auto-generated)

Run `python manage.py makemigrations` after model changes.

---

### Phase 2 — Frontend: Language Selection Post-Login

---

#### 2.1 Language Selection Screen

#### [NEW] [language-select.tsx](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/app/auth/language-select.tsx)

New screen shown after successful login/register:
- Two large cards: English 🇬🇧 and اردو 🇵🇰
- Saves to backend (`PATCH /auth/users/{id}/`) and local AsyncStorage
- Navigates to `/(tabs)` after selection

#### [MODIFY] [AppContext.tsx](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/contexts/AppContext.tsx)

- Add `language` to User interface
- Add `setLanguage` function
- Store language in AsyncStorage + sync with backend
- Add `preferred_language` to mapUser

#### [MODIFY] [login.tsx](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/app/auth/login.tsx)

- After successful login, check if user has `preferred_language` set
  - If not → navigate to `/auth/language-select`
  - If yes → navigate to `/(tabs)`

#### [MODIFY] [mappers.ts](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/lib/mappers.ts)

- Map `preferred_language` from API response

---

### Phase 3 — Frontend: Settings Sidebar (Drawer)

---

#### [NEW] [SettingsDrawer.tsx](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/components/SettingsDrawer.tsx)

A slide-in sidebar from the right with:
- **Language Switch** — toggle between en/ur
- **Sign Off** button — calls logout + navigates to login
- **Notifications** — opens notification details list
- **Wallet** — navigates to `/wallet`
- **My Ads** — navigates to `/my-ads` (user's ad list)

#### [MODIFY] [_layout.tsx](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/app/_layout.tsx)

- Add Stack.Screen for new routes: `auth/language-select`, `my-ads`, `my-ads/create`

#### [MODIFY] [index.tsx](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/app/(tabs)/index.tsx)

- Add hamburger/settings icon to header that opens `SettingsDrawer`
- Keep bell icon and chat icon on top as usual

---

### Phase 4 — Frontend: My Ads Screen

---

#### [NEW] [my-ads/index.tsx](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/app/my-ads/index.tsx)

List of user's own ads:
- FlatList of ad cards showing thumbnail, title, price, status
- **Draft** indicator: draft icon overlay on top-right corner
- **Published** indicator: globe icon overlay on top-right corner
- **Inactive** indicator: eye-off icon overlay
- Each card → tap to view/edit
- Long-press or swipe → remove / toggle active/inactive
- **Floating "Create Ad" button** at bottom right

#### [MODIFY] [index.tsx](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/app/(tabs)/index.tsx)

- Change the "Sell" floating button to navigate to `/my-ads` instead of `/sell`

---

### Phase 5 — Frontend: Multi-Step Ad Creation (Complete Rewrite of sell.tsx)

---

#### [NEW] [my-ads/create.tsx](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/app/my-ads/create.tsx)

Complete 4-step wizard, each step on its own screen area but stepper progress visible on top:

**Stepper Component** — 4 circles connected by lines, clickable to switch between completed steps.

**Step 1: Media Upload**
- Media placeholder with "Click to upload media" text
- Upload or capture (images/videos) via `expo-image-picker`
- Shows thumbnails as they upload to server
- 3-dot menu on each media → "Make Cover" / "Remove"
- Eye icon on cover image
- Full-screen preview on tap, swipe to go back to gallery
- Max 5 media items; placeholder hidden when 5 reached

**Step 2: Select Location**
- MapAddress row with map icon + placeholder text
- Tap → opens Map dialog with draggable pin
- On save → captures reverse-geocoded address, fills fields below
- Changing district clears city; changing province clears district+city
- Fields: Province → District → City → Street Address (textarea, 3-4 lines)
- lat/lon saved to backend

**Step 3: Animal Attributes**
- Category dropdown (bakra, cow, dumba, etc.)
- Title, Weight, Breed, Khasi/Andal toggle, Price, Age
- Description textarea with hashtag detection (#motabakra → highlighted brown)
- Keywords extracted and saved

**Step 4: Publish**
- Three options: "Publish Now" / "Save as Draft" / "Schedule for Later"
- Ad pricing logic: if user has >2 published ads AND wallet balance insufficient → show "Please add funds" label
- On publish → **Confetti animation** 🎉 + "See your ad live" button

#### [DELETE] [sell.tsx](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/app/sell.tsx)

Old sell screen replaced by the new multi-step wizard at `/my-ads/create`.

---

### Phase 6 — Frontend: Map Dialog Component

---

#### [NEW] [MapPinDialog.tsx](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/components/MapPinDialog.tsx)

Modal with:
- Interactive map (react-native-maps or MapView)
- Draggable pin
- "Save" button at bottom
- On save → reverse geocode pin location → return address + lat/lon
- Map screenshot for the MapAddress display

---

### Phase 7 — Frontend: Confetti Celebration

---

#### [NEW] [ConfettiOverlay.tsx](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/components/ConfettiOverlay.tsx)

Reusable confetti animation component using `react-native-confetti-cannon` or custom Reanimated particles.

---

### Phase 8 — Backend: Proximity Search

---

#### [MODIFY] [views.py](file:///D:/Originl%20Qurbani/qurbani-backend/apps/animals/views.py)

Add Haversine-based proximity filter to `get_queryset()`:
```python
# When lat, lon, radius are provided
lat = request.query_params.get("lat")
lon = request.query_params.get("lon")
radius = request.query_params.get("radius", 50)  # km

if lat and lon:
    from django.db.models import F, FloatField, Value
    from django.db.models.functions import ACos, Cos, Radians, Sin
    # Haversine annotation
    qs = qs.annotate(
        distance=Value(6371) * ACos(
            Cos(Radians(Value(float(lat)))) *
            Cos(Radians(F("latitude"))) *
            Cos(Radians(F("longitude")) - Radians(Value(float(lon)))) +
            Sin(Radians(Value(float(lat)))) *
            Sin(Radians(F("latitude")))
        , output_field=FloatField())
    ).filter(distance__lte=float(radius)).order_by("distance")
```

---

### Phase 9 — Session Management (1-Month Login)

---

#### Already configured ✅

The backend JWT config already has `REFRESH_TOKEN_LIFETIME: 30 days` in [settings.py](file:///D:/Originl%20Qurbani/qurbani-backend/qurbani/settings.py#L207-L209). The mobile app's token refresh interceptor in [api.ts](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/lib/api.ts#L63-L85) automatically refreshes tokens. User stays logged in until manual sign-off.

No changes needed — just ensure the logout flow properly clears tokens (already implemented).

---

### Phase 10 — API Client Updates

---

#### [MODIFY] [api.ts](file:///d:/Originl%20Qurbani/Qurbani/artifacts/qurbani-market/lib/api.ts)

Add new endpoints:
```typescript
// Animals - My Ads
animals.myAds()                    // GET /animals/my-ads/
animals.update(id, payload)        // PATCH /animals/{id}/
animals.delete(id)                 // DELETE /animals/{id}/
animals.publish(id)                // POST /animals/{id}/publish/
animals.toggleStatus(id)           // POST /animals/{id}/toggle-status/

// User - Language
auth.updateLanguage(lang)          // PATCH /auth/users/{id}/ with preferred_language

// Platform settings
settings.getPlatform()             // GET /settings/platform/
```

---

## Summary of New/Modified Files

### Backend (`qurbani-backend`)

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `apps/identity/models.py` | Add `preferred_language` to User |
| MODIFY | `apps/identity/serializers.py` | Expose `preferred_language` |
| MODIFY | `apps/identity/views.py` | Allow language update in PATCH |
| MODIFY | `apps/animals/models.py` | Add status, lat/lon, province, district, keywords, cover_image_index, ad_fee_paid |
| MODIFY | `apps/animals/serializers.py` | New serializers for update, my-ads |
| MODIFY | `apps/animals/views.py` | My-ads, publish, toggle, proximity search, keyword search |
| MODIFY | `apps/animals/urls.py` | Register new routes |
| MODIFY | `apps/wallet/models.py` | Add ad_price, free_ad_limit to PlatformFee |
| MODIFY | `apps/wallet/admin.py` | Admin for new fields |
| NEW | `apps/wallet/views_settings.py` | Platform settings endpoint |
| MODIFY | `apps/wallet/urls.py` | Add settings route |

### Frontend (`qurbani-market`)

| Action | File | Purpose |
|--------|------|---------|
| NEW | `app/auth/language-select.tsx` | Post-login language picker |
| NEW | `app/my-ads/index.tsx` | User's ad list with status overlays |
| NEW | `app/my-ads/create.tsx` | 4-step ad creation wizard |
| NEW | `components/SettingsDrawer.tsx` | Side navbar with language, signoff, notifications, wallet, my-ads |
| NEW | `components/MapPinDialog.tsx` | Interactive map with draggable pin |
| NEW | `components/ConfettiOverlay.tsx` | Celebration animation |
| NEW | `components/StepperProgress.tsx` | Reusable 4-step stepper indicator |
| NEW | `components/MediaGallery.tsx` | Media upload grid with cover selection |
| DELETE | `app/sell.tsx` | Replaced by my-ads/create.tsx |
| MODIFY | `app/_layout.tsx` | Register new routes |
| MODIFY | `app/(tabs)/index.tsx` | Sell FAB → my-ads, settings drawer |
| MODIFY | `app/(tabs)/profile.tsx` | Add "My Ads" link |
| MODIFY | `app/auth/login.tsx` | Redirect to language-select if needed |
| MODIFY | `contexts/AppContext.tsx` | Language state, myAds methods |
| MODIFY | `lib/api.ts` | New API endpoints |
| MODIFY | `lib/mappers.ts` | Map new fields |

---

## Verification Plan

### Automated Tests
- Run `python manage.py makemigrations --check` to verify model changes
- Run `python manage.py migrate` to apply
- Test API endpoints via Postman/curl:
  - `POST /api/auth/login/` → verify `preferred_language` in response
  - `PATCH /api/auth/users/{id}/` with `preferred_language`
  - `POST /api/animals/` with lat/lon/status fields
  - `GET /api/animals/my-ads/`
  - `GET /api/animals/?lat=33.6&lon=73.0&radius=50`
  - `POST /api/animals/{id}/publish/`
  - `GET /api/settings/platform/`

### Manual Verification
- Test the full ad creation flow: Media → Location → Attributes → Publish
- Verify confetti animation on publish
- Verify language selection screen appears after first login
- Verify settings drawer opens/closes properly
- Verify My Ads list shows correct status overlays (draft/published/inactive)
- Verify map pin drag + reverse geocode populates address fields
- Verify proximity search returns nearby animals

### Build Verification
- `npx expo start` to ensure no TypeScript or bundler errors
- Test on Android device/emulator for native features (camera, location, maps)
