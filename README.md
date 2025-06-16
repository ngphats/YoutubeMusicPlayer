# 🎵 Webpack Node Music Player

A modern collaborative music streaming application built with Node.js, Express, Vue.js, and Socket.IO. Users can add YouTube videos to a shared playlist and control playback across multiple devices in real-time.

## ✨ Features

- 🎶 **Collaborative Playlist**: Multiple users can add songs to a shared playlist
- 🔍 **Music Search**: Search for songs directly from the interface
- 📱 **Multi-Device Control**: Control playback from any connected device
- 🔄 **Real-time Sync**: Changes sync instantly across all connected clients
- 🎵 **YouTube Integration**: Add songs via YouTube URLs
- 💬 **Song Comments**: Add personal messages to songs
- 🚀 **Modern UI**: Bootstrap 5 with responsive design and Font Awesome icons

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js 4.19.2
- **Frontend**: Vue.js 2.7.16, Bootstrap 5.3.3
- **Build Tool**: Webpack 5.92.1
- **Real-time**: Socket.IO 4.7.5
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project with Firestore enabled
- Firebase service account credentials

## 🚀 Installation

### 1. Clone the repository
```bash
git clone https://github.com/ngphats/webpack_node.git
cd webpack_node
```

### 2. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Configure Firebase
- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
- Enable Firestore Database
- Generate a service account key
- Save the credentials as `credentials/firestore-koi-streaming.json`

### 4. Environment setup
```bash
cp example.env .env
```

Edit the `.env` file:
```env
SERVER_PORT=8080
SOCKET_SERVER=http://localhost:8080
HOST_IP=192.168.1.112
```

### 5. Build the frontend
```bash
npm run build
```

## 🎮 Usage

### Starting the Server
```bash
npm start
```
The application will be available at `http://localhost:8080`

### Development Mode
```bash
npm run watch
```
This will watch for file changes and rebuild automatically.

### Development Server
```bash
npm run nm
```
Uses nodemon for automatic server restarts on file changes.

## 📱 How to Use

### 1. **Adding Songs**
- Click the "🔍 Search" button to search for music
- Or click "Add" to add songs directly via YouTube URL
- Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
- Add an optional message
- Click "Add Song" to add to playlist

### 2. **Controlling Playback**
- **Select Device**: Choose which device should play the music
- **Play**: Start playing the current song
- **Next**: Skip to the next song
- **Stop**: Stop playback
- Click on any song in the playlist to play it directly

### 3. **Multi-Device Setup**
- Open the app on multiple devices (phones, tablets, computers)
- Each device will appear in the "Select Device" dropdown
- Choose which device should act as the speaker
- All devices can control the playback

### 4. **Search Feature**
- Click the search button to open the search modal
- Type song names, artist names, or keywords
- Browse search results and click "Add to Playlist"

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the production server |
| `npm run nm` | Start development server with nodemon |
| `npm run build` | Build for production |
| `npm run dev` | Build for development |
| `npm run watch` | Watch mode - rebuild on changes |

## 🏗️ Project Structure

```
webpack_node/
├── app.js                 # Main server file
├── package.json           # Dependencies and scripts
├── webpack.config.js      # Webpack configuration
├── .babelrc              # Babel configuration
├── server/               # Backend code
│   ├── controllers/      # API controllers
│   ├── models/          # Database models
│   ├── router/          # Route definitions
│   └── services/        # Business logic and Socket.IO
├── resources/assets/    # Frontend source
│   └── js/
│       ├── app.js       # Vue app entry point
│       └── components/  # Vue components
├── public/              # Static assets
├── views/               # EJS templates
└── credentials/         # Firebase credentials (not in repo)
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firestore collection called `playlist` or update the model accordingly
2. Set up Firebase Authentication (optional)
3. Configure Firestore security rules

### Socket.IO Events
The app uses several Socket.IO events:
- `player_active`: Register a new player device
- `add_new_track`: Broadcast new songs to all clients
- `play`: Send play command to specific device
- `on_track_change`: Notify all clients of track changes

## 🎨 Customization

### UI Themes
The app uses Bootstrap 5 with custom CSS. You can customize:
- Colors in the CSS variables
- Card styles and layouts
- Icons (currently using Font Awesome)

### Adding New Features
1. Backend: Add routes in `server/router/`
2. Frontend: Create Vue components in `resources/assets/js/components/`
3. Real-time features: Add Socket.IO events in `server/services/socket/`

## 🐛 Troubleshooting

### Common Issues

**Build fails with dependency errors:**
```bash
npm install --legacy-peer-deps
```

**Firebase connection issues:**
- Check your credentials file path
- Verify Firebase project settings
- Ensure Firestore is enabled

**Socket.IO connection problems:**
- Check the `SOCKET_SERVER` environment variable
- Verify firewall settings
- Check browser console for errors

### Performance Optimization

The build includes performance warnings about large bundle sizes. For production:
1. Implement code splitting
2. Use lazy loading for components
3. Optimize images and assets
4. Enable gzip compression

## 🔒 Security Notes

- Never commit Firebase credentials to version control
- Use environment variables for sensitive data
- Implement proper authentication for production
- Set up Firestore security rules

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📜 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Vue.js community for the excellent framework
- Bootstrap team for the UI components
- Socket.IO for real-time capabilities
- Firebase for backend services

---

**Made with ❤️ by ngphats@gmail.com**

For issues and questions, please open an issue on GitHub.
