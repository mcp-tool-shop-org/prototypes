FROM python:3.11-slim AS builder

WORKDIR /build

COPY pyproject.toml README.md LICENSE ./
COPY voice_soundboard_plugin/ voice_soundboard_plugin/

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

FROM python:3.11-slim

RUN groupadd -r soundboard && useradd -r -g soundboard soundboard

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY --chown=soundboard:soundboard voice_soundboard_plugin/ voice_soundboard_plugin/

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

USER soundboard

ENTRYPOINT ["python", "-m", "voice_soundboard_plugin.bridge.stdio_bridge"]
