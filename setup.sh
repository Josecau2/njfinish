#!/bin/bash
# Setup script for NJ Cabinets application

echo "🏗️  Setting up NJ Cabinets application..."

# Check if .env files exist, if not create them from examples
if [ ! -f .env ]; then
    echo "📝 Creating backend .env file from example..."
    cp .env.example .env
    echo "✅ Please edit .env file with your configuration"
else
    echo "✅ Backend .env file already exists"
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend .env file from example..."
    cp frontend/.env.example frontend/.env
    echo "✅ Please edit frontend/.env file with your configuration"
else
    echo "✅ Frontend .env file already exists"
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env files with your configuration"
echo "2. Make sure XAMPP/MySQL is running"
echo "3. Import the database: mysql -u root njcabinets_db < njcabinates_db.sql"
echo "4. Start backend: npm start or node index.js"
echo "5. Start frontend: cd frontend && npm start"
echo ""
echo "🌐 Development URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:8080"
echo "- API: http://localhost:8080/api"
