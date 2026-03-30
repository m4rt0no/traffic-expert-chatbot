import logging
from typing import Optional
from .agent_logic import traffic_agent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def chat_with_agent(user_input: str, session_id: Optional[str] = None) -> str:
    logger.info(f"User input: {user_input}")
    try:
        result = traffic_agent.invoke(user_input)
        output = result.get("output", "No response from agent.")
        logger.info(f"Agent output: {output}")
        return output
    except Exception as e:
        logger.error(f"Error: {e}")
        return f"⚠️ Error interno: {e}"
