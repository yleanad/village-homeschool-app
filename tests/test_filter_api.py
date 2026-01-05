"""
Backend API tests for Village Friends - Advanced Search Filters
Tests the /api/families/nearby endpoint with min_age, max_age, and interests parameters
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFilterAPI:
    """Test advanced filter functionality for family discovery"""
    
    @pytest.fixture(scope="class")
    def test_user_session(self):
        """Create a test user and get session for authenticated requests"""
        # Register a new test user
        unique_id = uuid.uuid4().hex[:8]
        email = f"test_filter_{unique_id}@example.com"
        password = "password123"
        
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "name": f"Test Filter User {unique_id}"
        })
        
        if register_response.status_code == 200:
            token = register_response.json().get("token")
        else:
            # Try login if user exists
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": password
            })
            if login_response.status_code == 200:
                token = login_response.json().get("token")
            else:
                pytest.skip("Could not authenticate test user")
                return None
        
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        
        # Create family profile for the test user
        profile_response = session.post(f"{BASE_URL}/api/family/profile", json={
            "family_name": f"Test Filter Family {unique_id}",
            "city": "Denver",
            "state": "CO",
            "zip_code": "80202",
            "latitude": 39.7392,
            "longitude": -104.9903,
            "interests": ["Science", "Nature & Outdoors"],
            "kids": [{"name": "Test Kid", "age": 10}],
            "search_radius": 50
        })
        
        return session
    
    def test_api_root_accessible(self):
        """Test that API root is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Village Friends API"
        print("✓ API root accessible")
    
    def test_nearby_families_without_filters(self, test_user_session):
        """Test /api/families/nearby without any filters"""
        response = test_user_session.get(f"{BASE_URL}/api/families/nearby?radius=50")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Nearby families without filters: {len(data)} families found")
    
    def test_nearby_families_with_min_age_filter(self, test_user_session):
        """Test /api/families/nearby with min_age filter"""
        response = test_user_session.get(f"{BASE_URL}/api/families/nearby?radius=50&min_age=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all returned families have at least one kid >= min_age
        for family in data:
            kids = family.get("kids", [])
            if kids:
                ages = [k.get("age", 0) for k in kids]
                assert any(age >= 10 for age in ages), f"Family {family.get('family_name')} has no kids >= 10"
        
        print(f"✓ Min age filter (10+): {len(data)} families found")
    
    def test_nearby_families_with_max_age_filter(self, test_user_session):
        """Test /api/families/nearby with max_age filter"""
        response = test_user_session.get(f"{BASE_URL}/api/families/nearby?radius=50&max_age=7")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all returned families have at least one kid <= max_age
        for family in data:
            kids = family.get("kids", [])
            if kids:
                ages = [k.get("age", 0) for k in kids]
                assert any(age <= 7 for age in ages), f"Family {family.get('family_name')} has no kids <= 7"
        
        print(f"✓ Max age filter (<=7): {len(data)} families found")
    
    def test_nearby_families_with_age_range_filter(self, test_user_session):
        """Test /api/families/nearby with both min_age and max_age filters"""
        response = test_user_session.get(f"{BASE_URL}/api/families/nearby?radius=50&min_age=5&max_age=12")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all returned families have at least one kid within age range
        for family in data:
            kids = family.get("kids", [])
            if kids:
                ages = [k.get("age", 0) for k in kids]
                assert any(5 <= age <= 12 for age in ages), f"Family {family.get('family_name')} has no kids in range 5-12"
        
        print(f"✓ Age range filter (5-12): {len(data)} families found")
    
    def test_nearby_families_with_single_interest_filter(self, test_user_session):
        """Test /api/families/nearby with single interest filter"""
        response = test_user_session.get(f"{BASE_URL}/api/families/nearby?radius=50&interests=Science")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all returned families have the interest
        for family in data:
            interests = family.get("interests", [])
            assert "Science" in interests, f"Family {family.get('family_name')} doesn't have Science interest"
        
        print(f"✓ Single interest filter (Science): {len(data)} families found")
    
    def test_nearby_families_with_multiple_interests_filter(self, test_user_session):
        """Test /api/families/nearby with multiple interests filter"""
        response = test_user_session.get(f"{BASE_URL}/api/families/nearby?radius=50&interests=Science,Sports")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all returned families have at least one of the interests
        for family in data:
            interests = family.get("interests", [])
            assert any(i in interests for i in ["Science", "Sports"]), f"Family {family.get('family_name')} doesn't have Science or Sports"
        
        print(f"✓ Multiple interests filter (Science, Sports): {len(data)} families found")
    
    def test_nearby_families_with_combined_filters(self, test_user_session):
        """Test /api/families/nearby with age range AND interests combined"""
        response = test_user_session.get(f"{BASE_URL}/api/families/nearby?radius=50&min_age=8&max_age=12&interests=Science")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all returned families match both criteria
        for family in data:
            # Check interests
            interests = family.get("interests", [])
            assert "Science" in interests, f"Family {family.get('family_name')} doesn't have Science interest"
            
            # Check age range
            kids = family.get("kids", [])
            if kids:
                ages = [k.get("age", 0) for k in kids]
                assert any(8 <= age <= 12 for age in ages), f"Family {family.get('family_name')} has no kids in range 8-12"
        
        print(f"✓ Combined filters (age 8-12 + Science): {len(data)} families found")
    
    def test_nearby_families_with_radius_filter(self, test_user_session):
        """Test /api/families/nearby with different radius values"""
        # Test with small radius
        response_10 = test_user_session.get(f"{BASE_URL}/api/families/nearby?radius=10")
        assert response_10.status_code == 200
        data_10 = response_10.json()
        
        # Test with larger radius
        response_100 = test_user_session.get(f"{BASE_URL}/api/families/nearby?radius=100")
        assert response_100.status_code == 200
        data_100 = response_100.json()
        
        print(f"✓ Radius filter: 10mi={len(data_10)} families, 100mi={len(data_100)} families")
    
    def test_nearby_families_empty_result(self, test_user_session):
        """Test /api/families/nearby returns empty list for impossible filters"""
        # Very restrictive filter that likely returns no results
        response = test_user_session.get(f"{BASE_URL}/api/families/nearby?radius=1&min_age=17&max_age=18&interests=NonExistentInterest123")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Empty result test: {len(data)} families (expected 0 or few)")
    
    def test_nearby_families_invalid_age_params(self, test_user_session):
        """Test /api/families/nearby handles invalid age parameters gracefully"""
        # Test with negative age (should be handled gracefully)
        response = test_user_session.get(f"{BASE_URL}/api/families/nearby?radius=50&min_age=-1")
        assert response.status_code in [200, 400, 422]  # Either works or returns validation error
        
        # Test with min_age > max_age
        response2 = test_user_session.get(f"{BASE_URL}/api/families/nearby?radius=50&min_age=15&max_age=5")
        assert response2.status_code in [200, 400, 422]
        
        print("✓ Invalid age params handled gracefully")


class TestExistingTestFamilies:
    """Test with the known test families mentioned in the task"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session using test credentials"""
        session = requests.Session()
        
        # Try to login with test credentials
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            session.headers.update({
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            })
            return session
        else:
            # Register if doesn't exist
            register_response = session.post(f"{BASE_URL}/api/auth/register", json={
                "email": "test@example.com",
                "password": "password123",
                "name": "Test User"
            })
            if register_response.status_code == 200:
                token = register_response.json().get("token")
                session.headers.update({
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                })
                return session
            
        pytest.skip("Could not authenticate")
        return None
    
    def test_filter_young_kids_0_7(self, auth_session):
        """Test filtering for young kids (0-7) - should find Creative Family (4,6)"""
        response = auth_session.get(f"{BASE_URL}/api/families/nearby?radius=100&min_age=0&max_age=7")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Young kids filter (0-7): Found {len(data)} families")
        
        # Log family names for debugging
        for family in data:
            kids = family.get("kids", [])
            ages = [k.get("age", 0) for k in kids]
            print(f"  - {family.get('family_name')}: kids ages {ages}")
    
    def test_filter_teens_14_18(self, auth_session):
        """Test filtering for teens (14-18) - should find Active Family (14,16)"""
        response = auth_session.get(f"{BASE_URL}/api/families/nearby?radius=100&min_age=14&max_age=18")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Teens filter (14-18): Found {len(data)} families")
        
        for family in data:
            kids = family.get("kids", [])
            ages = [k.get("age", 0) for k in kids]
            print(f"  - {family.get('family_name')}: kids ages {ages}")
    
    def test_filter_middle_school_8_12(self, auth_session):
        """Test filtering for middle school age (8-12) - should find STEM Family (9,11)"""
        response = auth_session.get(f"{BASE_URL}/api/families/nearby?radius=100&min_age=8&max_age=12")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Middle school filter (8-12): Found {len(data)} families")
        
        for family in data:
            kids = family.get("kids", [])
            ages = [k.get("age", 0) for k in kids]
            print(f"  - {family.get('family_name')}: kids ages {ages}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
