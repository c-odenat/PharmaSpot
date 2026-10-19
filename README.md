# ðŸ’Š PharmaSpot Point of Sale - Enhanced Edition

[![Upstream Reference](https://img.shields.io/badge/Upstream-drkNsubuga%2FPharmaSpot-informational?style=for-the-badge&logo=github)](https://github.com/drkNsubuga/PharmaSpot)
[![Enhanced by c-odenat](https://img.shields.io/badge/Enhanced%20by-Nathaniel%20Darko-success?style=for-the-badge&logo=github)](https://github.com/c-odenat)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **Attribution & Origin**: This repository is an upgraded and customized edition of [drkNsubuga/PharmaSpot](https://github.com/drkNsubuga/PharmaSpot). All credit for the original project architecture belongs to the original creator, [drkNsubuga](https://github.com/drkNsubuga). This edition incorporates custom feature upgrades, API extensions, and UI enhancements developed by **Nathaniel Darko** ([@c-odenat](https://github.com/c-odenat)).

---

## ðŸŒŸ Upgrades & Enhancements in this Edition

Developed and implemented by **Nathaniel Darko**:

- ðŸšš **New Supplier Management System (pi/suppliers.js)**: Added a complete backend CRUD API and @seald-io/nedb datastore for tracking pharmaceutical vendors, distributors, and procurement contacts.
- ðŸ”„ **Safe System Data Clearing Endpoint (pi/settings.js)**: Implemented /clear-all-data endpoint to safely flush mock/test inventory, transactions, and product uploads while strictly preserving user accounts and security settings.
- âš¡ **Point of Sale Workflow Overhaul (ssets/js/pos.js)**: Extensively optimized cashier checkout routines (+1,400 lines of logic), including rapid product search, improved tab management, and real-time cart calculations.
- ðŸŽ¨ **Modernized UI / UX Styling (ssets/css/core.css, ssets/css/pages.css, index.html)**: Modernized layout grids, responsive modals, streamlined transaction filter views, and cleaner form typography.
- ðŸ“¦ **Dependency Modernization**: Transitioned storage layer to @seald-io/nedb to ensure reliable file locking and persistent database storage across modern Node.js versions.

---

# PharmaSpot Point of Sale
![GitHub package.json version](https://img.shields.io/github/package-json/v/drkNsubuga/PharmaSpot) ![GitHub all releases](https://img.shields.io/github/downloads/drkNsubuga/PharmaSpot/total) [![Build](https://github.com/drkNsubuga/PharmaSpot/actions/workflows/build.yml/badge.svg)](https://github.com/drkNsubuga/PharmaSpot/actions/workflows/build.yml) [![Release](https://github.com/drkNsubuga/PharmaSpot/actions/workflows/release.yml/badge.svg)](https://github.com/drkNsubuga/PharmaSpot/actions/workflows/release.yml) [![GitHub issues](https://img.shields.io/github/issues/drkNsubuga/PharmaSpot)](https://github.com/drkNsubuga/PharmaSpot) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/drkNsubuga/PharmaSpot/blob/main/LICENSE)

![PharmaSpot Logo](assets/images/logo.svg)

PharmaSpot is a cross-platform Point of Sale system designed for pharmacies and built to streamline operations and enhance customer service.

## Features

âœ”ï¸ **Multi-PC Support:** Allows multiple computers on a network to access a central database, ensuring data consistency across all locations.

âœ”ï¸ **Receipt Printing:** Generate professional receipts for your customers, making transactions more convenient.

âœ”ï¸ **Product Search:** Quickly find products by scanning barcodes, simplifying inventory management.

âœ”ï¸ **Staff Accounts and Permissions:** Create user accounts with various permission levels to control access and actions within the system.

âœ”ï¸ **Product and Category Management:** Easily manage your products and categorize them for efficient organization.

âœ”ï¸ **User Management:** Administer and maintain user accounts for your staff members.

âœ”ï¸ **Basic Stock Management:** Keep track of your inventory and update stock levels as needed.

âœ”ï¸ **Open Tabs and Orders:** Manage open tabs and orders to accommodate customer preferences.

âœ”ï¸ **Customer Database:** Maintain a customer database to personalize interactions and build loyalty.

âœ”ï¸ **Transaction History:** Access a comprehensive record of all transactions for reference and reporting.

âœ”ï¸ **Transaction Filtering:** Filter transactions by till, cashier, or status, providing valuable insights into your sales.

âœ”ï¸ **Date Range Filtering:** Narrow down transactions based on specific date ranges for in-depth analysis.

âœ”ï¸ **Custom Barcode Support:** Define custom barcodes for products, enhancing flexibility in inventory management.

âœ”ï¸ **Product Expiry Date Tracking:** Keep an eye on product expiry dates to prevent sales of expired items.

âœ”ï¸ **Profit Calculation:** Calculate profit per item and total profit, helping you make informed business decisions.

âœ”ï¸ **Low Stock Alerts:** Receive alerts for low stock levels to avoid running out of popular products.

âœ”ï¸ **Expiry Date Alerts:** Stay informed about product expiration dates, reducing waste and potential liabilities.

âœ”ï¸ **Improved UI** Enjoy a fresh, modern look with enhanced display quality, making the user experience more appealing.


## Demo

[PharmaSpot Video Preview](https://github.com/drkNsubuga/PharmaSpot/assets/12871099/14e32721-b5d6-4186-bb63-be59733862c3)

| **Point of Sale** |  **Payment Point** |
|--|--|
|<img src="screenshots/pos.png" alt="PharmaSpot Demo - POS" width="80%"/>  |<img src="screenshots/payment.png" alt="PharmaSpot Demo - Payment" width="80%"/>|
| **Receipt** |  **Transactions** |
| <img src="screenshots/receipt.png" alt="PharmaSpot Demo-Receipt" width="80%"/>| <img src="screenshots/transactions.png" alt="PharmaSpot Demo - Transactions" width="80%"/>|
| **Status Alerts** | **More on the Roadmap** |
|<img src="screenshots/alerts.png" alt="PharmaSpot Demo - Status Alerts" width="80%"/>| <ul><li>Auto Updates</li><li>Back up</li><li>Restore</li><li>Export to excel</li></ul>


## Getting Started
- Download [PharmaSpot](https://github.com/drkNsubuga/PharmaSpot/releases/latest)
- Unzip the package to a location of your choice.
- Click the ``PharmaSpot`` executable in the folder
- Login for default user:

	- ``username:`` admin
	- ``password:`` admin

## For Developers
- Clone this project.
- Open terminal and navigate into the cloned folder.
- Run ```npm install``` to install dependencies.
- Run ```npm run start```.
- Run ```gulp``` to bundle css and js assets
- Run ```npm run test``` to run tests
  
## Credits

Adapted from [tngoman](https://github.com/tngoman/Store-POS).

Feel free to report any issues or suggest enhancements via [GitHub Issues](https://github.com/drkNsubuga/PharmaSpot/issues). 

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. Take a moment to review the [Contributing Guidelines](https://github.com/drkNsubuga/PharmaSpot/blob/main/CONTRIBUTING.md).

## License

PharmaSpot Point of Sale is licensed under the [MIT License](https://github.com/drkNsubuga/PharmaSpot/blob/main/LICENSE).

