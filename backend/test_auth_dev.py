#!/usr/bin/env python3

"""
Test authentication system in development mode.
"""

import requests
import json

def test_auth_endpoints():
    """Test authentication endpoints with development mode."""
    
    base_url = "http://localhost:8000"
    
    print("🔐 Testing Authentication System (Development Mode)")
    print("=" * 60)
    
    # Test health endpoint (no auth required)
    print("\n1. Testing Health Endpoint (No Auth Required)")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health endpoint working")
            data = response.json()
            print(f"   Status: {data.get('status')}")
            print(f"   BigQuery: {data.get('bigquery_connected')}")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
    
    # Test auth profile endpoint (development mode)
    print("\n2. Testing Auth Profile Endpoint (Dev Mode)")
    try:
        response = requests.get(f"{base_url}/auth/profile")
        if response.status_code == 200:
            print("✅ Auth profile endpoint working")
            data = response.json()
            print(f"   User ID: {data.get('user_id')}")
            print(f"   Email: {data.get('email')}")
            print(f"   Roles: {data.get('roles')}")
            print(f"   Client ID: {data.get('client_id')}")
            print(f"   Super Admin: {data.get('is_super_admin')}")
        else:
            print(f"❌ Auth profile failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Auth profile error: {e}")
    
    # Test client context endpoint
    print("\n3. Testing Client Context Endpoint")
    try:
        response = requests.get(f"{base_url}/auth/client-context")
        if response.status_code == 200:
            print("✅ Client context endpoint working")
            data = response.json()
            print(f"   Active Client ID: {data.get('active_client_id')}")
            print(f"   User Client ID: {data.get('user_client_id')}")
            print(f"   Can Switch Clients: {data.get('can_switch_clients')}")
        else:
            print(f"❌ Client context failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Client context error: {e}")
    
    # Test protected units endpoint with dev auth
    print("\n4. Testing Protected Units Endpoint")
    try:
        response = requests.get(f"{base_url}/api/v1/units?page=1&page_size=5")
        if response.status_code == 200:
            print("✅ Units endpoint accessible")
            data = response.json()
            print(f"   Total units: {data.get('total', 0)}")
            print(f"   Units returned: {len(data.get('units', []))}")
        else:
            print(f"❌ Units endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Units endpoint error: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 Next Steps:")
    print("1. Set up Auth0 account with the values you need")
    print("2. Update .env files with Auth0 configuration")
    print("3. Switch from get_current_user_dev to get_current_user")
    print("4. Test with real Auth0 tokens")
    print("5. Add client-aware data routing")

if __name__ == "__main__":
    test_auth_endpoints()
