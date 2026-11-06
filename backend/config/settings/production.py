"""
Production settings for Hostel Allocation & Roommate Matching System.
Tailored for Render Web Service + Supabase PostgreSQL + Vercel React SPA.
"""
import os
from .base import *  # noqa: F401, F403

DEBUG = False

# Strict Secret Key validation
SECRET_KEY = os.getenv('SECRET_KEY') or os.getenv('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set in production!")

# Host Configuration
RENDER_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if RENDER_HOSTNAME and RENDER_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_HOSTNAME)

custom_hosts = os.getenv('DJANGO_ALLOWED_HOSTS', '')
for host in custom_hosts.split(','):
    host = host.strip()
    if host and host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(host)

# Frontend Integration (Vercel)
FRONTEND_URL = os.getenv('FRONTEND_URL', '').strip()
if FRONTEND_URL:
    if FRONTEND_URL not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(FRONTEND_URL)
    if FRONTEND_URL not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(FRONTEND_URL)

# Reverse Proxy SSL Header (Render terminates SSL at edge proxy)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1')

# Cross-Domain Cookie Protections (Required for Decoupled Vercel <-> Render)
SESSION_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False

# Security headers & protections
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HTTP Strict Transport Security (HSTS)
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Supabase Connection Pooler optimization (port 6543)
if 'DATABASE_URL' in os.environ and '6543' in os.environ.get('DATABASE_URL', ''):
    DATABASES['default']['CONN_MAX_AGE'] = 0

# Email Configuration for Production (SMTP / Transactional Email Provider via Django 6.1 MAILERS)
_email_backend = os.getenv('EMAIL_BACKEND', '')
if not _email_backend or 'console' in _email_backend:
    _email_backend = 'django.core.mail.backends.smtp.EmailBackend'

MAILERS = {
    'default': {
        'BACKEND': _email_backend,
        'HOST': os.getenv('EMAIL_HOST', 'smtp.sendgrid.net'),
        'PORT': int(os.getenv('EMAIL_PORT', 587)),
        'USE_TLS': os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true', '1'),
        'USERNAME': os.getenv('EMAIL_HOST_USER', ''),
        'PASSWORD': os.getenv('EMAIL_HOST_PASSWORD', ''),
    },
}

# Production logging to stdout (Render log stream)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'production': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'production',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'apps': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}
