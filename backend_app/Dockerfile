FROM python:3.11-slim

WORKDIR /app

# تثبيت httpx للقيام بـ Health Check داخلي
RUN pip install --no-cache-dir httpx

# نسخ ملف المتطلبات أولاً للاستفادة من الـ Caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# نسخ كود المشروع بالكامل (بما أن Root Directory سيكون backend_app)
COPY . .

# إعدادات الأمان: تشغيل الحاوية بمستخدم غير جذري (Non-root)
RUN addgroup --system appgroup && adduser --system --group appuser
RUN chown -R appuser:appgroup /app
USER appuser

# تعريف المنفذ (Railway يمرر البورت عبر متغير بيئة)
EXPOSE 8000

# اختبار حالة الخدمة (Health Check)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3   CMD python -c "import httpx; exit(0) if httpx.get('http://localhost:${PORT:-8000}/docs').status_code < 400 else exit(1)"

# أمر التشغيل الديناميكي
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2
