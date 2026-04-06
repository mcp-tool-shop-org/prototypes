FROM python:3.11-slim AS builder
WORKDIR /build
COPY pyproject.toml README.md LICENSE ./
COPY flexiflow/ flexiflow/
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir ".[api]"

FROM python:3.11-slim
RUN groupadd -r flexi && useradd -r -g flexi flexi
WORKDIR /app
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY --chown=flexi:flexi flexiflow/ flexiflow/
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
USER flexi
ENTRYPOINT ["flexiflow"]
CMD ["--help"]
