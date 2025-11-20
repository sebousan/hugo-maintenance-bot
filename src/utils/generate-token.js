// scripts/utils/generate-token.js
import { google } from 'googleapis';
import readline from 'readline';
import { logger } from './logger.js'; // ou console.log
import dotenv from "dotenv";
dotenv.config();

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost' // URL de redirection valide
);

const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify'
];

// Génère le lien d'autorisation
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent' // Force le refresh token à être retourné
});

console.log('Authorise this app by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the code from that page here: ', (code) => {
  rl.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      logger.error('Error retrieving access token', err);
      return;
    }
    // Affiche le refresh token
    logger.success('Refresh token:', token.refresh_token);
    logger.info('Access token:', token.access_token);
    logger.info('Token expiry:', token.expiry_date);

    // Vous pouvez aussi sauvegarder le token complet dans un fichier
    // fs.writeFileSync('token.json', JSON.stringify(token));
  });
});
