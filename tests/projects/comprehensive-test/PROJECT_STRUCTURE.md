# Project Structure - tests/projects/comprehensive-test

*Auto-generated on 11/18/2025, 1:42:15 PM*

**This file is automatically regenerated. Do not edit manually.**

## 📊 Overview

- **Total Routes**: 37 (32 pages, 5 API)
- **Components**: 7
- **Python Modules**: 6 (22 functions)
- **Authentication**: hybrid
- **Action Results Flow**: 15 route(s) use POST-redirect-GET pattern

## 🗺️ Routes Map (37 routes)

| URL | Type | File | Loader | Actions | Auth | Language |
|-----|------|------|--------|---------|------|----------|
| `` | 📄 page | `routes/index.puremix` | — | 8 | 🔒 session | 📗 puremix |
| `/admin-dashboard` | 📄 page | `routes/admin-dashboard.puremix` | — | 8 | 🔓 Public | 📗 puremix |
| `/api-testing` | 📄 page | `routes/api-testing.puremix` | ✅ | 2 | 🔒 jwt | 📗 puremix |
| `/api/auth/login` | 🔌 api | `routes/api/auth/login.ts` | — | 1 | 🔒 jwt | 📘 typescript |
| `/api/upload` | 🔌 api | `routes/api/upload.py` | — | 1 | 🔓 Public | 🐍 python |
| `/api/users` | 🔌 api | `routes/api/users.js` | — | 1 | 🔓 Public | 📗 javascript |
| `/api/users/:id` | 🔌 api | `routes/api/users/[id].js` | — | 1 | 🔓 Public | 📗 javascript |
| `/api/webhook/:service` | 🔌 api | `routes/api/webhook/[service].js` | — | 1 | 🔓 Public | 📗 javascript |
| `/ast-improvements-test` | 📄 page | `routes/ast-improvements-test.puremix` | ✅ | 2 | 🔓 Public | 📗 puremix |
| `/auth-flow-test` | 📄 page | `routes/auth-flow-test.puremix` | ✅🔄 | 3 | 🔒 hybrid | 📗 puremix |
| `/basic-form-test` | 📄 page | `routes/basic-form-test.puremix` | ✅🔄 | 1 | 🔓 Public | 📗 puremix |
| `/blog/[year]/[month]/:slug` | 📄 page | `routes/blog/[year]/[month]/[slug].puremix` | ✅ | — | 🔓 Public | 📗 puremix |
| `/build-validation-test` | 📄 page | `routes/build-validation-test.puremix` | ✅🔄 | 1 | 🔓 Public | 📗 puremix |
| `/conditional-test` | 📄 page | `routes/conditional-test.puremix` | ✅ | — | 🔓 Public | 📗 puremix |
| `/dashboard` | 📄 page | `routes/dashboard.puremix` | — | 3 | 🔓 Public | 📗 puremix |
| `/database-integration-test` | 📄 page | `routes/database-integration-test.puremix` | ✅🔄 | 8 | 🔒 session | 📗 puremix |
| `/docs/*` | 📄 page | `routes/docs/[...slug].puremix` | ✅ | — | 🔓 Public | 📗 puremix |
| `/edge-case-components` | 📄 page | `routes/edge-case-components.puremix` | — | — | 🔓 Public | 📗 puremix |
| `/edge-case-forms` | 📄 page | `routes/edge-case-forms.puremix` | ✅🔄 | 6 | 🔓 Public | 📗 puremix |
| `/edge-case-templates` | 📄 page | `routes/edge-case-templates.puremix` | ✅ | — | 🔓 Public | 📗 puremix |
| `/error-handling-test` | 📄 page | `routes/error-handling-test.puremix` | ✅🔄 | 5 | 🔒 session | 📗 puremix |
| `/file-upload-test` | 📄 page | `routes/file-upload-test.puremix` | ✅🔄 | 5 | 🔓 Public | 📗 puremix |
| `/javascript-block-execution-test` | 📄 page | `routes/javascript-block-execution-test.puremix` | ✅ | — | 🔓 Public | 📗 puremix |
| `/props-test` | 📄 page | `routes/props-test.puremix` | — | — | 🔓 Public | 📗 puremix |
| `/python-financial-test` | 📄 page | `routes/python-financial-test.puremix` | ✅🔄 | 1 | 🔓 Public | 📗 puremix |
| `/python-integration-test` | 📄 page | `routes/python-integration-test.puremix` | ✅🔄 | 1 | 🔓 Public | 📗 puremix |
| `/python-ml-test` | 📄 page | `routes/python-ml-test.puremix` | ✅🔄 | 2 | 🔓 Public | 📗 puremix |
| `/python-modules-test` | 📄 page | `routes/python-modules-test.puremix` | ✅🔄 | 4 | 🔓 Public | 📗 puremix |
| `/python-native-test` | 📄 page | `routes/python-native-test.puremix` | ✅🔄 | — | 🔓 Public | 📗 puremix |
| `/python-script-tag-test` | 📄 page | `routes/python-script-tag-test.puremix` | ✅ | 3 | 🔓 Public | 📗 puremix |
| `/routing-comprehensive-test` | 📄 page | `routes/routing-comprehensive-test.puremix` | ✅🔄 | 1 | 🔓 Public | 📗 puremix |
| `/seamless-python-test` | 📄 page | `routes/seamless-python-test.puremix` | ✅ | — | 🔓 Public | 📗 puremix |
| `/security-test` | 📄 page | `routes/security-test.puremix` | ✅🔄 | 15 | 🔒 hybrid | 📗 puremix |
| `/shop/[category]/:productId` | 📄 page | `routes/shop/[category]/[productId].puremix` | ✅ | — | 🔓 Public | 📗 puremix |
| `/typescript-javascript-test` | 📄 page | `routes/typescript-javascript-test.puremix` | — | 2 | 🔓 Public | 📗 puremix |
| `/unified-template-literals` | 📄 page | `routes/unified-template-literals.puremix` | ✅🔄 | 3 | 🔓 Public | 📗 puremix |
| `/users/:id` | 📄 page | `routes/users/[id].puremix` | ✅ | — | 🔓 Public | 📗 puremix |

