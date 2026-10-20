# PharmaSpot Point of Sale - Enhanced Edition

[![Upstream Reference](https://img.shields.io/badge/Upstream-drkNsubuga%2FPharmaSpot-informational?style=for-the-badge&logo=github)](https://github.com/drkNsubuga/PharmaSpot)
[![Enhanced by c-odenat](https://img.shields.io/badge/Enhanced%20by-Nathaniel%20Darko-success?style=for-the-badge&logo=github)](https://github.com/c-odenat)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **Attribution & Origin**: This repository is an upgraded and customized edition of [drkNsubuga/PharmaSpot](https://github.com/drkNsubuga/PharmaSpot). All credit for the original project architecture belongs to the original creator, [drkNsubuga](https://github.com/drkNsubuga). This edition incorporates custom feature upgrades, API extensions, and UI enhancements developed by **Nathaniel Darko** ([@c-odenat](https://github.com/c-odenat)).

---

## Upgrades & Enhancements in this Edition

Developed and implemented by **Nathaniel Darko**:

- **New Supplier Management System (`api/suppliers.js`)**: Added a complete backend CRUD API and `@seald-io/nedb` datastore for tracking pharmaceutical vendors, distributors, and procurement contacts.
- **Safe System Data Clearing Endpoint (`api/settings.js`)**: Implemented `/clear-all-data` endpoint to safely flush mock/test inventory, transactions, and product uploads while strictly preserving user accounts and security settings.
- **Point of Sale Workflow Overhaul (`assets/js/pos.js`)**: Extensively optimized cashier checkout routines (+1,400 lines of logic), including rapid product search, improved tab management, and real-time cart calculations.
- **Modernized UI / UX Styling (`assets/css/core.css`, `assets/css/pages.css`, `index.html`)**: Modernized layout grids, responsive modals, streamlined transaction filter views, and cleaner form typography.
- **Dependency Modernization**: Transitioned storage layer to `@seald-io/nedb` to ensure reliable file locking and persistent database storage across modern Node.js versions.

---

## Features

- **Multi-PC Support:** Allows multiple computers on a network to access a central database, ensuring data consistency across all locations.
- **Receipt Printing:** Generate professional receipts for your customers, making transactions more convenient.
- **Product Search:** Quickly find products by scanning barcodes, simplifying inventory management.
- **Staff Accounts and Permissions:** Create user accounts with various permission levels to control access and actions within the system.
- **Product and Category Management:** Easily manage your products and categorize them for efficient organization.
- **User Management:** Administer and maintain user accounts for your staff members.
- **Basic Stock Management:** Keep track of your inventory and update stock levels as needed.
- **Open Tabs and Orders:** Manage open tabs and orders to accommodate customer preferences.
- **Customer Database:** Maintain a customer database to personalize interactions and build loyalty.
- **Transaction History:** Access a comprehensive record of all transactions for reference and reporting.
- **Transaction Filtering:** Filter transactions by till, cashier, or status, providing valuable insights into your sales.
- **Date Range Filtering:** Narrow down transactions based on specific date ranges for in-depth analysis.
- **Custom Barcode Support:** Define custom barcodes for products, enhancing flexibility in inventory management.

---

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/c-odenat/PharmaSpot.git
   cd PharmaSpot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

---

## Author & Upstream Credit

- **Upstream Author**: [drkNsubuga](https://github.com/drkNsubuga/PharmaSpot)
- **Enhanced Edition**: [Nathaniel Darko (@c-odenat)](https://github.com/c-odenat)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
