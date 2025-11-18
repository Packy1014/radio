# Radio Streaming Web Application

A modern web-based radio streaming application featuring live audio playback, song ratings, and metadata display. Built with Node.js and vanilla JavaScript.

## Features

- **Live Radio Streaming**: HLS audio streaming using hls.js
- **Song Ratings**: Thumbs up/down rating system for songs
- **Now Playing**: Real-time display of current track information
- **Recently Played**: View song history
- **User Management**: User accounts and authentication
- **Responsive Design**: Mobile-friendly interface with custom styling

## Tech Stack

### Backend
- **Server**: Express.js (v5.1.0)
- **Database**: SQLite with better-sqlite3 driver
- **Runtime**: Node.js
- **Configuration**: dotenv for environment variables

### Frontend
- **Audio Streaming**: hls.js for HLS playback
- **UI Framework**: Vanilla JavaScript (no frameworks)
- **Styling**: Custom CSS with Montserrat and Open Sans fonts
- **Storage**: localStorage for user session management

## Project Structure

```
radio/
├── server.js              # Express application and API routes
├── database.js            # SQLite database setup and queries
├── package.json           # Dependencies and scripts
├── .env                   # Environment configuration
├── .gitignore            # Git ignore rules
├── RadioCalicoStyle/     # Brand assets and style guide
│   ├── RadioCalico_style_Guide.txt
│   └── RadioCalicoLogoTM.png
└── public/               # Static frontend files
    ├── index.html        # HTML structure
    ├── styles.css        # All CSS styling
    ├── app.js            # JavaScript application logic
    └── logo.png          # Radio logo image
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Packy1014/radio.git
cd radio
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional):
```bash
cp .env.example .env
# Edit .env with your preferred settings
```

4. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

5. Open your browser to http://localhost:3000

## API Endpoints

### Health Check
- `GET /api/test` - Test API connectivity
- `GET /api/db-test` - Test database connection

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com"
  }
  ```

### Posts
- `GET /api/posts` - Get all posts with user information
- `POST /api/posts` - Create a new post
  ```json
  {
    "userId": 1,
    "title": "Post Title",
    "content": "Post content"
  }
  ```

### Song Ratings
- `POST /api/ratings` - Submit or update a song rating
  ```json
  {
    "songId": "song-123",
    "userId": 1,
    "rating": 1  // 1 for thumbs up, -1 for thumbs down
  }
  ```
- `GET /api/ratings/:songId?userId=X` - Get rating counts and user's rating for a song

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Posts Table
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Song Ratings Table
```sql
CREATE TABLE song_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating IN (-1, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(song_id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Configuration

Environment variables in `.env`:

```
PORT=3000                    # Server port
DATABASE_PATH=./data.db      # SQLite database file path
NODE_ENV=development         # Environment mode
```

## Development

### Adding New Features

**Database Changes**: Edit `database.js` in the `initDatabase()` function
- Use `CREATE TABLE IF NOT EXISTS` for safety
- Enable foreign keys: `db.pragma('foreign_keys = ON')`
- Use prepared statements for all queries

**API Routes**: Add routes in `server.js`
- Use try/catch for error handling
- Return JSON with `{ success: boolean, ... }` structure
- Validate required fields (return 400 for missing data)
- Return 500 for server errors

**Frontend Changes**:
- **HTML**: Edit `public/index.html` for structure
- **CSS**: Edit `public/styles.css` for styling
- **JavaScript**: Edit `public/app.js` for functionality

### Testing API Endpoints

Create a user:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com"}'
```

Submit a song rating:
```bash
curl -X POST http://localhost:3000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"songId":"song-123","userId":1,"rating":1}'
```

Get rating statistics:
```bash
curl http://localhost:3000/api/ratings/song-123?userId=1
```

## Brand Guidelines

This application follows the Radio Calico brand guidelines:
- Style guide: `RadioCalicoStyle/RadioCalico_style_Guide.txt`
- Logo: `RadioCalicoStyle/RadioCalicoLogoTM.png`
- Fonts: Montserrat (headings), Open Sans (body)
- Custom color scheme per brand specifications

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is available under the MIT License.

## Acknowledgments

- HLS streaming powered by [hls.js](https://github.com/video-dev/hls.js/)
- Database powered by [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- Web framework: [Express.js](https://expressjs.com/)
