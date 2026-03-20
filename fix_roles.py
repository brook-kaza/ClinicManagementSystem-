import requests

URL = "http://46.225.86.61:8000/api/v1"
session = requests.Session()

# Login as admin
resp = session.post(f"{URL}/token", data={"username": "admin", "password": "admin123"})
if not resp.ok:
    print("Login failed!", resp.text)
    exit(1)
    
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Fetch all users
resp = session.get(f"{URL}/users", headers=headers)
if not resp.ok:
    print("Failed to fetch users!", resp.text)
    exit(1)

users = resp.json()
for user in users:
    print(f"User {user['username']} has role {user['role']}")
    
    # Let's capitalize the role to match our exact required roles
    new_role = user['role'].capitalize()
    
    if new_role != user['role']:
        print(f"Updating {user['username']} role from {user['role']} to {new_role}...")
        res = session.put(
            f"{URL}/users/{user['id']}/role", 
            json={"role": new_role}, 
            headers=headers
        )
        if res.ok:
            print("Successfully updated!")
        else:
            print("Failed to update!", res.text)
            
print("Done.")
