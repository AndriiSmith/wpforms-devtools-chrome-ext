# WPForms DevTools Chrome Extension.

A browser extension that provides development tools and utilities for WPForms developers.

Most of the code is generated by AI in the Windsurf AI IDE.

## Features

- Advanced logging capabilities
- Error tracking and monitoring
- Customizable utility tools
- Interactive tab panels
- Modern and intuitive user interface

## Development Environment

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AndriiSmith/wpforms-devtools-chrome-ext.git
cd wpforms-devtools-chrome-ext
```

2. Install dependencies:
```bash
npm install
```

### Development

To run the extension in development mode:

```bash
npm run dev
```

### Building

To build the extension for production:

```bash
npm run build
```

The built extension will be available in the `extension` directory.

## Install Build

1. Download the released `wpforms-devtools-chrome-ext-X.X.X.zip`
 from the [releases](https://github.com/AndriiSmith/wpforms-devtools-chrome-ext/releases).
2. Unzip the archive.
3. Load the extension by following the [instructions](#loading-the-extension).

## Loading the Extension

1. Open your browser's extension management page.
2. Enable "Developer mode".
3. Click "Load unpacked".
4. Select the `extension` directory.

## Settings

### Error Log

To setup error log monitoring
1. Open the settings popup (cog icon in the top-right panel corner)
2. Enter the extension directory and the error log path.
3. Swithch to the Error Log tab
4. Copy terminal command and run it in a separate terminal window.
5. The log file content should appear automatically once logWatch server started.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
