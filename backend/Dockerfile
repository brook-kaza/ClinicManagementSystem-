# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Install system dependencies for PostgreSQL and others
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn uvicorn psycopg2-binary

# Copy the current directory contents into the container at /app
COPY . .

# Create the uploads directory if it doesn't exist
RUN mkdir -p uploads

# Pass PORT as an environment variable
ENV PORT=8000

# Run the application
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:8000"]
