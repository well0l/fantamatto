import requests
import sys
import json
import base64
from datetime import datetime
import io
from PIL import Image

class FantamattoAPITester:
    def __init__(self, base_url="https://11bb6ef3-8634-4a25-a9f2-6e867de6fb14.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_users = []
        self.created_matti = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data)
                else:
                    response = requests.post(url, json=data, headers=headers)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def create_test_image(self):
        """Create a small test image as base64"""
        # Create a simple 100x100 red image
        img = Image.new('RGB', (100, 100), color='red')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_create_user(self, username):
        """Test user creation"""
        success, response = self.run_test(
            f"Create User: {username}",
            "POST",
            "users",
            200,
            data={"username": username}
        )
        if success and 'id' in response:
            self.created_users.append(response)
            return response
        return None

    def test_create_duplicate_user(self, username):
        """Test creating duplicate user (should fail)"""
        success, response = self.run_test(
            f"Create Duplicate User: {username}",
            "POST",
            "users",
            400,
            data={"username": username}
        )
        return success

    def test_get_leaderboard(self):
        """Test getting leaderboard"""
        success, response = self.run_test(
            "Get Leaderboard",
            "GET",
            "users",
            200
        )
        return success, response

    def test_get_user_by_id(self, user_id):
        """Test getting user by ID"""
        success, response = self.run_test(
            f"Get User by ID: {user_id}",
            "GET",
            f"users/{user_id}",
            200
        )
        return success, response

    def test_create_matto(self, user_data, nickname, description, rarity):
        """Test creating a matto"""
        photo_data = f"data:image/jpeg;base64,{self.create_test_image()}"
        
        matto_data = {
            "user_id": user_data["id"],
            "username": user_data["username"],
            "photo_data": photo_data,
            "nickname": nickname,
            "description": description,
            "rarity": rarity
        }
        
        success, response = self.run_test(
            f"Create Matto: {nickname} ({rarity})",
            "POST",
            "matti",
            200,
            data=matto_data
        )
        
        if success:
            self.created_matti.append(response)
            return response
        return None

    def test_get_all_matti(self):
        """Test getting all matti"""
        success, response = self.run_test(
            "Get All Matti",
            "GET",
            "matti",
            200
        )
        return success, response

    def test_get_user_matti(self, user_id):
        """Test getting matti for specific user"""
        success, response = self.run_test(
            f"Get User Matti: {user_id}",
            "GET",
            f"matti/user/{user_id}",
            200
        )
        return success, response

    def test_point_calculation(self):
        """Test that points are calculated correctly"""
        print(f"\n🧮 Testing Point Calculation...")
        
        # Expected points for each rarity
        expected_points = {
            "common": 10,
            "rare": 25,
            "epic": 50,
            "legendary": 100
        }
        
        points_correct = True
        for matto in self.created_matti:
            expected = expected_points.get(matto["rarity"], 10)
            actual = matto["points"]
            if expected != actual:
                print(f"❌ Point calculation error for {matto['rarity']}: expected {expected}, got {actual}")
                points_correct = False
            else:
                print(f"✅ Correct points for {matto['rarity']}: {actual}")
        
        return points_correct

    def test_user_points_update(self):
        """Test that user total points are updated after matto creation"""
        print(f"\n💰 Testing User Points Update...")
        
        for user in self.created_users:
            # Get updated user data
            success, updated_user = self.test_get_user_by_id(user["id"])
            if success:
                # Calculate expected points from user's matti
                user_matti = [m for m in self.created_matti if m["user_id"] == user["id"]]
                expected_total = sum(m["points"] for m in user_matti)
                actual_total = updated_user["total_points"]
                
                if expected_total == actual_total:
                    print(f"✅ User {user['username']} points correct: {actual_total}")
                else:
                    print(f"❌ User {user['username']} points incorrect: expected {expected_total}, got {actual_total}")
                    return False
        
        return True

def main():
    print("🎮 FANTAMATTO API TESTING SUITE")
    print("=" * 50)
    
    tester = FantamattoAPITester()
    timestamp = datetime.now().strftime('%H%M%S')
    
    # Test 1: Root endpoint
    if not tester.test_root_endpoint():
        print("❌ Root endpoint failed, stopping tests")
        return 1

    # Test 2: Create users
    user1 = tester.test_create_user(f"testuser1_{timestamp}")
    user2 = tester.test_create_user(f"testuser2_{timestamp}")
    
    if not user1 or not user2:
        print("❌ User creation failed, stopping tests")
        return 1

    # Test 3: Try to create duplicate user (should fail)
    if not tester.test_create_duplicate_user(user1["username"]):
        print("❌ Duplicate user test failed")

    # Test 4: Get leaderboard
    success, leaderboard = tester.test_get_leaderboard()
    if not success:
        print("❌ Leaderboard test failed")

    # Test 5: Get users by ID
    tester.test_get_user_by_id(user1["id"])
    tester.test_get_user_by_id(user2["id"])

    # Test 6: Create matti with different rarities
    rarities = ["common", "rare", "epic", "legendary"]
    for i, rarity in enumerate(rarities):
        user = user1 if i % 2 == 0 else user2
        matto = tester.test_create_matto(
            user,
            f"TestMatto_{rarity}_{timestamp}",
            f"A test {rarity} matto",
            rarity
        )
        if not matto:
            print(f"❌ Failed to create {rarity} matto")

    # Test 7: Get all matti
    success, all_matti = tester.test_get_all_matti()
    if not success:
        print("❌ Get all matti failed")

    # Test 8: Get user-specific matti
    tester.test_get_user_matti(user1["id"])
    tester.test_get_user_matti(user2["id"])

    # Test 9: Verify point calculations
    if not tester.test_point_calculation():
        print("❌ Point calculation test failed")

    # Test 10: Verify user total points update
    if not tester.test_user_points_update():
        print("❌ User points update test failed")

    # Final results
    print(f"\n📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("⚠️  SOME TESTS FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())