# Sreedhari Ayurvedic Treatment Centre - Operations Management

This is a web application designed to manage the operations of Sreedhari Ayurvedic Treatment Centre.

## Features
- **Dashboard**: Overview of current guests, availability, and daily schedule.
- **Cottage Calendar**: Status tracking for all 10 cottages (Available/Occupied/Cleaning).
- **Booking System**: Inquiry form and availability checker.
- **Patient Records**: Digital patient profiles and history.
- **Treatment Management**: Standard plan templates and schedule automation.

## How to Run

Since this application uses modern JavaScript modules, it requires a local web server to run correctly (browsers block module loading from `file://` paths for security).

### Option 1: Using Python (Recommended)
You have Python installed, so this is the easiest way.

1. Open a terminal/command prompt in this folder.
2. Run the following command:
   ```bash
   python -m http.server
   ```
3. Open your browser and go to: [http://localhost:8000](http://localhost:8000)

### Option 2: Using VS Code Live Server
If you use Visual Studio Code:
1. Install the "Live Server" extension.
2. Right-click on `index.html` and select "Open with Live Server".

## Project Structure
- `index.html`: Main entry point.
- `css/`: Styling files.
- `js/`: Application logic.
  - `app.js`: Main router and initialization.
  - `store.js`: Central data management (Mock Data).
  - `pages/`: Individual page components.
