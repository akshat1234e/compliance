"""
Logging Configuration
Centralized logging setup for AI/ML services
"""

import logging
import logging.handlers
import sys
from pathlib import Path
from typing import Dict, Any

from loguru import logger
from src.core.config import settings


class InterceptHandler(logging.Handler):
    """Intercept standard logging and redirect to loguru"""
    
    def emit(self, record: logging.LogRecord) -> None:
        # Get corresponding Loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller from where originated the logged message
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def setup_logging() -> None:
    """Setup logging configuration"""
    
    # Remove default loguru handler
    logger.remove()
    
    # Console logging
    if getattr(settings, 'LOG_CONSOLE_ENABLED', True):
        logger.add(
            sys.stdout,
            level=settings.LOG_LEVEL.upper(),
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                   "<level>{level: <8}</level> | "
                   "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
                   "<level>{message}</level>",
            colorize=True,
            backtrace=True,
            diagnose=True,
        )
    
    # File logging
    if getattr(settings, 'LOG_FILE_ENABLED', True):
        log_path = Path(getattr(settings, 'LOG_FILE_PATH', './logs'))
        log_path.mkdir(exist_ok=True)
        
        logger.add(
            log_path / "ai_services.log",
            level=settings.LOG_LEVEL.upper(),
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
            rotation=getattr(settings, 'LOG_FILE_MAX_SIZE', '10 MB'),
            retention=getattr(settings, 'LOG_FILE_BACKUP_COUNT', 5),
            compression="zip",
            serialize=settings.LOG_FORMAT == "json",
        )
    
    # Intercept standard logging
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    # Set specific loggers
    for logger_name in ["uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"]:
        logging_logger = logging.getLogger(logger_name)
        logging_logger.handlers = [InterceptHandler()]
        logging_logger.setLevel(logging.INFO)
    
    # Suppress noisy loggers
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)


def get_logger(name: str) -> Any:
    """Get a logger instance"""
    return logger.bind(service="ai-services", component=name)


# Create service-specific loggers
api_logger = get_logger("api")
ml_logger = get_logger("ml")
nlp_logger = get_logger("nlp")
db_logger = get_logger("database")
cache_logger = get_logger("cache")
