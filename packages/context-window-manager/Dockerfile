FROM python:3.11-slim AS builder
WORKDIR /build
COPY pyproject.toml README.md LICENSE ./
COPY src/ src/
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir .

FROM python:3.11-slim
RUN groupadd -r cwm && useradd -r -g cwm cwm
WORKDIR /app
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY --chown=cwm:cwm src/ src/
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
USER cwm
ENTRYPOINT ["cwm"]
