import requests
import json

# Base URL of your server
BASE_URL = "http://localhost:3007"  # Adjust this if your server is running on a different port or host

def get_serialized_id(phone_number):
    """Get the serialized ID for a given phone number."""
    response = requests.get(f"{BASE_URL}/get-id/{phone_number}")
    if response.status_code == 200:
        return response.json()['id']
    else:
        print(f"Error getting serialized ID: {response.status_code}")
        print(response.text)
        return None

def send_message(receiver_id, content, attachment_url=None):
    """Send a message to a given receiver ID."""
    payload = {
        "receiverId": receiver_id,
        "content": content,
        "attachmentUrl": attachment_url
    }
    response = requests.post(f"{BASE_URL}/send", json=payload)
    if response.status_code == 200:
        print("Message sent successfully")
    else:
        print(f"Error sending message: {response.status_code}")
        print(response.text)

def main():
    # Test phone number
    phone_number = "9500091496"

    # Get serialized ID
    serialized_id = get_serialized_id(phone_number)
    if not serialized_id:
        print("Failed to get serialized ID. Exiting.")
        return

    print(f"Serialized ID for {phone_number}: {serialized_id}")

    # Compose invoice message
    invoice_message = """Dear valued customer,

Thank you for your recent purchase. Please find attached the invoice for your order.

Order Details:
- Invoice Number: ST/24-25/S1034
- Order Date: 7/31/2024
- Total Amount: ₹66,400

If you have any questions about this invoice, please don't hesitate to contact us.

Best regards,
Your Bespoke Clothing Team"""

    # Attachment URL
    attachment_url = "https://pdf.blitzdnd.com/api/pdf/generate/template1?data=eyJpdGVtcyI6IFt7Iml0ZW0iOiAiQkVTUE9LRSBTSElSVCIsICJxdHkiOiAxLCAidW5pdFByaWNlIjogMjUwMCwgInRvdGFsUHJpY2UiOiAyNTAwfSwgeyJpdGVtIjogIkJFU1BPS0UgU0hJUlQiLCAicXR5IjogMSwgInVuaXRQcmljZSI6IDQyMDAsICJ0b3RhbFByaWNlIjogNDIwMH0sIHsiaXRlbSI6ICJCRVNQT0tFIFNISVJUIiwgInF0eSI6IDEsICJ1bml0UHJpY2UiOiA0MjAwLCAidG90YWxQcmljZSI6IDQyMDB9LCB7Iml0ZW0iOiAiQkVTUE9LRSBTSElSVCIsICJxdHkiOiAxLCAidW5pdFByaWNlIjogNTMwMCwgInRvdGFsUHJpY2UiOiA1MzAwfSwgeyJpdGVtIjogIkJFU1BPS0UgU0hJUlQiLCAicXR5IjogMSwgInVuaXRQcmljZSI6IDU3MDAsICJ0b3RhbFByaWNlIjogNTcwMH0sIHsiaXRlbSI6ICJCRVNQT0tFIFNISVJUIiwgInF0eSI6IDEsICJ1bml0UHJpY2UiOiA1NzAwLCAidG90YWxQcmljZSI6IDU3MDB9LCB7Iml0ZW0iOiAiQkVTUE9LRSBTSElSVCIsICJxdHkiOiAxLCAidW5pdFByaWNlIjogNTMwMCwgInRvdGFsUHJpY2UiOiA1MzAwfSwgeyJpdGVtIjogIkJFU1BPS0UgVFJPVVNFUiIsICJxdHkiOiAxLCAidW5pdFByaWNlIjogNDUwMCwgInRvdGFsUHJpY2UiOiA0NTAwfSwgeyJpdGVtIjogIkJFU1BPS0UgVFJPVVNFUiIsICJxdHkiOiAxLCAidW5pdFByaWNlIjogNjUwMCwgInRvdGFsUHJpY2UiOiA2NTAwfSwgeyJpdGVtIjogIkJFU1BPS0UgVFJPVVNFUiIsICJxdHkiOiAxLCAidW5pdFByaWNlIjogODAwMCwgInRvdGFsUHJpY2UiOiA4MDAwfSwgeyJpdGVtIjogIkJFU1BPS0UgVFJPVVNFUiIsICJxdHkiOiAxLCAidW5pdFByaWNlIjogNjUwMCwgInRvdGFsUHJpY2UiOiA2NTAwfSwgeyJpdGVtIjogIkJFU1BPS0UgVFJPVVNFUiIsICJxdHkiOiAxLCAidW5pdFByaWNlIjogODAwMCwgInRvdGFsUHJpY2UiOiA4MDAwfV0sICJhZHZhbmNlUGFpZCI6IDAsICJkaXNjb3VudCI6IDAsICJjdXN0b21lciI6IHsibmFtZSI6ICJNUi4gU1JJUkFNIiwgInBob25lIjogIjk5NDAzMzg5OTMiLCAiZW1haWwiOiAicnNyaXJhbTE5NjhAZ21haWwuY29tIiwgImdzdGluIjogIk4vQSIsICJhZGRyZXNzIjogIlRhbWJyYW0sIENoZW5uYWkiLCAiam9iTm8iOiAiTi9BIn0sICJwYXltZW50TWV0aG9kIjogImNhcmQiLCAiaW52b2ljZU51bWJlciI6ICJTVC8yNC0yNS9TMTAzNCIsICJpbnZvaWNlRGF0ZSI6ICI3LzMxLzIwMjQiLCAidHJhaWxEYXRlIjogIjcvMzEvMjAyNiJ9&upload=false"

    # Send message with attachment
    send_message(serialized_id, invoice_message, attachment_url)

if __name__ == "__main__":
    main()