**Legend:** ✅ = Has Loader, 🔄 = Uses Action Results

## 📄 Route Details

### `` - page

**File**: `routes/index.puremix`

**Server Actions**: `sayHello`, `ajaxGreeting`, `getServerStatus`, `testComponentSystem`, `refreshAllUserCards`, `demonstrateNewPatterns`, `patterns`, `syntax`

**Components Used**: `UserCard`

**Authentication**: session (session)

---

### `/admin-dashboard` - page

**File**: `routes/admin-dashboard.puremix`

**Server Actions**: `refreshSystem`, `toggleSettings`, `acknowledgeAlert`, `updateSettings`, `stressTest`, `measurePerformance`, `testIndependence`, `generateReport`

**Components Used**: `UserStats`, `ProductCard`, `NotificationPanel`, `ActivityFeed`

---

### `/api-testing` - page

**File**: `routes/api-testing.puremix`

**Loader**: `loadApiTests`

**Server Actions**: `testApiEndpoint`, `runBatchTests`

**Authentication**: jwt (jwt)

---

### `/api/auth/login` - api

**File**: `routes/api/auth/login.ts`

**HTTP Methods**: `GET`, `POST`

**Authentication**: jwt (cookie, jwt)

---

### `/api/upload` - api

**File**: `routes/api/upload.py`

**HTTP Methods**: `GET`, `POST`

---

### `/api/users` - api

**File**: `routes/api/users.js`

**HTTP Methods**: `GET`, `POST`

---

### `/api/users/:id` - api

**File**: `routes/api/users/[id].js`

**HTTP Methods**: `GET`, `POST`

---

### `/api/webhook/:service` - api

**File**: `routes/api/webhook/[service].js`

**HTTP Methods**: `GET`, `POST`

---

### `/ast-improvements-test` - page

**File**: `routes/ast-improvements-test.puremix`

**Loader**: `loadASTImprovements`

**Server Actions**: `addToCart`, `buyNow`

---

### `/auth-flow-test` - page

**File**: `routes/auth-flow-test.puremix`

