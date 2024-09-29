import requests
import sys

def reset_whatsapp_session(base_url):
    reset_url = f"{base_url}/reset"
    
    try:
        response = requests.post(reset_url)
        response.raise_for_status()
        print("Session reset initiated successfully.")
        print(response.json())
    except requests.exceptions.RequestException as e:
        print(f"Error resetting WhatsApp session: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Default to localhost if no argument is provided
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3007"
    reset_whatsapp_session(base_url)