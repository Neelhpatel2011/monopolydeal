import os
from pathlib import Path

from supabase import Client, create_client

try:
    from dotenv import load_dotenv

    env_path = Path(__file__).resolve().parents[3] / ".env"
    load_dotenv(env_path)
except Exception:
    pass

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
