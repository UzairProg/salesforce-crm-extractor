# Salesforce CRM Data Extractor – Chrome Extension

A lightweight Chrome Extension that extracts key data from Salesforce Lightning CRM pages (Opportunity records) and allows exporting the extracted data as JSON or CSV.

Built as part of a technical assessment to demonstrate Chrome Extension fundamentals, DOM interaction in Single Page Applications (SPAs), and practical data extraction strategies.

---

## 🚀 Features

* Extracts key Opportunity data from Salesforce Lightning pages:

  * Opportunity Name
  * Amount
  * Close Date
  * Account Name
* Handles Salesforce Lightning’s dynamic DOM rendering using DOM change detection
* Stores extracted data locally using Chrome Storage API
* Export extracted data as JSON or CSV
* Simple popup-based UI for manual extraction and export

---

## 🧩 Chrome Extension Architecture

The extension follows standard **Manifest V3** architecture with clear separation of concerns:

* **Content Script**

  * Injected into Salesforce Lightning pages
  * Responsible for DOM detection and data extraction
* **Background Service Worker**

  * Handles message passing between popup and content script
* **Popup UI**

  * Triggers extraction manually
  * Provides export options (JSON / CSV)

This structure keeps DOM logic isolated from UI and background coordination logic.

---

## 🛠 Setup Instructions

### Prerequisites

* Google Chrome (latest version)
* Salesforce Lightning access (Developer or sandbox account)

### Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/uzairProg/salesforce-crm-extractor.git
   ```

2. Open Chrome and navigate to:

   ```
   chrome://extensions
   ```

3. Enable **Developer Mode** (top-right)

4. Click **Load unpacked** and select the project directory

5. The extension icon should now appear in the Chrome toolbar

---

## ▶️ How to Use

1. Navigate to a **Salesforce Lightning Opportunity page**
2. Click the extension icon
3. Click **Extract Current Object**
4. After extraction:

   * Click **Export as JSON** or **Export as CSV** to download the data

---

## 🧠 Technical Decisions & Rationale

### 1. Manifest V3

* Used Manifest V3 to align with current Chrome Extension standards
* Ensures better security and future compatibility

### 2. Manual Extraction (User-Triggered)

* Extraction is triggered manually via the popup
* Avoids unnecessary background scraping
* Keeps behavior predictable and safe

### 3. DOM Change Detection

Salesforce Lightning is a Single Page Application (SPA) with dynamic rendering.

* Used `MutationObserver` to detect when record components are rendered
* Avoided fixed delays (`setTimeout`) to reduce race conditions
* Ensured extraction runs only when relevant DOM elements are available

### 4. Selector Strategy

* Relied on visible labels and nearby value containers
* Avoided scraping Salesforce framework or Aura internals
* Prioritized robustness over brittle deep selectors

### 5. Graceful Handling of Dynamic Fields

* Some fields (e.g., Stage, Probability) may be rendered conditionally
* If unavailable at extraction time, the extension safely returns placeholders (`—`)
* This avoids incorrect or partial data extraction

### 6. Local Storage Only

* Used `chrome.storage.local` for simplicity
* No backend or external services required
* Keeps the extension self-contained and easy to review

### 7. Lightweight Export Implementation

* JSON and CSV export implemented in the popup
* Uses native browser APIs (`Blob`, `URL.createObjectURL`)
* No external libraries or frameworks

---

## 📦 Exported Data Format

### JSON

* Clean array of Opportunity objects
* Suitable for APIs or automation workflows

### CSV

Includes headers:

* Opportunity Name
* Amount
* Close Date
* Account Name
* Extracted At

---

## 🎯 Scope & Limitations

This project intentionally focuses on:

* Correct Chrome Extension architecture
* Safe DOM interaction in complex SPAs
* Practical, maintainable extraction logic

It does **not** include:

* Salesforce API integration
* OAuth authentication
* Pagination handling
* Cross-tab synchronization

These are deliberate scope decisions to keep the solution reliable within the assessment timeframe.

---

## 📽 Demo Video

The demo video (3–5 minutes) covers:

* Extension installation
* Extraction from a Salesforce Opportunity page
* Exporting data as JSON and CSV

---

## ✅ Bonus Features Implemented

* DOM change detection using `MutationObserver`
* Export data as CSV / JSON

---

## 👤 Author

**Uzair Mohammad**
📧 [programmeruzair@gmail.com](mailto:programmeruzair@gmail.com)
