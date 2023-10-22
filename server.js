require('dotenv').config();
const { google } = require('googleapis');
const express = require('express');
const app = express();
const axios = require('axios');

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Set up the YouTube Data API client
const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
});

app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.get('/auth/youtube', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/youtube.readonly',
    });
    res.redirect(authUrl);
});

app.get('/auth/youtube/callback', async (req, res) => {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);
    res.redirect('/playlists');
});

app.get('/playlists', async (req, res) => {
    try {
        let playlists = [];
        let nextPageToken = null;

        do {
            const response = await youtube.playlists.list({
                part: 'snippet',
                mine: true,
                maxResults: 50, // Maximum number of results per page
                pageToken: nextPageToken, // Set the page token to fetch subsequent pages
            });

            playlists = playlists.concat(response.data.items);
            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);

        // Display the playlists
        res.send(`
        <h1>Your YouTube Playlists:</h1>
        <ul>
          ${playlists.map(playlist => `<li>${playlist.snippet.title}</li>`).join('')}
        </ul>
      `);
    } catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).send('An error occurred while fetching playlists.');
    }
});

app.get('/logout', (req, res) => {
    // Clear the locally stored tokens and any user information
    oauth2Client.revokeCredentials();
    res.send('You are now logged out.');
});


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});


