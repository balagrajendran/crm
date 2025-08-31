Backend:

cd server
cp .env.example .env           # add your MySQL creds + JWT_SECRET
npm install
npm run seed                   # creates tables + admin@example.com/admin123
npm run dev                    # http://localhost:4000


Frontend:

cd client
npm install
# .env already has VITE_API_URL=http://localhost:4000
npm run dev                    # http://localhost:5173

Login with:

admin@example.com / admin123

ALTER TABLE users
  MODIFY COLUMN role ENUM('admin','manager','sales','agent','viewer') NOT NULL DEFAULT 'viewer';