**Loader**: `loadAuthTest` 🔄 *(accepts action results)*

**Server Actions**: `handleLogin`, `handleLogout`, `handleRegister` → flows to loader

**Authentication**: hybrid (session, jwt)

---

### `/basic-form-test` - page

**File**: `routes/basic-form-test.puremix`

**Loader**: `loadFormTest` 🔄 *(accepts action results)*

**Server Actions**: `handleFormSubmission` → flows to loader

---

### `/blog/[year]/[month]/:slug` - page

**File**: `routes/blog/[year]/[month]/[slug].puremix`

**Loader**: `loadPage`

---

### `/build-validation-test` - page

**File**: `routes/build-validation-test.puremix`

**Loader**: `loadBuildValidation` 🔄 *(accepts action results)*

**Server Actions**: `runValidationCheck` → flows to loader

---

### `/conditional-test` - page

**File**: `routes/conditional-test.puremix`

**Loader**: `loadConditionalTest`

---

### `/dashboard` - page

**File**: `routes/dashboard.puremix`

**Server Actions**: `refreshDashboard`, `updateDashboardSettings`, `sendDynamicData`

**Components Used**: `UserCard`

---

### `/database-integration-test` - page

**File**: `routes/database-integration-test.puremix`

**Loader**: `loadDatabaseTest` 🔄 *(accepts action results)*

**Server Actions**: `testDatabaseOperation`, `createUser`, `readUser`, `updateUser`, `deleteUser`, `testReadOperation`, `testUpdateOperation`, `testDeleteOperation` → flows to loader

**Authentication**: session (session)

---

### `/docs/*` - page

**File**: `routes/docs/[...slug].puremix`

**Loader**: `loadPage`

---

### `/edge-case-components` - page

**File**: `routes/edge-case-components.puremix`

**Components Used**: `UserCard`

---

### `/edge-case-forms` - page

**File**: `routes/edge-case-forms.puremix`

**Loader**: `loadFormEdgeCases` 🔄 *(accepts action results)*

**Server Actions**: `testEmptyForm`, `testNullValues`, `testLongStrings`, `testSpecialCharacters`, `testUnicodeEmoji`, `testComplexData` → flows to loader

---

### `/edge-case-templates` - page

**File**: `routes/edge-case-templates.puremix`

**Loader**: `loadTemplateEdgeCases`

---

### `/error-handling-test` - page

**File**: `routes/error-handling-test.puremix`

**Loader**: `loadErrorHandlingTest` 🔄 *(accepts action results)*

**Server Actions**: `triggerError`, `testPythonMissingModule`, `testPythonExecutionError`, `testPythonTimeout`, `triggerCustomError` → flows to loader

**Authentication**: session (session)

---

### `/file-upload-test` - page

**File**: `routes/file-upload-test.puremix`

**Loader**: `loadFileUploadTest` 🔄 *(accepts action results)*

**Server Actions**: `handleFileUpload`, `downloadFile`, `testFilenameAttacks`, `testMaliciousContent`, `testResourceAttacks` → flows to loader

---

### `/javascript-block-execution-test` - page

**File**: `routes/javascript-block-execution-test.puremix`

**Loader**: `loadJavaScriptTest`

---

### `/props-test` - page

**File**: `routes/props-test.puremix`

**Components Used**: `PropsTestCard`

---

### `/python-financial-test` - page

**File**: `routes/python-financial-test.puremix`

**Loader**: `loadFinancialAnalysis` 🔄 *(accepts action results)*

**Server Actions**: `calculateCustomLoan` → flows to loader

---

### `/python-integration-test` - page

**File**: `routes/python-integration-test.puremix`

**Loader**: `loadPythonIntegrationTest` 🔄 *(accepts action results)*

**Server Actions**: `runCustomPythonTest` → flows to loader

---

### `/python-ml-test` - page

**File**: `routes/python-ml-test.puremix`

**Loader**: `loadMLTest` 🔄 *(accepts action results)*

**Server Actions**: `runCustomRegression`, `runCustomDeepLearning` → flows to loader

---

### `/python-modules-test` - page

