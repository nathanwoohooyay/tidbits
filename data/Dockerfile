FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY data/ ./data/

CMD ["python", "-m", "uvicorn", "data.api:app", "--host", "0.0.0.0", "--port", "8085"]
