# Math-Quest shared leaderboard with Supabase

1. Visit https://supabase.com/dashboard and create a project. Keep the Data API enabled and keep the database password private.
2. Open SQL Editor, create a new query, paste the entire `supabase-setup.sql` file, and click Run. Run this as the project owner. Keep the public schema exposed in Integrations → Data API.
3. Open Connect in your Supabase project. Copy its API Project URL (`https://your-project-ref.supabase.co`) and its publishable key (`sb_publishable_…`, also found under Settings → API Keys). Never put your secret key, service-role key, or database password into this game.
4. Paste those values between the quotes in `game/supabase-config.js` and save.
5. Deploy the contents of the `game` folder on a static web host so `index.html` is at the site root. For a local check, open a terminal in `game` and run `py -m http.server 8000` on Windows or `python3 -m http.server 8000` on Mac/Linux, then open http://localhost:8000.
6. Start a fresh game using a nickname. Finish all rooms and escape the maze. Open the same hosted game on another device or in a private browser window and check Leaderboard. It shows the 10 fastest finished runs and refreshes every 12 seconds while open.

Opening index.html directly uses local scores. Existing device-only scores and scores from the separate hosted version are not imported. The Supabase edition exposes nickname, class, and finish time. The database computes elapsed time and prevents duplicate finish submissions. Completion is reported by the browser and is not independently verified by the database.