**File**: `routes/python-modules-test.puremix`

**Loader**: `loadPythonModulesTest` 🔄 *(accepts action results)*

**Server Actions**: `testFinancialModule`, `testMLModule`, `testRegressionModule`, `testModuleIntegration` → flows to loader

---

### `/python-native-test` - page

**File**: `routes/python-native-test.puremix`

**Loader**: `loadPage` 🔄 *(accepts action results)*

---

### `/python-script-tag-test` - page

**File**: `routes/python-script-tag-test.puremix`

**Loader**: `loadPythonScriptTest`

**Server Actions**: `analyze_scores`, `calculate_statistics`, `generate_report`

**Python Functions**: `analyze_scores`, `calculate_statistics`, `generate_report`

---

### `/routing-comprehensive-test` - page

**File**: `routes/routing-comprehensive-test.puremix`

**Loader**: `loadRoutingTest` 🔄 *(accepts action results)*

**Server Actions**: `testRouteScenario` → flows to loader

---

### `/seamless-python-test` - page

**File**: `routes/seamless-python-test.puremix`

**Loader**: `loadSeamlessPythonTest`

---

### `/security-test` - page

**File**: `routes/security-test.puremix`

**Loader**: `loadSecurityTest` 🔄 *(accepts action results)*

**Server Actions**: `sanitizeInput`, `validateCSRFToken`, `testSQLInjection`, `testNoSQLInjection`, `testReflectedXSS`, `testStoredXSS`, `testDOMXSS`, `testCSRF`, `testStateChange`, `testPrivilegeEscalation`, `testSessionSecurity`, `testRateLimit`, `testResourceExhaustion`, `testInformationDisclosure`, `testPathTraversal` → flows to loader

**Authentication**: hybrid (session, jwt)

---

### `/shop/[category]/:productId` - page

**File**: `routes/shop/[category]/[productId].puremix`

**Loader**: `loadPage`

---

### `/typescript-javascript-test` - page

**File**: `routes/typescript-javascript-test.puremix`

**Server Actions**: `switchTab`, `runCustomTest`

**Components Used**: `ConditionalTestComponent`

---

### `/unified-template-literals` - page

**File**: `routes/unified-template-literals.puremix`

**Loader**: `loadTemplateTest` 🔄 *(accepts action results)*

**Server Actions**: `updateTemplateTest`, `ajaxTemplateUpdate`, `getTemplateData` → flows to loader

---

### `/users/:id` - page

**File**: `routes/users/[id].puremix`

**Loader**: `loadPage`

---

## 🧩 Components (7)

| Component | File | Props | Actions | Used By |
|-----------|------|-------|---------|----------|
| `ActivityFeed` | `components/ActivityFeed.puremix` | — | filterActivities, addActivity, refreshFeed, clearActivities | — routes |
| `ConditionalTestComponent` | `components/ConditionalTestComponent.puremix` | num | testComponentAction | — routes |
| `NotificationPanel` | `components/NotificationPanel.puremix` | — | markAsRead, markAllAsRead, addNotification, toggleAddForm, cancelAdd, refreshNotifications | — routes |
| `ProductCard` | `components/ProductCard.puremix` | — | updateProduct, adjustStock, favoriteProduct | — routes |
| `PropsTestCard` | `components/PropsTestCard.puremix` | — | viewDetails, editUser, deleteUser, refreshData | — routes |
| `UserCard` | `components/UserCard.puremix` | refreshCount, status | refreshProfile, updateStatus, toggleActive, updateUserData | — routes |
| `UserStats` | `components/UserStats.puremix` | rate | refreshStats, sendAlert | — routes |

## 🐍 Python Modules (6)

| Module | File | Functions | Used In |
|--------|------|-----------|----------|
| `advanced_financial_calculator` | `services/advanced_financial_calculator.py` | analyze_custom_loan, generate_recommendations, calculate_loan_comparison, validate_loan_parameters | — |
| `financial_analyzer` | `services/financial_analyzer.py` | calculate_loan_amortization, analyze_investment_portfolio, calculate_retirement_planning, test_module_integration | — |
| `ml_analyzer` | `services/ml_analyzer.py` | analyze_dataset, train_simple_regression, classify_data_points, predict_time_series, test_ml_module | — |
| `data_processor` | `lib/data_processor.py` | process_data, validate_data, transform_data | — |
| `string_helpers` | `lib/utils/string_helpers.py` | format_text, validate_email, generate_slug | — |
| `user_controller` | `controllers/user_controller.py` | get_user_profile, update_user_settings, authenticate_user | — |

