import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., validation_alias="DATABASE_URL")
    
    SFTP_HOST: str = Field(..., validation_alias="SFTP_HOST")
    SFTP_PORT: int = Field(22, validation_alias="SFTP_PORT")
    SFTP_USER: str = Field(..., validation_alias="SFTP_USER")
    SFTP_PASSWORD: str = Field("", validation_alias="SFTP_PASSWORD")
    SFTP_PRIVATE_KEY_PATH: str = Field("", validation_alias="SFTP_PRIVATE_KEY_PATH")
    SFTP_REMOTE_PATH: str = Field(..., validation_alias="SFTP_REMOTE_PATH")
    
    PUBLIC_IMAGE_BASE_URL: str = Field(..., validation_alias="PUBLIC_IMAGE_BASE_URL")
    AUTHORIZED_PHONE: str = Field("5548996553954", validation_alias="AUTHORIZED_PHONE")
    
    POLL_INTERVAL_SECONDS: int = Field(5, validation_alias="POLL_INTERVAL_SECONDS")
    MAX_WORKER_ATTEMPTS: int = Field(5, validation_alias="MAX_WORKER_ATTEMPTS")
    DOWNLOAD_TIMEOUT_SECONDS: int = Field(60, validation_alias="DOWNLOAD_TIMEOUT_SECONDS")
    MAX_DOWNLOAD_SIZE_BYTES: int = Field(26214400, validation_alias="MAX_DOWNLOAD_SIZE_BYTES")
    
    # Config local para arquivos temporários
    SPOOL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "spool")

    # Tracker WhatsApp Notification Service
    ZAPI_INSTANCE_ID: str = Field("", validation_alias="ZAPI_INSTANCE_ID")
    ZAPI_TOKEN: str = Field("", validation_alias="ZAPI_TOKEN")
    ZAPI_CLIENT_TOKEN: str = Field("", validation_alias="ZAPI_CLIENT_TOKEN")
    TRACKER_ENDPOINT: str = Field("https://live.evydencia.com/public/state", validation_alias="TRACKER_ENDPOINT")
    TRACKER_NOTIFY_PHONE: str = Field("5548996553954", validation_alias="TRACKER_NOTIFY_PHONE")
    TRACKER_SYSTEM_ALERT_PHONE: str = Field(
        "",
        validation_alias="TRACKER_SYSTEM_ALERT_PHONE",
    )
    TRACKER_POLL_SECONDS: int = Field(5, validation_alias="TRACKER_POLL_SECONDS")
    TRACKER_SQLITE_PATH: str = Field("data/tracker_state.db", validation_alias="TRACKER_SQLITE_PATH")
    TRACKER_LEADER_LEASE_SECONDS: int = Field(
        120,
        validation_alias="TRACKER_LEADER_LEASE_SECONDS",
    )
    NOMINATIM_USER_AGENT: str = Field("festadoscaminhoneiros-tracker/1.0", validation_alias="NOMINATIM_USER_AGENT")

    # Filas duráveis e independentes de texto/localização
    TRACKER_NOTIFICATION_MAX_ATTEMPTS: int = Field(
        5,
        validation_alias="TRACKER_NOTIFICATION_MAX_ATTEMPTS",
    )
    TRACKER_NOTIFICATION_LEASE_SECONDS: float = Field(
        45.0,
        validation_alias="TRACKER_NOTIFICATION_LEASE_SECONDS",
    )
    TRACKER_NOTIFICATION_TEXT_TTL_SECONDS: int = Field(
        300,
        validation_alias="TRACKER_NOTIFICATION_TEXT_TTL_SECONDS",
    )
    TRACKER_NOTIFICATION_LOCATION_TTL_SECONDS: int = Field(
        180,
        validation_alias="TRACKER_NOTIFICATION_LOCATION_TTL_SECONDS",
    )
    TRACKER_NOTIFICATION_POLL_SECONDS: float = Field(
        0.25,
        validation_alias="TRACKER_NOTIFICATION_POLL_SECONDS",
    )
    TRACKER_COMPLETION_SEPARATOR_COUNT: int = Field(
        3,
        ge=0,
        le=10,
        validation_alias="TRACKER_COMPLETION_SEPARATOR_COUNT",
    )
    TRACKER_LOCATION_MAX_ACCURACY_M: float = Field(
        100.0,
        validation_alias="TRACKER_LOCATION_MAX_ACCURACY_M",
    )

    # Cache de geocodificação fora do polling principal
    TRACKER_GEOCODER_CACHE_TTL_SECONDS: int = Field(
        21_600,
        validation_alias="TRACKER_GEOCODER_CACHE_TTL_SECONDS",
    )
    TRACKER_GEOCODER_CACHE_DISTANCE_M: int = Field(
        150,
        validation_alias="TRACKER_GEOCODER_CACHE_DISTANCE_M",
    )
    TRACKER_GEOCODER_STALE_CACHE_TTL_SECONDS: int = Field(
        604_800,
        validation_alias="TRACKER_GEOCODER_STALE_CACHE_TTL_SECONDS",
    )
    TRACKER_GEOCODER_STALE_CACHE_DISTANCE_M: int = Field(
        150,
        validation_alias="TRACKER_GEOCODER_STALE_CACHE_DISTANCE_M",
    )
    TRACKER_GEOCODER_JOB_MAX_AGE_SECONDS: int = Field(
        120,
        validation_alias="TRACKER_GEOCODER_JOB_MAX_AGE_SECONDS",
    )
    TRACKER_GEOCODER_MAX_ATTEMPTS: int = Field(
        3,
        validation_alias="TRACKER_GEOCODER_MAX_ATTEMPTS",
    )
    TRACKER_GEOCODER_RETRY_BASE_SECONDS: float = Field(
        0.25,
        validation_alias="TRACKER_GEOCODER_RETRY_BASE_SECONDS",
    )

    # Panorama Street View via Chrome/Selenium (não usa API key paga)
    TRACKER_PANORAMA_ENABLED: bool = Field(True, validation_alias="TRACKER_PANORAMA_ENABLED")
    TRACKER_COMBINED_MESSAGE_ENABLED: bool = Field(
        True,
        validation_alias="TRACKER_COMBINED_MESSAGE_ENABLED",
    )
    TRACKER_PANORAMA_CAPTION_MAX_CHARS: int = Field(
        900,
        validation_alias="TRACKER_PANORAMA_CAPTION_MAX_CHARS",
    )
    TRACKER_PANORAMA_HEADLESS: bool = Field(True, validation_alias="TRACKER_PANORAMA_HEADLESS")
    TRACKER_CHROME_BINARY: str = Field("", validation_alias="TRACKER_CHROME_BINARY")
    TRACKER_CHROMEDRIVER_PATH: str = Field("", validation_alias="TRACKER_CHROMEDRIVER_PATH")
    TRACKER_PANORAMA_WINDOW_WIDTH: int = Field(1280, validation_alias="TRACKER_PANORAMA_WINDOW_WIDTH")
    TRACKER_PANORAMA_WINDOW_HEIGHT: int = Field(720, validation_alias="TRACKER_PANORAMA_WINDOW_HEIGHT")
    TRACKER_PANORAMA_PAGE_TIMEOUT_SECONDS: float = Field(
        25.0,
        validation_alias="TRACKER_PANORAMA_PAGE_TIMEOUT_SECONDS",
    )
    TRACKER_PANORAMA_SETTLE_SECONDS: float = Field(
        2.5,
        validation_alias="TRACKER_PANORAMA_SETTLE_SECONDS",
    )
    TRACKER_PANORAMA_RETRIES: int = Field(1, validation_alias="TRACKER_PANORAMA_RETRIES")
    TRACKER_PANORAMA_USE_SWIFTSHADER: bool = Field(
        True,
        validation_alias="TRACKER_PANORAMA_USE_SWIFTSHADER",
    )
    TRACKER_PANORAMA_NO_SANDBOX: bool = Field(
        False,
        validation_alias="TRACKER_PANORAMA_NO_SANDBOX",
    )
    TRACKER_PANORAMA_MAX_JPEG_BYTES: int = Field(
        2_000_000,
        validation_alias="TRACKER_PANORAMA_MAX_JPEG_BYTES",
    )
    TRACKER_PANORAMA_RETRY_COOLDOWN_MINUTES: int = Field(
        5,
        validation_alias="TRACKER_PANORAMA_RETRY_COOLDOWN_MINUTES",
    )
    TRACKER_PANORAMA_NO_IMAGERY_COOLDOWN_MINUTES: int = Field(
        360,
        validation_alias="TRACKER_PANORAMA_NO_IMAGERY_COOLDOWN_MINUTES",
    )
    TRACKER_PANORAMA_NO_IMAGERY_RETRY_DISTANCE_M: int = Field(
        500,
        validation_alias="TRACKER_PANORAMA_NO_IMAGERY_RETRY_DISTANCE_M",
    )
    TRACKER_PANORAMA_STREET_CHANGE_MIN_DISTANCE_M: int = Field(
        60,
        validation_alias="TRACKER_PANORAMA_STREET_CHANGE_MIN_DISTANCE_M",
    )
    TRACKER_PANORAMA_MAX_FIX_AGE_SECONDS: int = Field(
        120,
        validation_alias="TRACKER_PANORAMA_MAX_FIX_AGE_SECONDS",
    )
    TRACKER_PANORAMA_FUTURE_TOLERANCE_SECONDS: int = Field(
        30,
        validation_alias="TRACKER_PANORAMA_FUTURE_TOLERANCE_SECONDS",
    )
    TRACKER_PANORAMA_MAX_ACCURACY_M: float = Field(
        75.0,
        validation_alias="TRACKER_PANORAMA_MAX_ACCURACY_M",
    )
    TRACKER_PANORAMA_JOB_MAX_AGE_SECONDS: int = Field(
        120,
        validation_alias="TRACKER_PANORAMA_JOB_MAX_AGE_SECONDS",
    )
    TRACKER_PANORAMA_SEND_ATTEMPTS: int = Field(
        3,
        validation_alias="TRACKER_PANORAMA_SEND_ATTEMPTS",
    )

    # Configurações de Mapa do Rastreamento (Mosaico de 3 mapas)
    TRACKER_MAP_ENABLED: bool = Field(True, validation_alias="TRACKER_MAP_ENABLED")
    TRACKER_MAP_INTERVAL_MINUTES: int = Field(15, validation_alias="TRACKER_MAP_INTERVAL_MINUTES")
    TRACKER_MAP_MAX_INTERVAL_MINUTES: int = Field(45, validation_alias="TRACKER_MAP_MAX_INTERVAL_MINUTES")
    TRACKER_MAP_MIN_PROGRESS_M: float = Field(400.0, validation_alias="TRACKER_MAP_MIN_PROGRESS_M")
    TRACKER_MAP_MAX_FIX_AGE_SECONDS: int = Field(120, validation_alias="TRACKER_MAP_MAX_FIX_AGE_SECONDS")
    TRACKER_MAP_MAX_ACCURACY_M: float = Field(75.0, validation_alias="TRACKER_MAP_MAX_ACCURACY_M")
    TRACKER_MAP_MAX_OFF_ROUTE_M: float = Field(200.0, validation_alias="TRACKER_MAP_MAX_OFF_ROUTE_M")
    TRACKER_MAP_MAX_JPEG_BYTES: int = Field(2_000_000, validation_alias="TRACKER_MAP_MAX_JPEG_BYTES")
    TRACKER_MAP_TRANSITION_COOLDOWN_MINUTES: int = Field(
        5,
        validation_alias="TRACKER_MAP_TRANSITION_COOLDOWN_MINUTES"
    )
    
    # Caminhos para os GeoJSON da rota e do ponto de partida
    TRACKER_MAP_ROUTE_GEOJSON_PATH: str = Field(
        "shared/geodata/procissao-route-v1.geojson",
        validation_alias="TRACKER_MAP_ROUTE_GEOJSON_PATH"
    )
    TRACKER_MAP_START_GEOJSON_PATH: str = Field(
        "shared/geodata/procissao-start-v1.geojson",
        validation_alias="TRACKER_MAP_START_GEOJSON_PATH"
    )

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
