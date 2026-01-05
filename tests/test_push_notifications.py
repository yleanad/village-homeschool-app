"""
Push Notification API Tests for Village Friends App
Tests: VAPID key, subscribe, unsubscribe, preferences, test notification
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://village-friends.preview.emergentagent.com')

# Test user credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"

# Test push subscription data (mock)
MOCK_SUBSCRIPTION = {
    "endpoint": f"https://fcm.googleapis.com/fcm/send/test-endpoint-{uuid.uuid4().hex[:8]}",
    "keys": {
        "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
        "auth": "tBHItJI5svbpez7KI4CCXg"
    }
}


class TestVAPIDKey:
    """Test VAPID public key endpoint"""
    
    def test_get_vapid_key_success(self):
        """GET /api/notifications/vapid-key returns the VAPID public key"""
        response = requests.get(f"{BASE_URL}/api/notifications/vapid-key")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "publicKey" in data, "Response should contain 'publicKey'"
        assert isinstance(data["publicKey"], str), "publicKey should be a string"
        assert len(data["publicKey"]) > 50, "publicKey should be a valid VAPID key (>50 chars)"
        print(f"✓ VAPID public key retrieved: {data['publicKey'][:30]}...")


class TestPushSubscription:
    """Test push subscription endpoints (requires authentication)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
        self.session = requests.Session()
        
        # Login to get session
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code} - {login_response.text}")
        
        login_data = login_response.json()
        self.token = login_data.get("token")
        self.user_id = login_data.get("user", {}).get("user_id")
        
        # Set auth header
        self.session.headers.update({
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        })
        
        print(f"✓ Logged in as {TEST_EMAIL}, user_id: {self.user_id}")
    
    def test_subscribe_to_push(self):
        """POST /api/notifications/subscribe stores push subscription"""
        # Create unique subscription for this test
        subscription = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/test-{uuid.uuid4().hex[:12]}",
            "keys": MOCK_SUBSCRIPTION["keys"]
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/notifications/subscribe",
            json=subscription
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "status" in data, "Response should contain 'status'"
        assert data["status"] in ["subscribed", "already_subscribed"], f"Unexpected status: {data['status']}"
        print(f"✓ Push subscription created: {data['status']}")
    
    def test_subscribe_duplicate(self):
        """POST /api/notifications/subscribe with same endpoint returns already_subscribed"""
        # Use same subscription twice
        subscription = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/duplicate-test-{uuid.uuid4().hex[:8]}",
            "keys": MOCK_SUBSCRIPTION["keys"]
        }
        
        # First subscription
        response1 = self.session.post(
            f"{BASE_URL}/api/notifications/subscribe",
            json=subscription
        )
        assert response1.status_code == 200
        
        # Second subscription (same endpoint)
        response2 = self.session.post(
            f"{BASE_URL}/api/notifications/subscribe",
            json=subscription
        )
        
        assert response2.status_code == 200
        data = response2.json()
        assert data["status"] == "already_subscribed", f"Expected 'already_subscribed', got {data['status']}"
        print("✓ Duplicate subscription correctly returns 'already_subscribed'")
    
    def test_unsubscribe_from_push(self):
        """DELETE /api/notifications/unsubscribe removes push subscription"""
        # First subscribe
        subscription = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/unsub-test-{uuid.uuid4().hex[:8]}",
            "keys": MOCK_SUBSCRIPTION["keys"]
        }
        
        sub_response = self.session.post(
            f"{BASE_URL}/api/notifications/subscribe",
            json=subscription
        )
        assert sub_response.status_code == 200
        
        # Then unsubscribe
        unsub_response = self.session.delete(
            f"{BASE_URL}/api/notifications/unsubscribe",
            json=subscription
        )
        
        assert unsub_response.status_code == 200, f"Expected 200, got {unsub_response.status_code}: {unsub_response.text}"
        
        data = unsub_response.json()
        assert "status" in data, "Response should contain 'status'"
        assert data["status"] == "unsubscribed", f"Expected 'unsubscribed', got {data['status']}"
        assert data.get("deleted") == True, "Should indicate subscription was deleted"
        print("✓ Push subscription removed successfully")
    
    def test_unsubscribe_nonexistent(self):
        """DELETE /api/notifications/unsubscribe with non-existent endpoint"""
        subscription = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/nonexistent-{uuid.uuid4().hex[:8]}",
            "keys": MOCK_SUBSCRIPTION["keys"]
        }
        
        response = self.session.delete(
            f"{BASE_URL}/api/notifications/unsubscribe",
            json=subscription
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "unsubscribed"
        assert data.get("deleted") == False, "Should indicate nothing was deleted"
        print("✓ Unsubscribe non-existent endpoint handled correctly")


class TestNotificationPreferences:
    """Test notification preferences endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
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
    
    def test_get_notification_preferences(self):
        """GET /api/notifications/preferences returns user's notification preferences"""
        response = self.session.get(f"{BASE_URL}/api/notifications/preferences")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "preferences" in data, "Response should contain 'preferences'"
        assert "push_enabled" in data, "Response should contain 'push_enabled'"
        
        prefs = data["preferences"]
        assert "messages" in prefs, "Preferences should include 'messages'"
        assert "events" in prefs, "Preferences should include 'events'"
        assert "meetup_requests" in prefs, "Preferences should include 'meetup_requests'"
        assert "group_updates" in prefs, "Preferences should include 'group_updates'"
        
        print(f"✓ Notification preferences retrieved: {prefs}")
        print(f"  Push enabled: {data['push_enabled']}")
    
    def test_update_notification_preferences(self):
        """PUT /api/notifications/preferences updates user's notification preferences"""
        new_prefs = {
            "messages": False,
            "events": True,
            "meetup_requests": False,
            "group_updates": True
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/notifications/preferences",
            json=new_prefs
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "status" in data, "Response should contain 'status'"
        assert data["status"] == "updated", f"Expected 'updated', got {data['status']}"
        assert "preferences" in data, "Response should contain 'preferences'"
        
        # Verify preferences were updated
        returned_prefs = data["preferences"]
        assert returned_prefs["messages"] == False, "messages should be False"
        assert returned_prefs["events"] == True, "events should be True"
        assert returned_prefs["meetup_requests"] == False, "meetup_requests should be False"
        assert returned_prefs["group_updates"] == True, "group_updates should be True"
        
        print(f"✓ Notification preferences updated: {returned_prefs}")
        
        # Restore defaults
        self.session.put(
            f"{BASE_URL}/api/notifications/preferences",
            json={"messages": True, "events": True, "meetup_requests": True, "group_updates": True}
        )
    
    def test_get_preferences_reflects_update(self):
        """GET preferences after PUT should reflect the changes"""
        # Update preferences
        new_prefs = {
            "messages": True,
            "events": False,
            "meetup_requests": True,
            "group_updates": False
        }
        
        update_response = self.session.put(
            f"{BASE_URL}/api/notifications/preferences",
            json=new_prefs
        )
        assert update_response.status_code == 200
        
        # Get preferences
        get_response = self.session.get(f"{BASE_URL}/api/notifications/preferences")
        assert get_response.status_code == 200
        
        data = get_response.json()
        prefs = data["preferences"]
        
        assert prefs["messages"] == True, "messages should be True"
        assert prefs["events"] == False, "events should be False"
        assert prefs["meetup_requests"] == True, "meetup_requests should be True"
        assert prefs["group_updates"] == False, "group_updates should be False"
        
        print("✓ GET preferences correctly reflects PUT changes")
        
        # Restore defaults
        self.session.put(
            f"{BASE_URL}/api/notifications/preferences",
            json={"messages": True, "events": True, "meetup_requests": True, "group_updates": True}
        )


class TestTestNotification:
    """Test the test notification endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
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
    
    def test_send_test_notification(self):
        """POST /api/notifications/test sends a test notification"""
        response = self.session.post(f"{BASE_URL}/api/notifications/test")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "status" in data, "Response should contain 'status'"
        assert data["status"] == "sent", f"Expected 'sent', got {data['status']}"
        
        print("✓ Test notification endpoint returned 'sent' status")
        print("  Note: Actual push delivery requires real browser subscription")


class TestAuthRequired:
    """Test that notification endpoints require authentication"""
    
    def test_subscribe_requires_auth(self):
        """POST /api/notifications/subscribe requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            json=MOCK_SUBSCRIPTION
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Subscribe endpoint requires authentication")
    
    def test_unsubscribe_requires_auth(self):
        """DELETE /api/notifications/unsubscribe requires authentication"""
        response = requests.delete(
            f"{BASE_URL}/api/notifications/unsubscribe",
            json=MOCK_SUBSCRIPTION
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Unsubscribe endpoint requires authentication")
    
    def test_preferences_get_requires_auth(self):
        """GET /api/notifications/preferences requires authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications/preferences")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET preferences endpoint requires authentication")
    
    def test_preferences_put_requires_auth(self):
        """PUT /api/notifications/preferences requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/notifications/preferences",
            json={"messages": True, "events": True, "meetup_requests": True, "group_updates": True}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ PUT preferences endpoint requires authentication")
    
    def test_test_notification_requires_auth(self):
        """POST /api/notifications/test requires authentication"""
        response = requests.post(f"{BASE_URL}/api/notifications/test")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Test notification endpoint requires authentication")
    
    def test_vapid_key_no_auth_required(self):
        """GET /api/notifications/vapid-key does NOT require authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications/vapid-key")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ VAPID key endpoint is public (no auth required)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
