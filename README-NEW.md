# 📄 Image to PDF Converter

A modern, mobile-friendly Progressive Web App (PWA) that allows users to convert multiple images into a single PDF document.

## ✨ Features

- **📱 Mobile-friendly**: Optimized for mobile devices with touch-friendly interface
- **🔄 PWA Support**: Works offline once installed, can be added to home screen
- **📷 Multiple Input Methods**: Upload from device, camera, or drag & drop (desktop)
- **🖼️ Image Preview**: Preview and reorder images before conversion
- **📄 PDF Generation**: Convert images to a single PDF using jsPDF
- **💾 Easy Download/Share**: Download PDF or share using native device sharing
- **⚡ Fast & Lightweight**: Minimal dependencies and optimized performance
- **🎨 Clean UI**: Modern, minimal design with beautiful animations

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone or download the project
cd pdfcreator

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **PDF Generation**: jsPDF
- **Styling**: CSS3 with modern features
- **PWA**: Service Worker + Web App Manifest

## 📱 PWA Features

- **Offline Support**: Works without internet after first load
- **App-like Experience**: Can be installed on mobile devices
- **Fast Loading**: Cached assets for quick startup
- **Native Sharing**: Integrates with device sharing capabilities

## 🔧 Usage

1. **Upload Images**: Click the upload area or drag & drop images
2. **Preview & Reorder**: Review your images and change their order if needed
3. **Generate PDF**: Click "Generate PDF" to create your document
4. **Download/Share**: The PDF will download automatically, or use the share button on mobile

## 📂 Project Structure

```
pdfcreator/
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js             # Service worker
│   └── icons/            # App icons
├── src/
│   ├── App.tsx           # Main application component
│   ├── App.css           # Styles
│   └── main.tsx          # Entry point
└── package.json
```

## 🎨 Customization

The app is designed to be easily customizable:

- **Colors**: Modify the CSS variables in `App.css`
- **Layout**: Adjust grid layouts and spacing
- **Features**: Add new image processing features
- **PDF Options**: Customize PDF generation settings

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

---

Built with ❤️ using React and modern web technologies.
