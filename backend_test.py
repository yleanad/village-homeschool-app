#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class VillageFriendsAPITester:
    def __init__(self, base_url="https://local-scholar-meet.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.user_token = None
        self.user_data = None
        self.family_profile = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test data
        self.test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@example.com"
        self.test_password = "TestPass123!"
        self.test_name = "Test Family"

    def log_test(self, test_name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            self.failed_tests.append({"test": test_name, "details": details})
            print(f"❌ {test_name} - {details}")

    def make_request(self, method, endpoint, data=None, headers=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        
        # Default headers
        req_headers = {'Content-Type': 'application/json'}
        if self.user_token:
            req_headers['Authorization'] = f'Bearer {self.user_token}'
        if headers:
            req_headers.update(headers)

        try:
            if method == 'GET':
                response = self.session.get(url, headers=req_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=req_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=req_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=req_headers)
            
            success = response.status_code == expected_status
            return success, response
        except Exception as e:
            return False, str(e)

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.make_request('GET', '')
        if success:
            try:
                data = response.json()
                success = "Village Friends API" in data.get("message", "")
                self.log_test("API Root", success, "" if success else f"Unexpected response: {data}")
            except:
                self.log_test("API Root", False, "Invalid JSON response")
        else:
            self.log_test("API Root", False, f"Request failed: {response}")

    def test_user_registration(self):
        """Test user registration"""
        data = {
            "name": self.test_name,
            "email": self.test_email,
            "password": self.test_password
        }
        
        success, response = self.make_request('POST', 'auth/register', data, expected_status=200)
        if success:
            try:
                result = response.json()
                if 'token' in result and 'user' in result:
                    self.user_token = result['token']
                    self.user_data = result['user']
                    self.log_test("User Registration", True)
                else:
                    self.log_test("User Registration", False, "Missing token or user in response")
            except:
                self.log_test("User Registration", False, "Invalid JSON response")
        else:
            self.log_test("User Registration", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_user_login(self):
        """Test user login"""
        data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        success, response = self.make_request('POST', 'auth/login', data, expected_status=200)
        if success:
            try:
                result = response.json()
                if 'token' in result and 'user' in result:
                    self.user_token = result['token']
                    self.user_data = result['user']
                    self.log_test("User Login", True)
                else:
                    self.log_test("User Login", False, "Missing token or user in response")
            except:
                self.log_test("User Login", False, "Invalid JSON response")
        else:
            self.log_test("User Login", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_get_current_user(self):
        """Test get current user endpoint"""
        if not self.user_token:
            self.log_test("Get Current User", False, "No auth token available")
            return
            
        success, response = self.make_request('GET', 'auth/me', expected_status=200)
        if success:
            try:
                result = response.json()
                if 'user_id' in result and 'email' in result:
                    self.log_test("Get Current User", True)
                else:
                    self.log_test("Get Current User", False, "Missing user data in response")
            except:
                self.log_test("Get Current User", False, "Invalid JSON response")
        else:
            self.log_test("Get Current User", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_create_family_profile(self):
        """Test family profile creation"""
        if not self.user_token:
            self.log_test("Create Family Profile", False, "No auth token available")
            return
            
        data = {
            "family_name": "The Test Family",
            "bio": "We are a test family for API testing",
            "city": "Austin",
            "state": "TX",
            "zip_code": "78701",
            "interests": ["Science", "Nature & Outdoors", "Reading"],
            "kids": [
                {"name": "Test Kid 1", "age": 8, "interests": ["Science"]},
                {"name": "Test Kid 2", "age": 10, "interests": ["Reading"]}
            ],
            "search_radius": 25
        }
        
        success, response = self.make_request('POST', 'family/profile', data, expected_status=200)
        if success:
            try:
                result = response.json()
                if 'family_id' in result and 'family_name' in result:
                    self.family_profile = result
                    self.log_test("Create Family Profile", True)
                else:
                    self.log_test("Create Family Profile", False, "Missing family data in response")
            except:
                self.log_test("Create Family Profile", False, "Invalid JSON response")
        else:
            self.log_test("Create Family Profile", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_get_family_profile(self):
        """Test get family profile"""
        if not self.user_token:
            self.log_test("Get Family Profile", False, "No auth token available")
            return
            
        success, response = self.make_request('GET', 'family/profile', expected_status=200)
        if success:
            try:
                result = response.json()
                if result and 'family_id' in result:
                    self.log_test("Get Family Profile", True)
                else:
                    self.log_test("Get Family Profile", False, "No family profile found")
            except:
                self.log_test("Get Family Profile", False, "Invalid JSON response")
        else:
            self.log_test("Get Family Profile", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_nearby_families(self):
        """Test nearby families discovery"""
        if not self.user_token:
            self.log_test("Nearby Families", False, "No auth token available")
            return
            
        success, response = self.make_request('GET', 'families/nearby?radius=25', expected_status=200)
        if success:
            try:
                result = response.json()
                if isinstance(result, list):
                    self.log_test("Nearby Families", True)
                else:
                    self.log_test("Nearby Families", False, "Response is not a list")
            except:
                self.log_test("Nearby Families", False, "Invalid JSON response")
        else:
            self.log_test("Nearby Families", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_create_event(self):
        """Test event creation"""
        if not self.user_token or not self.family_profile:
            self.log_test("Create Event", False, "No auth token or family profile available")
            return
            
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        data = {
            "title": "Test Playdate",
            "description": "A test playdate for API testing",
            "event_date": tomorrow,
            "event_time": "10:00",
            "location": "Test Park",
            "city": "Austin",
            "state": "TX",
            "zip_code": "78701",
            "max_attendees": 10,
            "age_range": "5-12",
            "event_type": "playdate"
        }
        
        success, response = self.make_request('POST', 'events', data, expected_status=200)
        if success:
            try:
                result = response.json()
                if 'event_id' in result and 'title' in result:
                    self.test_event_id = result['event_id']
                    self.log_test("Create Event", True)
                else:
                    self.log_test("Create Event", False, "Missing event data in response")
            except:
                self.log_test("Create Event", False, "Invalid JSON response")
        else:
            self.log_test("Create Event", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_get_events(self):
        """Test get events"""
        if not self.user_token:
            self.log_test("Get Events", False, "No auth token available")
            return
            
        success, response = self.make_request('GET', 'events', expected_status=200)
        if success:
            try:
                result = response.json()
                if isinstance(result, list):
                    self.log_test("Get Events", True)
                else:
                    self.log_test("Get Events", False, "Response is not a list")
            except:
                self.log_test("Get Events", False, "Invalid JSON response")
        else:
            self.log_test("Get Events", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_subscription_plans(self):
        """Test subscription plans endpoint"""
        success, response = self.make_request('GET', 'subscription/plans', expected_status=200)
        if success:
            try:
                result = response.json()
                if 'monthly' in result and 'annual' in result:
                    self.log_test("Subscription Plans", True)
                else:
                    self.log_test("Subscription Plans", False, "Missing plan data")
            except:
                self.log_test("Subscription Plans", False, "Invalid JSON response")
        else:
            self.log_test("Subscription Plans", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_messages_endpoint(self):
        """Test messages endpoint"""
        if not self.user_token:
            self.log_test("Messages Endpoint", False, "No auth token available")
            return
            
        success, response = self.make_request('GET', 'messages', expected_status=200)
        if success:
            try:
                result = response.json()
                if isinstance(result, list):
                    self.log_test("Messages Endpoint", True)
                else:
                    self.log_test("Messages Endpoint", False, "Response is not a list")
            except:
                self.log_test("Messages Endpoint", False, "Invalid JSON response")
        else:
            self.log_test("Messages Endpoint", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_meetup_requests(self):
        """Test meetup requests endpoint"""
        if not self.user_token:
            self.log_test("Meetup Requests", False, "No auth token available")
            return
            
        success, response = self.make_request('GET', 'meetup-requests', expected_status=200)
        if success:
            try:
                result = response.json()
                if 'incoming' in result and 'outgoing' in result:
                    self.log_test("Meetup Requests", True)
                else:
                    self.log_test("Meetup Requests", False, "Missing request data")
            except:
                self.log_test("Meetup Requests", False, "Invalid JSON response")
        else:
            self.log_test("Meetup Requests", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_calendar_events(self):
        """Test calendar events endpoint"""
        if not self.user_token:
            self.log_test("Calendar Events", False, "No auth token available")
            return
            
        success, response = self.make_request('GET', 'calendar/events', expected_status=200)
        if success:
            try:
                result = response.json()
                if isinstance(result, list):
                    self.log_test("Calendar Events", True)
                else:
                    self.log_test("Calendar Events", False, "Response is not a list")
            except:
                self.log_test("Calendar Events", False, "Invalid JSON response")
        else:
            self.log_test("Calendar Events", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_photo_upload(self):
        """Test profile photo upload"""
        if not self.user_token or not self.family_profile:
            self.log_test("Photo Upload", False, "No auth token or family profile available")
            return
            
        # Create a simple base64 image (1x1 pixel PNG)
        base64_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        data = {
            "image_data": base64_image
        }
        
        success, response = self.make_request('POST', 'family/profile/photo', data, expected_status=200)
        if success:
            try:
                result = response.json()
                if 'photo_url' in result and 'message' in result:
                    self.log_test("Photo Upload", True)
                else:
                    self.log_test("Photo Upload", False, "Missing photo_url or message in response")
            except:
                self.log_test("Photo Upload", False, "Invalid JSON response")
        else:
            self.log_test("Photo Upload", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_groups_endpoints(self):
        """Test group management endpoints"""
        if not self.user_token:
            self.log_test("Groups Endpoints", False, "No auth token available")
            return
            
        # Test get groups
        success, response = self.make_request('GET', 'groups', expected_status=200)
        if success:
            try:
                result = response.json()
                if isinstance(result, list):
                    self.log_test("Get Groups", True)
                else:
                    self.log_test("Get Groups", False, "Response is not a list")
            except:
                self.log_test("Get Groups", False, "Invalid JSON response")
        else:
            self.log_test("Get Groups", False, f"Status: {response.status_code}, Response: {response.text}")
        
        # Test get my groups
        success, response = self.make_request('GET', 'groups/my', expected_status=200)
        if success:
            try:
                result = response.json()
                if 'owned' in result and 'member_of' in result:
                    self.log_test("Get My Groups", True)
                else:
                    self.log_test("Get My Groups", False, "Missing owned or member_of in response")
            except:
                self.log_test("Get My Groups", False, "Invalid JSON response")
        else:
            self.log_test("Get My Groups", False, f"Status: {response.status_code}, Response: {response.text}")

    def test_create_group_premium_required(self):
        """Test group creation (should fail without premium)"""
        if not self.user_token or not self.family_profile:
            self.log_test("Create Group (Premium Required)", False, "No auth token or family profile available")
            return
            
        data = {
            "name": "Test Co-op",
            "description": "A test co-op for API testing",
            "city": "Austin",
            "state": "TX",
            "zip_code": "78701",
            "group_type": "co-op",
            "focus_areas": ["Math", "Science"],
            "age_range": "6-12",
            "meeting_frequency": "weekly",
            "is_private": False
        }
        
        # This should fail with 403 since user doesn't have premium
        success, response = self.make_request('POST', 'groups', data, expected_status=403)
        if success:
            self.log_test("Create Group (Premium Required)", True)
        else:
            self.log_test("Create Group (Premium Required)", False, f"Expected 403, got {response.status_code}")

    def test_set_premium_and_create_group(self):
        """Test setting premium status and creating group"""
        if not self.user_token or not self.user_data:
            self.log_test("Set Premium & Create Group", False, "No auth token or user data available")
            return
            
        # First, manually set user to premium status via direct database update
        # This simulates having an active subscription
        import pymongo
        try:
            client = pymongo.MongoClient("mongodb://localhost:27017")
            db = client["test_database"]
            
            # Update user subscription status
            result = db.users.update_one(
                {"user_id": self.user_data["user_id"]},
                {"$set": {"subscription_status": "active"}}
            )
            
            if result.modified_count > 0:
                # Now try to create a group
                data = {
                    "name": "Test Premium Co-op",
                    "description": "A test co-op for premium API testing",
                    "city": "Austin",
                    "state": "TX",
                    "zip_code": "78701",
                    "group_type": "co-op",
                    "focus_areas": ["Math", "Science"],
                    "age_range": "6-12",
                    "meeting_frequency": "weekly",
                    "is_private": False
                }
                
                success, response = self.make_request('POST', 'groups', data, expected_status=200)
                if success:
                    try:
                        result = response.json()
                        if 'group_id' in result and 'name' in result:
                            self.test_group_id = result['group_id']
                            self.log_test("Set Premium & Create Group", True)
                        else:
                            self.log_test("Set Premium & Create Group", False, "Missing group data in response")
                    except:
                        self.log_test("Set Premium & Create Group", False, "Invalid JSON response")
                else:
                    self.log_test("Set Premium & Create Group", False, f"Status: {response.status_code}, Response: {response.text}")
            else:
                self.log_test("Set Premium & Create Group", False, "Failed to update user subscription status")
                
        except Exception as e:
            self.log_test("Set Premium & Create Group", False, f"Database error: {str(e)}")

    def test_group_member_management(self):
        """Test group member role management"""
        if not self.user_token or not hasattr(self, 'test_group_id'):
            self.log_test("Group Member Management", False, "No auth token or test group available")
            return
            
        # Test getting group details
        success, response = self.make_request('GET', f'groups/{self.test_group_id}', expected_status=200)
        if success:
            try:
                result = response.json()
                if 'group_id' in result and 'members' in result:
                    self.log_test("Group Member Management", True)
                else:
                    self.log_test("Group Member Management", False, "Missing group or members data")
            except:
                self.log_test("Group Member Management", False, "Invalid JSON response")
        else:
            self.log_test("Group Member Management", False, f"Status: {response.status_code}, Response: {response.text}")

    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting Village Friends API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 50)
        
        # Basic API tests
        self.test_api_root()
        
        # Authentication tests
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        
        # Family profile tests
        self.test_create_family_profile()
        self.test_get_family_profile()
        
        # New feature: Photo upload
        self.test_photo_upload()
        
        # Discovery tests
        self.test_nearby_families()
        
        # Event tests
        self.test_create_event()
        self.test_get_events()
        
        # Group management tests (new features)
        self.test_groups_endpoints()
        self.test_create_group_premium_required()
        self.test_set_premium_and_create_group()
        self.test_group_member_management()
        
        # Other feature tests
        self.test_subscription_plans()
        self.test_messages_endpoint()
        self.test_meetup_requests()
        self.test_calendar_events()
        
        # Print results
        print("=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = VillageFriendsAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())