## 🔐 Authentication

**Type**: hybrid

**Session Usage**: 5 file(s)
- `routes/index.puremix`
- `routes/auth-flow-test.puremix`
- `routes/database-integration-test.puremix`
- `routes/error-handling-test.puremix`
- `routes/security-test.puremix`

**JWT Usage**: 4 file(s)
- `routes/api-testing.puremix`
- `routes/api/auth/login.ts`
- `routes/auth-flow-test.puremix`
- `routes/security-test.puremix`

**Cookie Usage**: 1 file(s)
- `routes/api/auth/login.ts`

**Protected Routes**: 7
- ``
- `/api-testing`
- `/api/auth/login`
- `/auth-flow-test`
- `/database-integration-test`
- `/error-handling-test`
- `/security-test`

## 🔄 Action Results Flow

**15 route(s)** use the action results pattern (POST-redirect-GET):

| Route | Actions | Loader |
|-------|---------|--------|
| `/auth-flow-test` | handleLogin, handleLogout, handleRegister | `loadAuthTest` |
| `/basic-form-test` | handleFormSubmission | `loadFormTest` |
| `/build-validation-test` | runValidationCheck | `loadBuildValidation` |
| `/database-integration-test` | testDatabaseOperation, createUser, readUser | `loadDatabaseTest` |
| `/edge-case-forms` | testEmptyForm, testNullValues, testLongStrings | `loadFormEdgeCases` |
| `/error-handling-test` | triggerError, testPythonMissingModule, testPythonExecutionError | `loadErrorHandlingTest` |
| `/file-upload-test` | handleFileUpload, downloadFile, testFilenameAttacks | `loadFileUploadTest` |
| `/python-financial-test` | calculateCustomLoan | `loadFinancialAnalysis` |
| `/python-integration-test` | runCustomPythonTest | `loadPythonIntegrationTest` |
| `/python-ml-test` | runCustomRegression, runCustomDeepLearning | `loadMLTest` |
| `/python-modules-test` | testFinancialModule, testMLModule, testRegressionModule | `loadPythonModulesTest` |
| `/python-native-test` | None | `loadPage` |
| `/routing-comprehensive-test` | testRouteScenario | `loadRoutingTest` |
| `/security-test` | sanitizeInput, validateCSRFToken, testSQLInjection | `loadSecurityTest` |
| `/unified-template-literals` | updateTemplateTest, ajaxTemplateUpdate, getTemplateData | `loadTemplateTest` |

**How it works:**

1. User submits form → Server action executes
2. Action returns result → Framework stores it temporarily
3. Loader receives `actionResult` as second parameter
4. Loader can react to action success/failure
5. Template renders with updated data

**Example:**

```javascript
<loader>
  async function loadPage(request, actionResult) {
    if (actionResult?.success) {
      // Handle successful form submission
      return { data: { message: "Success!", ...actionResult } };
    }
    return { data: { ... } };
  }
</loader>
```

## 🔄 Data Flow

### Regular Request Flow

```
Client Request (GET)
     ↓
Route Resolution
     ↓
Authentication Check (hybrid)
     ↓
Loader Execution (+ Python)
     ↓
Template Rendering (+ Components)
     ↓
HTML Response
```

### Form Submission Flow (with Action Results)

```
Client Form Submit (POST)
     ↓
Route Resolution
     ↓
Authentication Check (hybrid)
     ↓
Server Action Execution (+ Python)
     ↓
Action Result Stored
     ↓
Loader Execution (receives actionResult)
     ↓
Template Rendering (+ Components)
     ↓
HTML Response (with action feedback)
```

---

*Generated by PureMix Documentation Generator*
*Regenerate with: `npm run generate-docs`*
