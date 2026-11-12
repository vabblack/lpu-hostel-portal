#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=== [1/3] Installing backend dependencies ==="
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "=== [2/3] Collecting production static files (WhiteNoise) ==="
python manage.py collectstatic --noinput

echo "=== [3/4] Running database migrations ==="
python manage.py migrate --noinput

echo "=== [4/4] Seeding authoritative LPU residence data ==="
python manage.py seed_demo_data || true

echo "=== Render build completed successfully ==="
