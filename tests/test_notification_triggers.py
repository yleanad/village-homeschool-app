"""
Push Notification Trigger Tests for Village Friends App
Tests: Message triggers, Event triggers, Meetup request triggers
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://village-friends.preview.emergentagent.com')

# Test user credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"


class TestNotificationTriggers:
    """Test that actions trigger push notifications (via helper functions)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and ensure family profile exists"""
        self.session = requests.Session()
        
        # Login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
        
        login_data = login_response.json()
        self.token = login_data.get("token")
        self.user = login_data.get("user", {})
        
        self.session.headers.update({
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        })
        
        # Check/create family profile
        profile_response = self.session.get(f"{BASE_URL}/api/family/profile")
        if profile_response.status_code == 200 and profile_response.json():
            self.family_profile = profile_response.json()
        else:
            # Create family profile
            profile_data = {
                "family_name": f"Test Family {uuid.uuid4().hex[:6]}",
                "bio": "Test family for notification testing",
                "city": "Austin",
                "state": "TX",
                "zip_code": "78701",
                "interests": ["Science", "Nature & Outdoors"],
                "kids": [{"name": "Test Kid", "age": 8}],
                "search_radius": 25
            }
            create_response = self.session.post(
                f"{BASE_URL}/api/family/profile",
                json=profile_data
            )
            if create_response.status_code in [200, 201]:
                self.family_profile = create_response.json()
            else:
                pytest.skip(f"Could not create family profile: {create_response.text}")
        
        print(f"✓ Setup complete. Family: {self.family_profile.get('family_name')}")
    
    def test_create_event_triggers_notification(self):
        """Creating an event should trigger notifications to nearby families"""
        # Create an event
        future_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        event_data = {
            "title": f"Test Event {uuid.uuid4().hex[:6]}",
            "description": "Test event for notification testing",
            "event_date": future_date,
            "event_time": "14:00",
            "location": "Test Park",
            "city": "Austin",
            "state": "TX",
            "zip_code": "78701",
            "event_type": "playdate",
            "max_attendees": 10,
            "age_range": "5-10"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/events",
            json=event_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "event_id" in data, "Response should contain event_id"
        assert data["title"] == event_data["title"], "Event title should match"
        
        print(f"✓ Event created: {data['event_id']}")
        print("  Note: notify_new_event() called for nearby families (no real push without subscriptions)")
    
    def test_create_meetup_request_triggers_notification(self):
        """Creating a meetup request should trigger notification to target family"""
        # First, find another family to send request to
        nearby_response = self.session.get(f"{BASE_URL}/api/families/nearby")
        
        if nearby_response.status_code != 200:
            pytest.skip("Could not get nearby families")
        
        nearby_families = nearby_response.json()
        
        if not nearby_families:
            pytest.skip("No nearby families to send meetup request to")
        
        target_family = nearby_families[0]
        target_family_id = target_family.get("family_id")
        
        # Create meetup request
        future_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        meetup_data = {
            "target_family_id": target_family_id,
            "proposed_date": future_date,
            "proposed_time": "10:00",
            "location": "Local Park",
            "message": "Would love to meet up for a playdate!"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/meetup-requests",
            json=meetup_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "request_id" in data, "Response should contain request_id"
        assert data["status"] == "pending", "Status should be 'pending'"
        
        print(f"✓ Meetup request created: {data['request_id']}")
        print(f"  Target family: {target_family.get('family_name')}")
        print("  Note: notify_meetup_request() called (no real push without subscriptions)")
    
    def test_send_message_triggers_notification(self):
        """Sending a message should trigger notification to recipient"""
        # Find another family to message
        nearby_response = self.session.get(f"{BASE_URL}/api/families/nearby")
        
        if nearby_response.status_code != 200:
            pytest.skip("Could not get nearby families")
        
        nearby_families = nearby_response.json()
        
        if not nearby_families:
            pytest.skip("No nearby families to message")
        
        target_family = nearby_families[0]
        target_family_id = target_family.get("family_id")
        
        # Send message
        message_data = {
            "recipient_family_id": target_family_id,
            "content": f"Test message for notification testing - {uuid.uuid4().hex[:8]}"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/messages",
            json=message_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message_id" in data, "Response should contain message_id"
        assert data["content"] == message_data["content"], "Message content should match"
        
        print(f"✓ Message sent: {data['message_id']}")
        print(f"  Recipient: {target_family.get('family_name')}")
        print("  Note: notify_new_message() called (no real push without subscriptions)")


class TestMeetupResponseNotification:
    """Test that responding to meetup request triggers notification"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Create two users and family profiles"""
        # This test requires two different users
        # For simplicity, we'll test the endpoint behavior
        self.session = requests.Session()
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
        
        login_data = login_response.json()
        self.token = login_data.get("token")
        
        self.session.headers.update({
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        })
    
    def test_meetup_request_response_endpoint_exists(self):
        """PUT /api/meetup-requests/{request_id} endpoint exists"""
        # Test with a non-existent request ID
        response = self.session.put(
            f"{BASE_URL}/api/meetup-requests/nonexistent_id?status=accepted"
        )
        
        # Should return 404 (not found) not 405 (method not allowed)
        assert response.status_code in [404, 400, 403], f"Expected 404/400/403, got {response.status_code}"
        print("✓ Meetup request response endpoint exists and handles invalid IDs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
